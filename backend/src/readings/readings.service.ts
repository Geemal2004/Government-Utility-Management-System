import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource, Between, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { MeterReading, ReadingSource } from '../database/entities/meter-reading.entity';
import { Meter } from '../database/entities/meter.entity';
import { MeterReader } from '../database/entities/meter-reader.entity';
import {
  CreateMeterReadingDto,
  BulkCreateReadingsDto,
  UpdateMeterReadingDto,
  MeterReadingResponseDto,
  ReadingFilterDto,
  ReadingValidationResultDto,
  ConsumptionSummaryDto,
  SortOrder,
} from './dto';
import { PaginatedResponseDto } from '../common/dto/pagination.dto';
import { BillingService } from '../billing/billing.service';
import { MeterReadingCreatedEvent } from './events';

/**
 * Service for managing meter readings
 * Handles CRUD operations, validation, and consumption calculations
 */
@Injectable()
export class ReadingsService {
  private readonly logger = new Logger(ReadingsService.name);

  // Thresholds for validation warnings
  private readonly HIGH_CONSUMPTION_MULTIPLIER = 3; // 3x average is suspicious
  private readonly LOW_CONSUMPTION_THRESHOLD = 0; // Zero or negative is suspicious
  private readonly DAYS_FOR_AVERAGE = 90; // Days to consider for average calculation

  constructor(
    @InjectRepository(MeterReading)
    private readingRepository: Repository<MeterReading>,
    @InjectRepository(Meter)
    private meterRepository: Repository<Meter>,
    @InjectRepository(MeterReader)
    private meterReaderRepository: Repository<MeterReader>,
    private dataSource: DataSource,
    @Inject(forwardRef(() => BillingService))
    private billingService: BillingService,
    private eventEmitter: EventEmitter2,
  ) {}

  // ==================== FIND METHODS ====================

  /**
   * Find all readings with filtering and pagination
   */
  async findAll(filters: ReadingFilterDto): Promise<PaginatedResponseDto<MeterReadingResponseDto>> {
    const {
      meterId,
      meterReaderId,
      readingSource,
      startDate,
      endDate,
      page = 1,
      limit = 10,
      sortBy = 'readingDate',
      order = SortOrder.DESC,
    } = filters;

    const skip = (page - 1) * limit;

    const queryBuilder = this.readingRepository
      .createQueryBuilder('reading')
      .leftJoinAndSelect('reading.meter', 'meter')
      .leftJoinAndSelect('meter.utilityType', 'utilityType')
      .leftJoinAndSelect('reading.meterReader', 'meterReader')
      .leftJoinAndSelect('meterReader.employee', 'employee');

    // Apply filters
    if (meterId) {
      queryBuilder.andWhere('reading.meterId = :meterId', { meterId });
    }

    if (meterReaderId) {
      queryBuilder.andWhere('reading.meterReaderId = :meterReaderId', { meterReaderId });
    }

    if (readingSource) {
      queryBuilder.andWhere('reading.readingSource = :readingSource', { readingSource });
    }

    if (startDate) {
      queryBuilder.andWhere('reading.readingDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('reading.readingDate <= :endDate', { endDate });
    }

    // Apply sorting
    const validSortFields = ['readingId', 'readingDate', 'importReading', 'createdAt'];
    const sortField = validSortFields.includes(sortBy)
      ? `reading.${sortBy}`
      : 'reading.readingDate';
    queryBuilder.orderBy(sortField, order === SortOrder.DESC ? 'DESC' : 'ASC');

    // Apply pagination
    queryBuilder.skip(skip).take(limit);

    const [readings, total] = await queryBuilder.getManyAndCount();

    this.logger.log(`Found ${readings.length} readings out of ${total} total (page ${page})`);

    const items = readings.map((reading) => MeterReadingResponseDto.fromEntity(reading));

    return {
      items,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page * limit < total,
        hasPreviousPage: page > 1,
      },
    };
  }

  /**
   * Find a single reading by ID
   */
  async findOne(id: number): Promise<MeterReadingResponseDto> {
    const reading = await this.readingRepository.findOne({
      where: { readingId: id },
      relations: ['meter', 'meter.utilityType', 'meterReader', 'meterReader.employee'],
    });

    if (!reading) {
      this.logger.warn(`Reading with ID ${id} not found`);
      throw new NotFoundException(`Meter reading with ID ${id} not found`);
    }

    this.logger.log(`Retrieved reading ${id} for meter ${reading.meterId}`);
    return MeterReadingResponseDto.fromEntity(reading);
  }

  /**
   * Find all readings for a specific meter
   */
  async findByMeter(
    meterId: number,
    options?: { limit?: number; startDate?: Date; endDate?: Date },
  ): Promise<MeterReadingResponseDto[]> {
    const { limit = 100, startDate, endDate } = options || {};

    const queryBuilder = this.readingRepository
      .createQueryBuilder('reading')
      .leftJoinAndSelect('reading.meter', 'meter')
      .leftJoinAndSelect('meter.utilityType', 'utilityType')
      .leftJoinAndSelect('reading.meterReader', 'meterReader')
      .leftJoinAndSelect('meterReader.employee', 'employee')
      .where('reading.meterId = :meterId', { meterId })
      .orderBy('reading.readingDate', 'DESC')
      .take(limit);

    if (startDate) {
      queryBuilder.andWhere('reading.readingDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('reading.readingDate <= :endDate', { endDate });
    }

    const readings = await queryBuilder.getMany();

    this.logger.log(`Found ${readings.length} readings for meter ${meterId}`);

    return readings.map((reading) => MeterReadingResponseDto.fromEntity(reading));
  }

  /**
   * Get the latest reading for a meter
   */
  async getLatestReading(meterId: number): Promise<MeterReadingResponseDto | null> {
    const reading = await this.readingRepository.findOne({
      where: { meterId },
      relations: ['meter', 'meter.utilityType', 'meterReader', 'meterReader.employee'],
      order: { readingDate: 'DESC' },
    });

    if (!reading) {
      this.logger.log(`No readings found for meter ${meterId}`);
      return null;
    }

    this.logger.log(`Latest reading for meter ${meterId}: ${reading.readingId}`);
    return MeterReadingResponseDto.fromEntity(reading);
  }

  // ==================== CREATE METHODS ====================

  /**
   * Create a new meter reading
   * @param createDto - Reading data
   * @param meterReaderId - Optional meter reader ID
   * @param options - Additional options including auto-bill generation
   */
  async create(
    createDto: CreateMeterReadingDto,
    meterReaderId?: number,
    options?: {
      autoGenerateBill?: boolean;
      minDaysBetweenBills?: number;
      dueDaysFromBillDate?: number;
    },
  ): Promise<
    MeterReadingResponseDto & { generatedBill?: { billId: number; totalAmount: number } }
  > {
    // Verify meter exists
    const meter = await this.meterRepository.findOne({
      where: { meterId: createDto.meterId },
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${createDto.meterId} not found`);
    }

    // Validate reading date is not in future
    if (new Date(createDto.readingDate) > new Date()) {
      throw new BadRequestException('Reading date cannot be in the future');
    }

    // Get previous reading
    const previousReading = await this.readingRepository.findOne({
      where: { meterId: createDto.meterId },
      order: { readingDate: 'DESC' },
    });

    // Validate reading against previous
    if (previousReading) {
      const validation = await this.validateReading(
        createDto.meterId,
        createDto.importReading,
        new Date(createDto.readingDate),
      );

      if (!validation.isValid) {
        throw new BadRequestException(`Reading validation failed: ${validation.errors.join(', ')}`);
      }
    }

    // Create reading entity
    const reading = this.readingRepository.create({
      meterId: createDto.meterId,
      meterReaderId: meterReaderId || null,
      readingDate: new Date(createDto.readingDate),
      readingSource: createDto.readingSource as unknown as ReadingSource,
      importReading: createDto.importReading,
      prevImportReading: previousReading?.importReading
        ? Number(previousReading.importReading)
        : null,
      exportReading: createDto.exportReading || null,
      prevExportReading: previousReading?.exportReading
        ? Number(previousReading.exportReading)
        : null,
      deviceId: createDto.deviceId || null,
      createdAt: new Date(),
    });

    const savedReading = await this.readingRepository.save(reading);

    this.logger.log(`Created reading ${savedReading.readingId} for meter ${createDto.meterId}`);

    const readingResponse = await this.findOne(savedReading.readingId);

    // Emit event for asynchronous bill generation
    this.logger.log(`📤 Emitting meter-reading.created event for reading ${savedReading.readingId}`);
    this.eventEmitter.emit(
      'meter-reading.created',
      new MeterReadingCreatedEvent(savedReading, options),
    );

    // Legacy synchronous bill generation has been removed in favor of event-driven approach
    // Bills are now generated asynchronously via BillingEventListener
    const generatedBill: { billId: number; totalAmount: number } | undefined = undefined;

    return { ...readingResponse, generatedBill };
  }

  /**
   * Create multiple readings in bulk
   */
  async createBulk(bulkDto: BulkCreateReadingsDto): Promise<{
    success: boolean;
    results: Array<{ index: number; reading?: MeterReadingResponseDto; error?: string }>;
  }> {
    const { readings, validateAll = true } = bulkDto;
    const results: Array<{ index: number; reading?: MeterReadingResponseDto; error?: string }> = [];

    // Pre-validate all if required
    if (validateAll) {
      const validationResults = await Promise.all(
        readings.map(async (dto, index) => {
          const result = await this.validateReading(
            dto.meterId,
            dto.importReading,
            new Date(dto.readingDate),
          );
          return { index, ...result };
        }),
      );

      const hasErrors = validationResults.some((r) => !r.isValid);
      if (hasErrors) {
        return {
          success: false,
          results: validationResults.map((r) => ({
            index: r.index,
            error: r.errors.join(', ') || undefined,
          })),
        };
      }
    }

    // Use transaction for atomicity
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      for (let i = 0; i < readings.length; i++) {
        try {
          const dto = readings[i];

          // Get previous reading
          const previousReading = await queryRunner.manager.findOne(MeterReading, {
            where: { meterId: dto.meterId },
            order: { readingDate: 'DESC' },
          });

          const reading = queryRunner.manager.create(MeterReading, {
            meterId: dto.meterId,
            meterReaderId: null,
            readingDate: new Date(dto.readingDate),
            readingSource: dto.readingSource as unknown as ReadingSource,
            importReading: dto.importReading,
            prevImportReading: previousReading?.importReading
              ? Number(previousReading.importReading)
              : null,
            exportReading: dto.exportReading || null,
            prevExportReading: previousReading?.exportReading
              ? Number(previousReading.exportReading)
              : null,
            deviceId: dto.deviceId || null,
            createdAt: new Date(),
          });

          const savedReading = await queryRunner.manager.save(reading);
          const responseDto = MeterReadingResponseDto.fromEntity(savedReading);
          results.push({ index: i, reading: responseDto });
        } catch (error) {
          if (!validateAll) {
            results.push({ index: i, error: error.message });
          } else {
            throw error;
          }
        }
      }

      await queryRunner.commitTransaction();
      this.logger.log(`Bulk created ${results.length} readings`);

      return { success: true, results };
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Bulk create failed: ${error.message}`, error.stack);
      throw new BadRequestException(`Bulk create failed: ${error.message}`);
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== UPDATE METHODS ====================

  /**
   * Update an existing reading (for corrections)
   */
  async update(id: number, updateDto: UpdateMeterReadingDto): Promise<MeterReadingResponseDto> {
    const queryRunner = this.dataSource.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      const reading = await queryRunner.manager.findOne(MeterReading, {
        where: { readingId: id },
      });

      if (!reading) {
        throw new NotFoundException(`Meter reading with ID ${id} not found`);
      }

      const originalImport = reading.importReading;
      const originalExport = reading.exportReading;

      // Apply updates
      if (updateDto.importReading !== undefined) {
        reading.importReading = updateDto.importReading;
      }

      if (updateDto.exportReading !== undefined) {
        reading.exportReading = updateDto.exportReading;
      }

      if (updateDto.readingSource !== undefined) {
        reading.readingSource = updateDto.readingSource as unknown as ReadingSource;
      }

      // If import reading changed, mark as CORRECTED
      if (
        updateDto.importReading !== undefined &&
        updateDto.importReading !== Number(originalImport)
      ) {
        reading.readingSource = ReadingSource.CORRECTED;
        this.logger.log(
          `Reading ${id} marked as CORRECTED. Import changed from ${originalImport} to ${updateDto.importReading}`,
        );
      }

      // If export reading changed, also mark as CORRECTED
      if (
        updateDto.exportReading !== undefined &&
        updateDto.exportReading !== Number(originalExport)
      ) {
        reading.readingSource = ReadingSource.CORRECTED;
        this.logger.log(
          `Reading ${id} marked as CORRECTED. Export changed from ${originalExport} to ${updateDto.exportReading}`,
        );
      }

      await queryRunner.manager.save(reading);
      await queryRunner.commitTransaction();

      this.logger.log(`Updated reading ${id}`);
      return this.findOne(id);
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to update reading ${id}: ${error.message}`, error.stack);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  // ==================== VALIDATION METHODS ====================

  /**
   * Validate a reading before creation
   */
  async validateReading(
    meterId: number,
    newReading: number,
    readingDate: Date,
  ): Promise<ReadingValidationResultDto> {
    const result = new ReadingValidationResultDto();
    result.meterId = meterId;

    // Check if meter exists
    const meter = await this.meterRepository.findOne({
      where: { meterId },
    });

    if (!meter) {
      result.addError(`Meter with ID ${meterId} not found`);
      return result;
    }

    // Check reading date is not in future
    if (readingDate > new Date()) {
      result.addError('Reading date cannot be in the future');
    }

    // Get previous reading
    const previousReading = await this.readingRepository.findOne({
      where: {
        meterId,
        readingDate: LessThanOrEqual(readingDate),
      },
      order: { readingDate: 'DESC' },
    });

    if (previousReading) {
      // Check reading is not less than previous
      if (newReading < Number(previousReading.importReading)) {
        result.addError(
          `Reading ${newReading} is less than previous reading ${previousReading.importReading}`,
        );
      }

      // Check reading date sequence
      if (readingDate < previousReading.readingDate) {
        result.addWarning(
          `Reading date ${readingDate.toISOString()} is before previous reading date ${previousReading.readingDate.toISOString()}`,
        );
      }

      // Check for abnormal consumption
      const consumption = newReading - Number(previousReading.importReading);
      const averageConsumption = await this.calculateAverageConsumption(meterId);

      if (averageConsumption > 0) {
        if (consumption > averageConsumption * this.HIGH_CONSUMPTION_MULTIPLIER) {
          result.addWarning(
            `Consumption ${consumption} is unusually high (${this.HIGH_CONSUMPTION_MULTIPLIER}x average of ${averageConsumption.toFixed(2)})`,
          );
        }

        if (consumption <= this.LOW_CONSUMPTION_THRESHOLD) {
          result.addWarning(`Consumption ${consumption} is zero or negative`);
        }
      }
    }

    return result;
  }

  /**
   * Calculate average consumption for a meter
   */
  private async calculateAverageConsumption(meterId: number): Promise<number> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - this.DAYS_FOR_AVERAGE);

    const readings = await this.readingRepository.find({
      where: {
        meterId,
        readingDate: MoreThanOrEqual(startDate),
      },
      order: { readingDate: 'ASC' },
    });

    if (readings.length < 2) {
      return 0;
    }

    let totalConsumption = 0;
    for (let i = 1; i < readings.length; i++) {
      const current = Number(readings[i].importReading) || 0;
      const previous = Number(readings[i - 1].importReading) || 0;
      totalConsumption += current - previous;
    }

    return totalConsumption / (readings.length - 1);
  }

  // ==================== SUMMARY METHODS ====================

  /**
   * Get consumption summary for a meter over a period
   */
  async getConsumptionSummary(
    meterId: number,
    startDate: Date,
    endDate: Date,
  ): Promise<ConsumptionSummaryDto> {
    const meter = await this.meterRepository.findOne({
      where: { meterId },
      relations: ['utilityType'],
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${meterId} not found`);
    }

    const readings = await this.readingRepository.find({
      where: {
        meterId,
        readingDate: Between(startDate, endDate),
      },
      order: { readingDate: 'ASC' },
    });

    const summary = new ConsumptionSummaryDto();
    summary.meterId = meterId;
    summary.meterSerialNo = meter.meterSerialNo;
    summary.utilityTypeName = meter.utilityType?.name || '';
    summary.period = {
      start: startDate.toISOString(),
      end: endDate.toISOString(),
    };
    summary.readingCount = readings.length;

    if (readings.length === 0) {
      summary.calculate();
      return summary;
    }

    // Calculate consumption values
    let minConsumption = Infinity;
    let maxConsumption = -Infinity;

    for (const reading of readings) {
      const consumption = reading.consumption || 0;
      const exported = reading.exportedEnergy || 0;

      summary.totalConsumption += consumption;
      summary.totalExported += exported;

      if (consumption > 0) {
        minConsumption = Math.min(minConsumption, consumption);
        maxConsumption = Math.max(maxConsumption, consumption);
      }
    }

    summary.minConsumption = minConsumption === Infinity ? 0 : minConsumption;
    summary.maxConsumption = maxConsumption === -Infinity ? 0 : maxConsumption;
    summary.firstReading = Number(readings[0].importReading) || 0;
    summary.lastReading = Number(readings[readings.length - 1].importReading) || 0;

    summary.calculate();

    this.logger.log(
      `Generated consumption summary for meter ${meterId}: ${summary.totalConsumption} total consumption`,
    );

    return summary;
  }

  /**
   * Get readings by a specific meter reader on a specific date
   */
  async getReadingsByReader(
    meterReaderId: number,
    date: Date,
  ): Promise<{ readings: MeterReadingResponseDto[]; totalMetersRead: number }> {
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);

    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);

    const readings = await this.readingRepository.find({
      where: {
        meterReaderId,
        readingDate: Between(startOfDay, endOfDay),
      },
      relations: ['meter', 'meter.utilityType', 'meterReader', 'meterReader.employee'],
      order: { readingDate: 'ASC' },
    });

    const uniqueMeters = new Set(readings.map((r) => r.meterId));

    this.logger.log(
      `Reader ${meterReaderId} recorded ${readings.length} readings on ${date.toDateString()}`,
    );

    return {
      readings: readings.map((r) => MeterReadingResponseDto.fromEntity(r)),
      totalMetersRead: uniqueMeters.size,
    };
  }

  // ==================== ESTIMATION METHODS ====================

  /**
   * Estimate reading based on historical average
   */
  async estimateReading(
    meterId: number,
    readingDate: Date,
  ): Promise<{ estimatedReading: number; confidence: string; basedOnReadings: number }> {
    const meter = await this.meterRepository.findOne({
      where: { meterId },
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${meterId} not found`);
    }

    // Get historical readings
    const historicalDays = 180; // 6 months
    const historicalStart = new Date(readingDate);
    historicalStart.setDate(historicalStart.getDate() - historicalDays);

    const readings = await this.readingRepository.find({
      where: {
        meterId,
        readingDate: Between(historicalStart, readingDate),
      },
      order: { readingDate: 'ASC' },
    });

    if (readings.length < 2) {
      throw new BadRequestException(
        'Insufficient historical data for estimation (need at least 2 readings)',
      );
    }

    // Calculate average daily consumption
    const firstReading = readings[0];
    const lastReading = readings[readings.length - 1];
    const totalConsumption = Number(lastReading.importReading) - Number(firstReading.importReading);
    const daysBetween = Math.max(
      1,
      Math.ceil(
        (lastReading.readingDate.getTime() - firstReading.readingDate.getTime()) /
          (1000 * 60 * 60 * 24),
      ),
    );
    const dailyAverage = totalConsumption / daysBetween;

    // Calculate days since last reading
    const daysSinceLastReading = Math.ceil(
      (readingDate.getTime() - lastReading.readingDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Estimate new reading
    const estimatedReading =
      Number(lastReading.importReading) + dailyAverage * daysSinceLastReading;

    // Determine confidence level
    let confidence = 'HIGH';
    if (readings.length < 6) confidence = 'MEDIUM';
    if (readings.length < 3) confidence = 'LOW';
    if (daysSinceLastReading > 60) confidence = 'LOW';

    this.logger.log(
      `Estimated reading for meter ${meterId}: ${estimatedReading.toFixed(3)} (${confidence} confidence)`,
    );

    return {
      estimatedReading: Number(estimatedReading.toFixed(3)),
      confidence,
      basedOnReadings: readings.length,
    };
  }

  /**
   * Create an estimated reading
   */
  async createEstimatedReading(
    meterId: number,
    readingDate: Date,
  ): Promise<MeterReadingResponseDto> {
    const estimation = await this.estimateReading(meterId, readingDate);

    const createDto: CreateMeterReadingDto = {
      meterId,
      readingDate,
      readingSource: 'ESTIMATED' as any,
      importReading: estimation.estimatedReading,
    };

    return this.create(createDto);
  }

  // ==================== DELETE METHODS ====================

  /**
   * Soft delete a reading (mark as deleted but maintain audit trail)
   * Note: For true soft delete, you would need a 'deleted_at' column
   * This implementation throws an error to prevent accidental deletion
   */
  async remove(id: number): Promise<{ success: boolean; message: string }> {
    const reading = await this.readingRepository.findOne({
      where: { readingId: id },
    });

    if (!reading) {
      throw new NotFoundException(`Meter reading with ID ${id} not found`);
    }

    // For audit trail, we don't actually delete
    // Instead, you could mark it with a deleted flag or move to archive
    // For now, we'll throw an error
    this.logger.warn(`Attempted to delete reading ${id} - deletion is not allowed for audit trail`);

    throw new BadRequestException(
      'Meter readings cannot be deleted to maintain audit trail. Use corrections instead.',
    );

    // If you implement soft delete, uncomment below:
    // reading.deletedAt = new Date();
    // await this.readingRepository.save(reading);
    // return { success: true, message: `Reading ${id} marked as deleted` };
  }

  // ==================== EXPORT/IMPORT METHODS ====================

  /**
   * Export readings to CSV format
   */
  async exportToCsv(filters: ReadingFilterDto): Promise<string> {
    // Get all readings matching filters (no pagination for export)
    const queryBuilder = this.readingRepository
      .createQueryBuilder('reading')
      .leftJoinAndSelect('reading.meter', 'meter')
      .leftJoinAndSelect('meter.utilityType', 'utilityType')
      .leftJoinAndSelect('reading.meterReader', 'meterReader')
      .leftJoinAndSelect('meterReader.employee', 'employee');

    // Apply filters
    if (filters.meterId) {
      queryBuilder.andWhere('reading.meterId = :meterId', { meterId: filters.meterId });
    }

    if (filters.meterReaderId) {
      queryBuilder.andWhere('reading.meterReaderId = :meterReaderId', {
        meterReaderId: filters.meterReaderId,
      });
    }

    if (filters.readingSource) {
      queryBuilder.andWhere('reading.readingSource = :readingSource', {
        readingSource: filters.readingSource,
      });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('reading.readingDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('reading.readingDate <= :endDate', { endDate: filters.endDate });
    }

    queryBuilder.orderBy('reading.readingDate', 'DESC');

    const readings = await queryBuilder.getMany();

    this.logger.log(`Exporting ${readings.length} readings to CSV`);

    // Build CSV content
    const headers = [
      'Reading ID',
      'Meter ID',
      'Meter Serial No',
      'Utility Type',
      'Reading Date',
      'Reading Source',
      'Import Reading',
      'Previous Import Reading',
      'Consumption',
      'Export Reading',
      'Previous Export Reading',
      'Exported Energy',
      'Net Consumption',
      'Reader Name',
      'Device ID',
      'Created At',
    ];

    const csvRows = [headers.join(',')];

    for (const reading of readings) {
      const readerName = reading.meterReader?.employee
        ? `${reading.meterReader.employee.firstName} ${reading.meterReader.employee.lastName}`
        : '';

      const row = [
        reading.readingId,
        reading.meterId,
        reading.meter?.meterSerialNo || '',
        reading.meter?.utilityType?.name || '',
        reading.readingDate?.toISOString() || '',
        reading.readingSource,
        reading.importReading || '',
        reading.prevImportReading || '',
        reading.consumption || '',
        reading.exportReading || '',
        reading.prevExportReading || '',
        reading.exportedEnergy || '',
        reading.netConsumption || '',
        `"${readerName}"`,
        reading.deviceId || '',
        reading.createdAt?.toISOString() || '',
      ];

      csvRows.push(row.join(','));
    }

    return csvRows.join('\n');
  }

  /**
   * Parse CSV content and create readings
   */
  async importFromCsv(
    csvContent: string,
    meterReaderId?: number,
  ): Promise<{
    success: boolean;
    totalRows: number;
    successCount: number;
    failureCount: number;
    errors: Array<{ row: number; error: string }>;
  }> {
    const lines = csvContent.split('\n').filter((line) => line.trim());

    if (lines.length < 2) {
      throw new BadRequestException('CSV file must have a header row and at least one data row');
    }

    // Parse header to find column indices
    const headers = this.parseCsvLine(lines[0]).map((h) => h.toLowerCase().trim());
    const meterIdIndex = headers.findIndex(
      (h) => h === 'meter_id' || h === 'meterid' || h === 'meter id',
    );
    const readingDateIndex = headers.findIndex(
      (h) => h === 'reading_date' || h === 'readingdate' || h === 'reading date' || h === 'date',
    );
    const importReadingIndex = headers.findIndex(
      (h) =>
        h === 'import_reading' ||
        h === 'importreading' ||
        h === 'import reading' ||
        h === 'reading',
    );
    const exportReadingIndex = headers.findIndex(
      (h) => h === 'export_reading' || h === 'exportreading' || h === 'export reading',
    );
    const readingSourceIndex = headers.findIndex(
      (h) =>
        h === 'reading_source' || h === 'readingsource' || h === 'reading source' || h === 'source',
    );

    if (meterIdIndex === -1 || readingDateIndex === -1 || importReadingIndex === -1) {
      throw new BadRequestException(
        'CSV must have columns: meter_id (or meterId), reading_date (or readingDate/date), import_reading (or importReading/reading)',
      );
    }

    const results: {
      totalRows: number;
      successCount: number;
      failureCount: number;
      errors: Array<{ row: number; error: string }>;
    } = {
      totalRows: lines.length - 1,
      successCount: 0,
      failureCount: 0,
      errors: [],
    };

    // Process data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = this.parseCsvLine(lines[i]);

        const meterId = parseInt(values[meterIdIndex], 10);
        const readingDate = new Date(values[readingDateIndex]);
        const importReading = parseFloat(values[importReadingIndex]);
        const exportReading =
          exportReadingIndex !== -1 ? parseFloat(values[exportReadingIndex]) : undefined;
        const readingSource =
          readingSourceIndex !== -1 ? values[readingSourceIndex]?.toUpperCase() : 'MANUAL';

        if (isNaN(meterId)) {
          throw new Error('Invalid meter_id');
        }

        if (isNaN(readingDate.getTime())) {
          throw new Error('Invalid reading_date');
        }

        if (isNaN(importReading)) {
          throw new Error('Invalid import_reading');
        }

        const createDto: CreateMeterReadingDto = {
          meterId,
          readingDate,
          importReading,
          exportReading: exportReading && !isNaN(exportReading) ? exportReading : undefined,
          readingSource: (['MANUAL', 'SMART_METER', 'ESTIMATED'].includes(readingSource)
            ? readingSource
            : 'MANUAL') as any,
        };

        await this.create(createDto, meterReaderId);
        results.successCount++;
      } catch (error) {
        results.failureCount++;
        results.errors.push({
          row: i + 1,
          error: error.message || 'Unknown error',
        });
      }
    }

    this.logger.log(
      `CSV import completed: ${results.successCount} success, ${results.failureCount} failures`,
    );

    return {
      success: results.failureCount === 0,
      ...results,
    };
  }

  /**
   * Parse a single CSV line handling quoted values
   */
  private parseCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // ==================== ANOMALY DETECTION METHODS ====================

  /**
   * Detect anomalous readings based on various criteria
   */
  async detectAnomalies(
    startDate?: Date,
    endDate?: Date,
    thresholdMultiplier?: number,
  ): Promise<{
    anomalies: Array<{
      reading: MeterReadingResponseDto;
      anomalyType: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }>;
    summary: {
      totalAnalyzed: number;
      anomalyCount: number;
      byType: Record<string, number>;
      bySeverity: Record<string, number>;
    };
  }> {
    const threshold = thresholdMultiplier || this.HIGH_CONSUMPTION_MULTIPLIER;

    const queryBuilder = this.readingRepository
      .createQueryBuilder('reading')
      .leftJoinAndSelect('reading.meter', 'meter')
      .leftJoinAndSelect('meter.utilityType', 'utilityType')
      .leftJoinAndSelect('reading.meterReader', 'meterReader')
      .leftJoinAndSelect('meterReader.employee', 'employee');

    if (startDate) {
      queryBuilder.andWhere('reading.readingDate >= :startDate', { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere('reading.readingDate <= :endDate', { endDate });
    }

    queryBuilder.orderBy('reading.meterId', 'ASC').addOrderBy('reading.readingDate', 'ASC');

    const readings = await queryBuilder.getMany();

    this.logger.log(`Analyzing ${readings.length} readings for anomalies`);

    const anomalies: Array<{
      reading: MeterReadingResponseDto;
      anomalyType: string;
      severity: 'HIGH' | 'MEDIUM' | 'LOW';
      description: string;
    }> = [];

    const byType: Record<string, number> = {};
    const bySeverity: Record<string, number> = { HIGH: 0, MEDIUM: 0, LOW: 0 };

    // Group readings by meter for analysis
    const readingsByMeter = new Map<number, MeterReading[]>();
    for (const reading of readings) {
      if (!readingsByMeter.has(reading.meterId)) {
        readingsByMeter.set(reading.meterId, []);
      }
      readingsByMeter.get(reading.meterId)!.push(reading);
    }

    // Analyze each meter's readings
    for (const meterReadings of readingsByMeter.values()) {
      // Calculate average consumption for this meter
      let totalConsumption = 0;
      let consumptionCount = 0;

      for (const reading of meterReadings) {
        const consumption = reading.consumption || 0;
        if (consumption > 0) {
          totalConsumption += consumption;
          consumptionCount++;
        }
      }

      const avgConsumption = consumptionCount > 0 ? totalConsumption / consumptionCount : 0;

      // Check each reading for anomalies
      for (let i = 0; i < meterReadings.length; i++) {
        const reading = meterReadings[i];
        const consumption = reading.consumption || 0;
        const responseDto = MeterReadingResponseDto.fromEntity(reading);

        // Anomaly: Negative consumption (meter rollback or error)
        if (consumption < 0) {
          const anomaly = {
            reading: responseDto,
            anomalyType: 'NEGATIVE_CONSUMPTION',
            severity: 'HIGH' as const,
            description: `Negative consumption detected: ${consumption}. This may indicate meter rollback or data error.`,
          };
          anomalies.push(anomaly);
          byType['NEGATIVE_CONSUMPTION'] = (byType['NEGATIVE_CONSUMPTION'] || 0) + 1;
          bySeverity['HIGH']++;
        }

        // Anomaly: Zero consumption (might be normal or suspicious)
        if (consumption === 0 && reading.prevImportReading !== null) {
          const anomaly = {
            reading: responseDto,
            anomalyType: 'ZERO_CONSUMPTION',
            severity: 'LOW' as const,
            description: `Zero consumption detected. Verify if property is vacant or meter is malfunctioning.`,
          };
          anomalies.push(anomaly);
          byType['ZERO_CONSUMPTION'] = (byType['ZERO_CONSUMPTION'] || 0) + 1;
          bySeverity['LOW']++;
        }

        // Anomaly: Unusually high consumption
        if (avgConsumption > 0 && consumption > avgConsumption * threshold) {
          const anomaly = {
            reading: responseDto,
            anomalyType: 'HIGH_CONSUMPTION',
            severity: 'MEDIUM' as const,
            description: `Consumption (${consumption.toFixed(2)}) is ${(consumption / avgConsumption).toFixed(1)}x higher than average (${avgConsumption.toFixed(2)}).`,
          };
          anomalies.push(anomaly);
          byType['HIGH_CONSUMPTION'] = (byType['HIGH_CONSUMPTION'] || 0) + 1;
          bySeverity['MEDIUM']++;
        }

        // Anomaly: Reading less than previous (without being marked as CORRECTED)
        if (
          reading.prevImportReading !== null &&
          Number(reading.importReading) < Number(reading.prevImportReading) &&
          reading.readingSource !== ReadingSource.CORRECTED
        ) {
          const anomaly = {
            reading: responseDto,
            anomalyType: 'READING_DECREASED',
            severity: 'HIGH' as const,
            description: `Current reading (${reading.importReading}) is less than previous (${reading.prevImportReading}). Possible meter replacement or data entry error.`,
          };
          anomalies.push(anomaly);
          byType['READING_DECREASED'] = (byType['READING_DECREASED'] || 0) + 1;
          bySeverity['HIGH']++;
        }

        // Anomaly: Future reading date
        if (reading.readingDate > new Date()) {
          const anomaly = {
            reading: responseDto,
            anomalyType: 'FUTURE_DATE',
            severity: 'HIGH' as const,
            description: `Reading date is in the future: ${reading.readingDate.toISOString()}.`,
          };
          anomalies.push(anomaly);
          byType['FUTURE_DATE'] = (byType['FUTURE_DATE'] || 0) + 1;
          bySeverity['HIGH']++;
        }

        // Anomaly: Duplicate reading (same meter, same date)
        const duplicates = meterReadings.filter(
          (r) =>
            r.readingId !== reading.readingId &&
            r.readingDate.toDateString() === reading.readingDate.toDateString(),
        );
        if (duplicates.length > 0) {
          const anomaly = {
            reading: responseDto,
            anomalyType: 'DUPLICATE_DATE',
            severity: 'MEDIUM' as const,
            description: `Multiple readings for same meter on same date (${reading.readingDate.toDateString()}).`,
          };
          anomalies.push(anomaly);
          byType['DUPLICATE_DATE'] = (byType['DUPLICATE_DATE'] || 0) + 1;
          bySeverity['MEDIUM']++;
        }
      }
    }

    this.logger.log(`Found ${anomalies.length} anomalies in ${readings.length} readings`);

    return {
      anomalies,
      summary: {
        totalAnalyzed: readings.length,
        anomalyCount: anomalies.length,
        byType,
        bySeverity,
      },
    };
  }
}

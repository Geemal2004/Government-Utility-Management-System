import {
  Controller,
  Get,
  Post,
  Put,
  Body,
  Param,
  Query,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
  ValidationPipe,
  Res,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody,
  ApiBearerAuth,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNotFoundResponse,
  ApiBadRequestResponse,
  ApiConsumes,
  ApiProduces,
} from '@nestjs/swagger';
import { ReadingsService } from './readings.service';
import {
  CreateMeterReadingDto,
  BulkCreateReadingsDto,
  UpdateMeterReadingDto,
  MeterReadingResponseDto,
  ReadingFilterDto,
  ReadingValidationResultDto,
  ConsumptionSummaryDto,
  ReadingSourceDto,
  SortOrder,
} from './dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { CurrentUser } from '../common/decorators/current-user.decorator';

/**
 * DTO for validating a reading before saving
 */
class ValidateReadingDto {
  meterId: number;
  reading: number;
  readingDate: Date;
}

/**
 * DTO for estimating a reading
 */
class EstimateReadingDto {
  readingDate: Date;
}

@ApiTags('Meter Readings')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller('readings')
export class ReadingsController {
  constructor(private readonly readingsService: ReadingsService) {}

  // ==================== GET ENDPOINTS ====================

  /**
   * Get all meter readings with filtering and pagination
   */
  @Get()
  @ApiOperation({
    summary: 'Get all meter readings',
    description:
      'Retrieve a paginated list of meter readings with optional filtering by meter, reader, date range, and source',
  })
  @ApiQuery({
    name: 'meterId',
    required: false,
    type: Number,
    description: 'Filter by meter ID',
  })
  @ApiQuery({
    name: 'meterReaderId',
    required: false,
    type: Number,
    description: 'Filter by meter reader ID',
  })
  @ApiQuery({
    name: 'readingSource',
    required: false,
    enum: ReadingSourceDto,
    description: 'Filter by reading source',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter readings from this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter readings up to this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 10,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    type: String,
    example: 'readingDate',
    description: 'Field to sort by',
  })
  @ApiQuery({
    name: 'order',
    required: false,
    enum: SortOrder,
    example: 'DESC',
    description: 'Sort order',
  })
  @ApiOkResponse({
    description: 'Paginated list of meter readings',
    schema: {
      properties: {
        items: {
          type: 'array',
          items: { $ref: '#/components/schemas/MeterReadingResponseDto' },
        },
        meta: {
          type: 'object',
          properties: {
            total: { type: 'number' },
            page: { type: 'number' },
            limit: { type: 'number' },
            totalPages: { type: 'number' },
            hasNextPage: { type: 'boolean' },
            hasPreviousPage: { type: 'boolean' },
          },
        },
      },
    },
  })
  async findAll(@Query(ValidationPipe) filters: ReadingFilterDto) {
    return this.readingsService.findAll(filters);
  }

  /**
   * Get a single meter reading by ID
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get meter reading by ID',
    description: 'Retrieve detailed information about a specific meter reading',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Reading ID',
  })
  @ApiOkResponse({
    description: 'Meter reading found',
    type: MeterReadingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Meter reading not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.readingsService.findOne(id);
  }

  /**
   * Get all readings for a specific meter
   */
  @Get('meter/:meterId')
  @ApiOperation({
    summary: 'Get readings by meter',
    description: 'Retrieve all meter readings for a specific meter',
  })
  @ApiParam({
    name: 'meterId',
    type: Number,
    description: 'Meter ID',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    example: 100,
    description: 'Maximum number of readings to return',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter readings from this date',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter readings up to this date',
  })
  @ApiOkResponse({
    description: 'List of readings for the meter',
    type: MeterReadingResponseDto,
    isArray: true,
  })
  async findByMeter(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Query('limit') limit?: number,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.readingsService.findByMeter(meterId, {
      limit: limit ? Number(limit) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    });
  }

  /**
   * Get the latest reading for a specific meter
   */
  @Get('meter/:meterId/latest')
  @ApiOperation({
    summary: 'Get latest reading for meter',
    description: 'Retrieve the most recent meter reading for a specific meter',
  })
  @ApiParam({
    name: 'meterId',
    type: Number,
    description: 'Meter ID',
  })
  @ApiOkResponse({
    description: 'Latest reading for the meter',
    type: MeterReadingResponseDto,
  })
  @ApiResponse({
    status: 204,
    description: 'No readings found for this meter',
  })
  async getLatestReading(@Param('meterId', ParseIntPipe) meterId: number) {
    const reading = await this.readingsService.getLatestReading(meterId);
    return reading;
  }

  /**
   * Get consumption summary for a meter over a period
   */
  @Get('meter/:meterId/consumption-summary')
  @ApiOperation({
    summary: 'Get consumption summary',
    description: 'Retrieve consumption statistics for a meter over a specified period',
  })
  @ApiParam({
    name: 'meterId',
    type: Number,
    description: 'Meter ID',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Start date for the summary period (YYYY-MM-DD)',
    example: '2025-01-01',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'End date for the summary period (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @ApiOkResponse({
    description: 'Consumption summary for the period',
    type: ConsumptionSummaryDto,
  })
  @ApiBadRequestResponse({ description: 'Invalid date parameters' })
  async getConsumptionSummary(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ) {
    return this.readingsService.getConsumptionSummary(
      meterId,
      new Date(startDate),
      new Date(endDate),
    );
  }

  /**
   * Get readings by a meter reader for a specific date
   */
  @Get('reader/:meterReaderId/daily/:date')
  @ApiOperation({
    summary: 'Get daily readings by reader',
    description:
      'Retrieve all readings recorded by a specific meter reader on a given date. Used for performance tracking.',
  })
  @ApiParam({
    name: 'meterReaderId',
    type: Number,
    description: 'Meter Reader ID',
  })
  @ApiParam({
    name: 'date',
    type: String,
    description: 'Date to query (YYYY-MM-DD)',
    example: '2025-12-31',
  })
  @ApiOkResponse({
    description: 'Readings by the reader on the specified date',
    schema: {
      properties: {
        readings: {
          type: 'array',
          items: { $ref: '#/components/schemas/MeterReadingResponseDto' },
        },
        totalMetersRead: { type: 'number' },
      },
    },
  })
  async getReadingsByReader(
    @Param('meterReaderId', ParseIntPipe) meterReaderId: number,
    @Param('date') date: string,
  ) {
    return this.readingsService.getReadingsByReader(meterReaderId, new Date(date));
  }

  // ==================== POST ENDPOINTS ====================

  /**
   * Create a new meter reading
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create meter reading',
    description:
      'Record a new meter reading. If the user is a METER_READER, their ID is automatically associated. ' +
      'By default, a bill is automatically generated if conditions are met (enough readings, sufficient days since last bill).',
  })
  @ApiBody({
    type: CreateMeterReadingDto,
    description: 'Meter reading data',
  })
  @ApiCreatedResponse({
    description:
      'Meter reading created successfully. May include generatedBill if a bill was auto-generated.',
    schema: {
      allOf: [
        { $ref: '#/components/schemas/MeterReadingResponseDto' },
        {
          properties: {
            generatedBill: {
              type: 'object',
              nullable: true,
              properties: {
                billId: { type: 'number', description: 'ID of the auto-generated bill' },
                totalAmount: { type: 'number', description: 'Total amount of the bill' },
              },
            },
          },
        },
      ],
    },
  })
  @ApiBadRequestResponse({
    description: 'Validation failed or reading is invalid',
  })
  @ApiNotFoundResponse({ description: 'Meter not found' })
  async create(@Body(ValidationPipe) createDto: CreateMeterReadingDto, @CurrentUser() user: any) {
    // Get meterReaderId if the current user is a meter reader
    let meterReaderId: number | undefined;

    if (user?.role === 'METER_READER' && user?.meterReaderId) {
      meterReaderId = user.meterReaderId;
    }

    return this.readingsService.create(createDto, meterReaderId, {
      autoGenerateBill: createDto.autoGenerateBill ?? true, // Default to true if not specified
      minDaysBetweenBills: createDto.minDaysBetweenBills ?? 25,
      dueDaysFromBillDate: createDto.dueDaysFromBillDate ?? 15,
    });
  }

  /**
   * Create multiple readings in bulk
   */
  @Post('bulk')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager', 'MeterReader')
  @ApiOperation({
    summary: 'Bulk create meter readings',
    description:
      'Create multiple meter readings at once. Used for batch imports. Requires ADMIN or METER_READER role.',
  })
  @ApiBody({
    type: BulkCreateReadingsDto,
    description: 'Array of meter readings to create',
  })
  @ApiCreatedResponse({
    description: 'Bulk creation result',
    schema: {
      properties: {
        success: { type: 'boolean' },
        results: {
          type: 'array',
          items: {
            properties: {
              index: { type: 'number' },
              reading: { $ref: '#/components/schemas/MeterReadingResponseDto' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Validation failed for one or more readings' })
  async createBulk(@Body(ValidationPipe) bulkDto: BulkCreateReadingsDto) {
    return this.readingsService.createBulk(bulkDto);
  }

  /**
   * Validate a reading before saving
   */
  @Post('validate')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Validate meter reading',
    description: 'Validate a reading value before saving. Returns validation errors and warnings.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['meterId', 'reading', 'readingDate'],
      properties: {
        meterId: { type: 'number', example: 1 },
        reading: { type: 'number', example: 12500.5 },
        readingDate: { type: 'string', example: '2025-12-31T10:30:00Z' },
      },
    },
    description: 'Reading data to validate',
  })
  @ApiOkResponse({
    description: 'Validation result',
    type: ReadingValidationResultDto,
  })
  async validateReading(@Body() body: ValidateReadingDto) {
    return this.readingsService.validateReading(
      body.meterId,
      body.reading,
      new Date(body.readingDate),
    );
  }

  /**
   * Generate an estimated reading for a meter
   */
  @Post('meter/:meterId/estimate')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager', 'MeterReader')
  @ApiOperation({
    summary: 'Generate estimated reading',
    description:
      'Generate an estimated reading based on historical consumption data. Requires ADMIN or METER_READER role.',
  })
  @ApiParam({
    name: 'meterId',
    type: Number,
    description: 'Meter ID',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['readingDate'],
      properties: {
        readingDate: {
          type: 'string',
          example: '2025-12-31',
          description: 'Date for the estimated reading',
        },
      },
    },
    description: 'Estimation parameters',
  })
  @ApiCreatedResponse({
    description: 'Estimated reading generated',
    schema: {
      properties: {
        estimatedReading: { type: 'number', example: 12750.5 },
        confidence: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
        basedOnReadings: { type: 'number', example: 12 },
      },
    },
  })
  @ApiBadRequestResponse({
    description: 'Insufficient historical data for estimation',
  })
  async estimateReading(
    @Param('meterId', ParseIntPipe) meterId: number,
    @Body() body: EstimateReadingDto,
  ) {
    return this.readingsService.estimateReading(meterId, new Date(body.readingDate));
  }

  // ==================== PUT ENDPOINTS ====================

  /**
   * Update/correct a meter reading
   */
  @Put(':id')
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager')
  @ApiOperation({
    summary: 'Update meter reading',
    description:
      'Update or correct an existing meter reading. Automatically marks as CORRECTED if values change. Requires ADMIN or MANAGER role.',
  })
  @ApiParam({
    name: 'id',
    type: Number,
    description: 'Reading ID',
  })
  @ApiBody({
    type: UpdateMeterReadingDto,
    description: 'Updated reading data',
  })
  @ApiOkResponse({
    description: 'Meter reading updated successfully',
    type: MeterReadingResponseDto,
  })
  @ApiNotFoundResponse({ description: 'Meter reading not found' })
  @ApiBadRequestResponse({ description: 'Validation failed' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body(ValidationPipe) updateDto: UpdateMeterReadingDto,
  ) {
    return this.readingsService.update(id, updateDto);
  }

  // ==================== EXPORT/IMPORT ENDPOINTS ====================

  /**
   * Export readings to CSV file
   */
  @Get('export')
  @ApiOperation({
    summary: 'Export readings to CSV',
    description:
      'Export meter readings to a CSV file based on the provided filters. Returns a downloadable CSV file.',
  })
  @ApiQuery({
    name: 'meterId',
    required: false,
    type: Number,
    description: 'Filter by meter ID',
  })
  @ApiQuery({
    name: 'meterReaderId',
    required: false,
    type: Number,
    description: 'Filter by meter reader ID',
  })
  @ApiQuery({
    name: 'readingSource',
    required: false,
    enum: ReadingSourceDto,
    description: 'Filter by reading source',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Filter readings from this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Filter readings up to this date (YYYY-MM-DD)',
  })
  @ApiProduces('text/csv')
  @ApiOkResponse({
    description: 'CSV file download',
    content: {
      'text/csv': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async exportToCsv(@Query(ValidationPipe) filters: ReadingFilterDto, @Res() res: Response) {
    const csvContent = await this.readingsService.exportToCsv(filters);

    const filename = `meter-readings-export-${new Date().toISOString().split('T')[0]}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.send(csvContent);
  }

  /**
   * Import readings from CSV file
   */
  @Post('import')
  @HttpCode(HttpStatus.OK)
  @UseGuards(RolesGuard)
  @Roles('Admin', 'Manager')
  @UseInterceptors(FileInterceptor('file'))
  @ApiOperation({
    summary: 'Import readings from CSV',
    description:
      'Import meter readings from a CSV file. CSV must have columns: meter_id, reading_date, import_reading. Optional: export_reading, reading_source. Requires ADMIN or MANAGER role.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
          description: 'CSV file to import',
        },
      },
    },
  })
  @ApiOkResponse({
    description: 'Import results',
    schema: {
      properties: {
        success: { type: 'boolean' },
        totalRows: { type: 'number' },
        successCount: { type: 'number' },
        failureCount: { type: 'number' },
        errors: {
          type: 'array',
          items: {
            properties: {
              row: { type: 'number' },
              error: { type: 'string' },
            },
          },
        },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Invalid CSV format' })
  async importFromCsv(@UploadedFile() file: Express.Multer.File, @CurrentUser() user: any) {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!file.mimetype.includes('csv') && !file.originalname.endsWith('.csv')) {
      throw new BadRequestException('File must be a CSV file');
    }

    const csvContent = file.buffer.toString('utf-8');

    // Get meterReaderId if the current user is a meter reader
    let meterReaderId: number | undefined;
    if (user?.role === 'METER_READER' && user?.meterReaderId) {
      meterReaderId = user.meterReaderId;
    }

    return this.readingsService.importFromCsv(csvContent, meterReaderId);
  }

  // ==================== ANOMALY DETECTION ENDPOINTS ====================

  /**
   * Detect anomalous readings
   */
  @Get('anomalies')
  @ApiOperation({
    summary: 'Detect reading anomalies',
    description:
      'Analyze meter readings to detect anomalies such as negative consumption, unusually high consumption, zero consumption, future dates, and duplicate readings.',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Analyze readings from this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Analyze readings up to this date (YYYY-MM-DD)',
  })
  @ApiQuery({
    name: 'threshold',
    required: false,
    type: Number,
    description: 'Multiplier for high consumption detection (e.g., 3 means 3x average is flagged)',
    example: 3,
  })
  @ApiOkResponse({
    description: 'Anomaly detection results',
    schema: {
      properties: {
        anomalies: {
          type: 'array',
          items: {
            properties: {
              reading: { $ref: '#/components/schemas/MeterReadingResponseDto' },
              anomalyType: {
                type: 'string',
                enum: [
                  'NEGATIVE_CONSUMPTION',
                  'ZERO_CONSUMPTION',
                  'HIGH_CONSUMPTION',
                  'READING_DECREASED',
                  'FUTURE_DATE',
                  'DUPLICATE_DATE',
                ],
              },
              severity: { type: 'string', enum: ['HIGH', 'MEDIUM', 'LOW'] },
              description: { type: 'string' },
            },
          },
        },
        summary: {
          properties: {
            totalAnalyzed: { type: 'number' },
            anomalyCount: { type: 'number' },
            byType: { type: 'object' },
            bySeverity: { type: 'object' },
          },
        },
      },
    },
  })
  async detectAnomalies(
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
    @Query('threshold') threshold?: number,
  ) {
    return this.readingsService.detectAnomalies(
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
      threshold ? Number(threshold) : undefined,
    );
  }
}

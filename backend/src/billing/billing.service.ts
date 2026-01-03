import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import {
  Meter,
  MeterReading,
  Bill,
  BillDetail,
  BillTax,
  TariffSlab,
  TaxConfig,
  ServiceConnection,
  Customer,
} from '../database/entities';
import { TaxStatus } from '../database/entities/tax-config.entity';
import { ConnectionStatus } from '../database/entities/service-connection.entity';
import { BillCalculationDto, SlabBreakdownDto, TaxBreakdownDto } from './dto';

/**
 * Service for billing operations
 * Handles bill calculations, generation, and management
 */
@Injectable()
export class BillingService {
  private readonly logger = new Logger(BillingService.name);

  constructor(
    @InjectRepository(Meter)
    private meterRepository: Repository<Meter>,
    @InjectRepository(MeterReading)
    private readingRepository: Repository<MeterReading>,
    @InjectRepository(Bill)
    private billRepository: Repository<Bill>,
    @InjectRepository(BillDetail)
    private billDetailRepository: Repository<BillDetail>,
    @InjectRepository(BillTax)
    private billTaxRepository: Repository<BillTax>,
    @InjectRepository(TariffSlab)
    private tariffSlabRepository: Repository<TariffSlab>,
    @InjectRepository(TaxConfig)
    private taxConfigRepository: Repository<TaxConfig>,
    @InjectRepository(ServiceConnection)
    private connectionRepository: Repository<ServiceConnection>,
    @InjectRepository(Customer)
    private customerRepository: Repository<Customer>,
  ) {}

  /**
   * Calculate bill without saving
   * Returns detailed breakdown of all charges
   */
  async calculateBill(
    meterId: number,
    periodStart: Date,
    periodEnd: Date,
  ): Promise<BillCalculationDto> {
    this.logger.log(
      `Calculating bill for meter ${meterId}, period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
    );

    // Step a) Get meter with connection, customer, tariff category
    const meter = await this.meterRepository.findOne({
      where: { meterId },
      relations: ['utilityType'],
    });

    if (!meter) {
      throw new NotFoundException(`Meter with ID ${meterId} not found`);
    }

    // Get connection for this meter
    const connection = await this.connectionRepository.findOne({
      where: { meterId },
      relations: ['customer', 'tariffCategory'],
    });

    if (!connection) {
      throw new NotFoundException(`No service connection found for meter ${meterId}`);
    }

    if (!connection.tariffCategory) {
      throw new BadRequestException(`Tariff category not configured for meter ${meterId}`);
    }

    // Step b) Get readings for period (first and last reading)
    const readings = await this.readingRepository.find({
      where: {
        meterId,
        readingDate: Between(periodStart, periodEnd),
      },
      order: {
        readingDate: 'ASC',
      },
    });

    if (readings.length < 2) {
      throw new BadRequestException(
        `Insufficient readings for meter ${meterId} in the specified period. At least 2 readings required.`,
      );
    }

    const firstReading = readings[0];
    const lastReading = readings[readings.length - 1];

    // Step c) Calculate consumption: lastReading - firstReading
    const consumption =
      (lastReading.importReading || 0) -
      (firstReading.prevImportReading || firstReading.importReading || 0);
    const exportUnits =
      (lastReading.exportReading || 0) -
      (firstReading.prevExportReading || firstReading.exportReading || 0);

    // Step d) If consumption < 0, throw error (invalid readings)
    if (consumption < 0) {
      throw new BadRequestException(
        `Invalid readings detected for meter ${meterId}. ` +
          `Last reading (${lastReading.importReading}) is less than first reading (${firstReading.importReading})`,
      );
    }

    this.logger.debug(`Consumption: ${consumption} units, Export: ${exportUnits} units`);

    // Step e & f) Apply tariff slabs
    const billDate = new Date();
    const slabResult = await this.applyTariffSlabs(
      consumption,
      connection.tariffCategoryId,
      billDate,
    );

    // Step g & h) Calculate subtotal
    const subtotal = slabResult.energyCharge + slabResult.fixedCharge;

    this.logger.debug(
      `Energy charge: ${slabResult.energyCharge}, Fixed charge: ${slabResult.fixedCharge}, Subtotal: ${subtotal}`,
    );

    // Step i) Calculate subsidy if customer eligible
    const subsidy = await this.calculateSubsidy(connection.customerId, subtotal, billDate);

    // Step j) Calculate solar export credit
    const solarCredit = await this.calculateSolarCredit(exportUnits, meter.utilityTypeId, billDate);

    // Step k) Calculate before tax
    const beforeTax = Math.max(0, subtotal - subsidy - solarCredit);

    this.logger.debug(
      `Subsidy: ${subsidy}, Solar credit: ${solarCredit}, Before tax: ${beforeTax}`,
    );

    // Step l & m) Calculate taxes
    const taxes = await this.calculateTaxes(beforeTax, billDate);
    const totalTax = taxes.reduce((sum, tax) => sum + tax.amount, 0);

    // Step n) Calculate total amount
    const totalAmount = this.roundAmount(beforeTax + totalTax);

    this.logger.log(`Bill calculation completed for meter ${meterId}. Total: ${totalAmount}`);

    // Step o) Return BillCalculationDto
    return {
      consumption: this.roundAmount(consumption),
      slabBreakdown: slabResult.slabs,
      energyCharge: this.roundAmount(slabResult.energyCharge),
      fixedCharge: this.roundAmount(slabResult.fixedCharge),
      subtotal: this.roundAmount(subtotal),
      subsidy: this.roundAmount(subsidy),
      solarCredit: this.roundAmount(solarCredit),
      beforeTax: this.roundAmount(beforeTax),
      taxes,
      totalAmount,
    };
  }

  /**
   * Apply progressive tariff slabs to consumption
   */
  async applyTariffSlabs(
    consumption: number,
    tariffCategoryId: number,
    billDate: Date,
  ): Promise<{
    slabs: SlabBreakdownDto[];
    energyCharge: number;
    fixedCharge: number;
  }> {
    this.logger.debug(
      `Applying tariff slabs for category ${tariffCategoryId}, consumption: ${consumption}`,
    );

    // Step a) Get all slabs for tariff category valid on billDate
    const slabs = await this.tariffSlabRepository.find({
      where: {
        tariffCategoryId,
      },
      order: {
        fromUnit: 'ASC',
      },
    });

    if (slabs.length === 0) {
      throw new BadRequestException(
        `No tariff slabs found for tariff category ${tariffCategoryId}`,
      );
    }

    // Filter slabs valid on bill date
    const validSlabs = slabs.filter((slab) => slab.isValid(billDate));

    if (validSlabs.length === 0) {
      throw new BadRequestException(
        `No valid tariff slabs found for tariff category ${tariffCategoryId} on ${billDate.toDateString()}`,
      );
    }

    // Step b) Sort already done in query
    const breakdown: SlabBreakdownDto[] = [];
    let totalEnergyCharge = 0;
    let accumulatedUnits = 0;

    // Get fixed charge from first slab
    const fixedCharge = validSlabs[0].fixedCharge;

    // Step c) For each slab, calculate units and amount
    for (let i = 0; i < validSlabs.length; i++) {
      const slab = validSlabs[i];

      // Skip if consumption doesn't reach this slab
      if (consumption <= slab.fromUnit) {
        break;
      }

      // Calculate units in this slab
      let unitsInSlab = 0;

      if (slab.toUnit === null) {
        // Last slab (unlimited)
        unitsInSlab = consumption - slab.fromUnit;
      } else if (consumption > slab.toUnit) {
        // Consumption exceeds this slab
        unitsInSlab = slab.toUnit - slab.fromUnit;
      } else {
        // Consumption falls within this slab
        unitsInSlab = consumption - slab.fromUnit;
      }

      // Calculate amount for this slab
      const amount = unitsInSlab * slab.ratePerUnit;
      totalEnergyCharge += amount;
      accumulatedUnits += unitsInSlab;

      // Add to breakdown
      breakdown.push({
        from: slab.fromUnit,
        to: slab.toUnit,
        units: this.roundAmount(unitsInSlab),
        rate: slab.ratePerUnit,
        amount: this.roundAmount(amount),
      });

      this.logger.debug(
        `Slab ${i + 1}: ${slab.fromUnit}-${slab.toUnit || '∞'} units, ` +
          `${unitsInSlab} units @ ${slab.ratePerUnit} = ${amount}`,
      );

      // Stop if we've accounted for all consumption
      if (accumulatedUnits >= consumption) {
        break;
      }
    }

    // Step d & e) Return results
    return {
      slabs: breakdown,
      energyCharge: totalEnergyCharge,
      fixedCharge,
    };
  }

  /**
   * Calculate subsidy amount for customer
   */
  async calculateSubsidy(customerId: number, billAmount: number, _billDate: Date): Promise<number> {
    this.logger.debug(`Calculating subsidy for customer ${customerId}, bill amount: ${billAmount}`);

    // For now, return 0 as subsidy tables will be implemented later
    void _billDate; // Mark as intentionally unused
    // TODO: Implement CustomerSubsidy and SubsidyScheme lookup
    // Step a) Get active CustomerSubsidy for customer on billDate
    // Step b) Get SubsidyScheme details
    // Step c & d) Calculate based on discount_type
    // Step e) Return subsidy amount (max = billAmount)

    // Placeholder implementation
    const subsidy = 0;

    this.logger.debug(`Subsidy calculated: ${subsidy}`);
    return subsidy;
  }

  /**
   * Calculate solar export credit
   */
  async calculateSolarCredit(
    exportUnits: number,
    _utilityTypeId: number,
    _billDate: Date,
  ): Promise<number> {
    this.logger.debug(`Calculating solar credit for ${exportUnits} export units`);
    void _utilityTypeId; // Mark as intentionally unused
    void _billDate; // Mark as intentionally unused

    if (exportUnits <= 0) {
      return 0;
    }

    // For now, use a fixed export rate
    // TODO: Implement proper export rate lookup from configuration
    // Step a) Get export rate (could be in tariff or separate config)
    const exportRate = 5.0; // Rs per unit (placeholder)

    // Step b) Calculate credit
    const credit = exportUnits * exportRate;

    this.logger.debug(`Solar credit calculated: ${exportUnits} units @ ${exportRate} = ${credit}`);

    // Step c) Return credit amount
    return credit;
  }

  /**
   * Calculate all applicable taxes
   */
  async calculateTaxes(taxableAmount: number, billDate: Date): Promise<TaxBreakdownDto[]> {
    this.logger.debug(`Calculating taxes on taxable amount: ${taxableAmount}`);

    // Step a) Get all active TaxConfig records on billDate
    const activeTaxes = await this.taxConfigRepository.find({
      where: {
        status: TaxStatus.ACTIVE,
      },
    });

    // Filter taxes that are active on bill date
    const applicableTaxes = activeTaxes.filter((tax) => tax.isActive(billDate));

    if (applicableTaxes.length === 0) {
      this.logger.warn(`No active taxes found for date ${billDate.toDateString()}`);
      return [];
    }

    // Step b) Calculate each tax
    const taxes: TaxBreakdownDto[] = [];

    for (const tax of applicableTaxes) {
      const taxAmount = (taxableAmount * tax.ratePercent) / 100;

      taxes.push({
        name: tax.taxName,
        rate: tax.ratePercent,
        amount: this.roundAmount(taxAmount),
      });

      this.logger.debug(`Tax: ${tax.taxName} @ ${tax.ratePercent}% = ${taxAmount}`);
    }

    // Step c) Return taxes array
    return taxes;
  }

  /**
   * Round amount to 2 decimal places
   */
  private roundAmount(amount: number): number {
    return Math.round(amount * 100) / 100;
  }

  /* ========================================
     CRUD OPERATIONS (Part 2)
     ======================================== */

  /**
   * Create and save a bill
   */
  async create(
    meterId: number,
    periodStart: Date,
    periodEnd: Date,
    _employeeId?: number,
  ): Promise<Bill> {
    void _employeeId; // Reserved for future audit logging
    this.logger.log(`Generating bill for meter ${meterId}, period: ${periodStart} to ${periodEnd}`);

    // Step a) Calculate bill
    const calculation = await this.calculateBill(meterId, periodStart, periodEnd);

    // Step b) Validate calculation successful
    if (!calculation || calculation.totalAmount < 0) {
      throw new BadRequestException('Bill calculation failed or resulted in negative amount');
    }

    // Start transaction
    const queryRunner = this.billRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step c) Create Bill entity
      const bill = this.billRepository.create({
        meterId,
        billingPeriodStart: periodStart,
        billingPeriodEnd: periodEnd,
        billDate: new Date(),
        dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days from now
        totalImportUnit: calculation.consumption,
        totalExportUnit: 0, // TODO: Get from calculation when available
        energyChargeAmount: calculation.energyCharge,
        fixedChargeAmount: calculation.fixedCharge,
        subsidyAmount: calculation.subsidy,
        solarExportCredit: calculation.solarCredit,
      });

      const savedBill = await queryRunner.manager.save(Bill, bill);

      // Step d) Create BillDetail entities for each slab
      const billDetails: BillDetail[] = [];
      for (const slab of calculation.slabBreakdown) {
        const detail = this.billDetailRepository.create({
          billId: savedBill.billId,
          slabId: null, // TODO: Map slab from/to to actual slab_id
          unitsInSlab: slab.units,
          amount: slab.amount,
        });
        billDetails.push(detail);
      }

      if (billDetails.length > 0) {
        await queryRunner.manager.save(BillDetail, billDetails);
      }

      // Step e) Create BillTax entities for each tax
      const billTaxes: BillTax[] = [];
      for (const tax of calculation.taxes) {
        // Find tax config by name
        const taxConfig = await this.taxConfigRepository.findOne({
          where: { taxName: tax.name, status: TaxStatus.ACTIVE },
        });

        if (taxConfig) {
          const billTax = this.billTaxRepository.create({
            billId: savedBill.billId,
            taxId: taxConfig.taxId,
            ratePercentApplied: tax.rate,
            taxableBaseAmount: calculation.beforeTax,
          });
          billTaxes.push(billTax);
        }
      }

      if (billTaxes.length > 0) {
        await queryRunner.manager.save(BillTax, billTaxes);
      }

      // Step f) Commit transaction
      await queryRunner.commitTransaction();

      // Step g) Return bill with relations
      const result = await this.findOne(savedBill.billId);

      // Step h) Log bill generation
      this.logger.log(
        `Bill ${result.billId} generated successfully for meter ${meterId}. Total: ${calculation.totalAmount}`,
      );

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to create bill for meter ${meterId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Generate bills for multiple meters in bulk
   */
  async createBulk(
    utilityTypeId?: number,
    customerType?: string,
    meterIds?: number[],
    periodStart?: Date,
    periodEnd?: Date,
    dryRun: boolean = false,
  ): Promise<{
    success: Bill[];
    failed: Array<{ meterId: number; meterSerialNo: string; error: string }>;
  }> {
    this.logger.log('Starting bulk bill generation');

    const success: Bill[] = [];
    const failed: Array<{
      meterId: number;
      meterSerialNo: string;
      error: string;
    }> = [];

    // Step a & b) Get all meters with active connections
    const queryBuilder = this.meterRepository
      .createQueryBuilder('meter')
      .innerJoin('meter.serviceConnections', 'connection')
      .where('connection.connectionStatus = :status', { status: 'ACTIVE' });

    if (utilityTypeId) {
      queryBuilder.andWhere('meter.utilityTypeId = :utilityTypeId', { utilityTypeId });
    }

    if (meterIds && meterIds.length > 0) {
      queryBuilder.andWhere('meter.meterId IN (:...meterIds)', { meterIds });
    }

    if (customerType) {
      queryBuilder
        .innerJoin('connection.customer', 'customer')
        .andWhere('customer.customerType = :customerType', { customerType });
    }

    const meters = await queryBuilder.getMany();

    this.logger.log(`Found ${meters.length} meters for bulk billing`);

    // Step c) Process each meter
    for (const meter of meters) {
      try {
        const start = periodStart || new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        const end = periodEnd || new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

        if (dryRun) {
          // Step d) Dry run - just calculate without saving
          const calculation = await this.calculateBill(meter.meterId, start, end);
          success.push({ meterId: meter.meterId, calculation } as unknown as Bill);
        } else {
          // Step e) Generate and save bill
          const bill = await this.create(meter.meterId, start, end);
          success.push(bill);
        }
      } catch (error) {
        // Continue even if one fails
        this.logger.warn(`Failed to generate bill for meter ${meter.meterId}:`, error.message);
        failed.push({
          meterId: meter.meterId,
          meterSerialNo: meter.meterSerialNo,
          error: error.message,
        });
      }
    }

    // Step f) Return results summary
    this.logger.log(
      `Bulk billing completed: ${success.length} successful, ${failed.length} failed`,
    );

    return { success, failed };
  }

  /**
   * Find all bills with filtering and pagination
   */
  async findAll(filters?: {
    customerId?: number;
    meterId?: number;
    utilityTypeId?: number;
    status?: string;
    startDate?: Date;
    endDate?: Date;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
  }): Promise<{ bills: Bill[]; total: number }> {
    // Step a & b) Build query with filters
    const queryBuilder = this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.meter', 'meter')
      .leftJoinAndSelect('meter.utilityType', 'utilityType')
      .leftJoin('ServiceConnection', 'connection', 'connection.meter_id = meter.meter_id')
      .leftJoinAndSelect('bill.billDetails', 'billDetails')
      .leftJoinAndSelect('bill.billTaxes', 'billTaxes')
      .leftJoinAndSelect('bill.payments', 'payments');

    // Step c) Apply filters
    if (filters?.meterId) {
      queryBuilder.andWhere('bill.meter_id = :meterId', { meterId: filters.meterId });
    }

    if (filters?.customerId) {
      queryBuilder.andWhere('connection.customer_id = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.utilityTypeId) {
      queryBuilder.andWhere('meter.utility_type_id = :utilityTypeId', {
        utilityTypeId: filters.utilityTypeId,
      });
    }

    // Step d) Apply date range filters
    if (filters?.startDate) {
      queryBuilder.andWhere('bill.billDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('bill.billDate <= :endDate', { endDate: filters.endDate });
    }

    // Step e) Add pagination and sorting
    const page = filters?.page || 1;
    const limit = filters?.limit || 20;
    const sortBy = filters?.sortBy || 'billDate';
    const order = filters?.order || 'DESC';

    queryBuilder
      .orderBy(`bill.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit);

    // Execute query
    const [bills, total] = await queryBuilder.getManyAndCount();

    return { bills, total };
  }

  /**
   * Find one bill by ID with full details
   */
  async findOne(billId: number): Promise<Bill> {
    // Step a & b) Find bill with relations
    const bill = await this.billRepository.findOne({
      where: { billId },
      relations: [
        'meter',
        'meter.utilityType',
        'billDetails',
        'billDetails.tariffSlab',
        'billTaxes',
        'billTaxes.taxConfig',
        'payments',
      ],
    });

    // Step c) Throw error if not found
    if (!bill) {
      throw new NotFoundException(`Bill with ID ${billId} not found`);
    }

    // Step d) Return bill
    return bill;
  }

  /**
   * Find bills for a specific meter
   */
  async findByMeter(
    meterId: number,
    options?: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
    },
  ): Promise<Bill[]> {
    // Step a) Build query
    const queryBuilder = this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.billDetails', 'billDetails')
      .leftJoinAndSelect('bill.billTaxes', 'billTaxes')
      .leftJoinAndSelect('bill.payments', 'payments')
      .where('bill.meterId = :meterId', { meterId });

    // Step b) Apply date filters
    if (options?.startDate) {
      queryBuilder.andWhere('bill.billDate >= :startDate', { startDate: options.startDate });
    }

    if (options?.endDate) {
      queryBuilder.andWhere('bill.billDate <= :endDate', { endDate: options.endDate });
    }

    // Step c & d) Order and limit
    queryBuilder.orderBy('bill.billDate', 'DESC');

    if (options?.limit) {
      queryBuilder.take(options.limit);
    }

    // Step e) Return bills
    return queryBuilder.getMany();
  }

  /**
   * Find all bills for a customer (across all their connections)
   */
  async findByCustomer(customerId: number): Promise<Bill[]> {
    // Step a) Get all connections for customer
    const connections = await this.connectionRepository.find({
      where: { customerId },
      relations: ['meter'],
    });

    if (connections.length === 0) {
      return [];
    }

    // Step b) Get all meter IDs
    const meterIds = connections.map((conn) => conn.meterId).filter((id) => id !== null);

    if (meterIds.length === 0) {
      return [];
    }

    // Step c) Get all bills for those meters
    const bills = await this.billRepository
      .createQueryBuilder('bill')
      .leftJoinAndSelect('bill.meter', 'meter')
      .leftJoinAndSelect('bill.billDetails', 'billDetails')
      .leftJoinAndSelect('bill.billTaxes', 'billTaxes')
      .leftJoinAndSelect('bill.payments', 'payments')
      .where('bill.meterId IN (:...meterIds)', { meterIds })
      .orderBy('bill.billDate', 'DESC')
      .getMany();

    // Step d & e) Return bills
    return bills;
  }

  /**
   * Update/correct a bill
   */
  async update(
    billId: number,
    updates: {
      dueDate?: Date;
      subsidyAmount?: number;
      solarExportCredit?: number;
    },
    employeeId?: number,
  ): Promise<Bill> {
    // Step a) Find bill
    const bill = await this.findOne(billId);

    // Step b) Update allowed fields
    if (updates.dueDate) {
      bill.dueDate = updates.dueDate;
    }

    if (updates.subsidyAmount !== undefined) {
      bill.subsidyAmount = updates.subsidyAmount;
    }

    if (updates.solarExportCredit !== undefined) {
      bill.solarExportCredit = updates.solarExportCredit;
    }

    // Step d) Log correction
    this.logger.log(
      `Bill ${billId} updated by employee ${employeeId || 'system'}. Changes: ${JSON.stringify(updates)}`,
    );

    // Step e) Save and return
    return this.billRepository.save(bill);
  }

  /**
   * Recalculate bill (if tariff or readings changed)
   */
  async recalculate(billId: number): Promise<Bill> {
    this.logger.log(`Recalculating bill ${billId}`);

    // Step a) Get bill
    const bill = await this.findOne(billId);

    // Step b) Call calculateBill with same period
    const calculation = await this.calculateBill(
      bill.meterId,
      bill.billingPeriodStart,
      bill.billingPeriodEnd,
    );

    // Start transaction
    const queryRunner = this.billRepository.manager.connection.createQueryRunner();
    await queryRunner.connect();
    await queryRunner.startTransaction();

    try {
      // Step c) Update bill with new calculations
      bill.totalImportUnit = calculation.consumption;
      bill.energyChargeAmount = calculation.energyCharge;
      bill.fixedChargeAmount = calculation.fixedCharge;
      bill.subsidyAmount = calculation.subsidy;
      bill.solarExportCredit = calculation.solarCredit;

      await queryRunner.manager.save(Bill, bill);

      // Step d) Delete old BillDetails and BillTaxes
      await queryRunner.manager.delete(BillDetail, { billId });
      await queryRunner.manager.delete(BillTax, { billId });

      // Step e) Create new details
      const billDetails: BillDetail[] = [];
      for (const slab of calculation.slabBreakdown) {
        const detail = this.billDetailRepository.create({
          billId: bill.billId,
          slabId: null,
          unitsInSlab: slab.units,
          amount: slab.amount,
        });
        billDetails.push(detail);
      }

      if (billDetails.length > 0) {
        await queryRunner.manager.save(BillDetail, billDetails);
      }

      // Create new taxes
      const billTaxes: BillTax[] = [];
      for (const tax of calculation.taxes) {
        const taxConfig = await this.taxConfigRepository.findOne({
          where: { taxName: tax.name, status: TaxStatus.ACTIVE },
        });

        if (taxConfig) {
          const billTax = this.billTaxRepository.create({
            billId: bill.billId,
            taxId: taxConfig.taxId,
            ratePercentApplied: tax.rate,
            taxableBaseAmount: calculation.beforeTax,
          });
          billTaxes.push(billTax);
        }
      }

      if (billTaxes.length > 0) {
        await queryRunner.manager.save(BillTax, billTaxes);
      }

      // Step f) Commit transaction
      await queryRunner.commitTransaction();

      // Step g) Return updated bill
      const result = await this.findOne(bill.billId);

      this.logger.log(
        `Bill ${billId} recalculated successfully. New total: ${calculation.totalAmount}`,
      );

      return result;
    } catch (error) {
      await queryRunner.rollbackTransaction();
      this.logger.error(`Failed to recalculate bill ${billId}:`, error);
      throw error;
    } finally {
      await queryRunner.release();
    }
  }

  /**
   * Get billing statistics/summary
   */
  async getSummary(filters?: {
    customerId?: number;
    utilityTypeId?: number;
    startDate?: Date;
    endDate?: Date;
  }): Promise<{
    totalBills: number;
    totalAmount: number;
    paidAmount: number;
    outstanding: number;
    overdueBills: number;
    overdueAmount: number;
  }> {
    // Step a) Build base query
    const queryBuilder = this.billRepository
      .createQueryBuilder('bill')
      .leftJoin('bill.meter', 'meter')
      .leftJoin('ServiceConnection', 'connection', 'connection.meter_id = meter.meter_id')
      .leftJoin('bill.payments', 'payments');

    // Apply filters
    if (filters?.customerId) {
      queryBuilder.andWhere('connection.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.utilityTypeId) {
      queryBuilder.andWhere('meter.utilityTypeId = :utilityTypeId', {
        utilityTypeId: filters.utilityTypeId,
      });
    }

    if (filters?.startDate) {
      queryBuilder.andWhere('bill.billDate >= :startDate', { startDate: filters.startDate });
    }

    if (filters?.endDate) {
      queryBuilder.andWhere('bill.billDate <= :endDate', { endDate: filters.endDate });
    }

    // Step b-g) Get aggregated data
    const result = await queryBuilder
      .select('COUNT(DISTINCT bill.billId)', 'totalBills')
      .addSelect(
        'SUM(bill.energyChargeAmount + bill.fixedChargeAmount - bill.subsidyAmount - bill.solarExportCredit)',
        'totalAmount',
      )
      .addSelect('SUM(payments.paymentAmount)', 'paidAmount')
      .getRawOne();

    const totalBills = parseInt(result.totalBills) || 0;
    const totalAmount = parseFloat(result.totalAmount) || 0;
    const paidAmount = parseFloat(result.paidAmount) || 0;
    const outstanding = totalAmount - paidAmount;

    // Step e & f) Count overdue bills
    const overdueQuery = this.billRepository
      .createQueryBuilder('bill')
      .leftJoin('bill.meter', 'meter')
      .leftJoin('ServiceConnection', 'connection', 'connection.meter_id = meter.meter_id')
      .leftJoin('bill.payments', 'payments')
      .where('bill.dueDate < :today', { today: new Date() });

    if (filters?.customerId) {
      overdueQuery.andWhere('connection.customerId = :customerId', {
        customerId: filters.customerId,
      });
    }

    if (filters?.utilityTypeId) {
      overdueQuery.andWhere('meter.utilityTypeId = :utilityTypeId', {
        utilityTypeId: filters.utilityTypeId,
      });
    }

    const overdueResult = await overdueQuery
      .select('COUNT(DISTINCT bill.billId)', 'overdueBills')
      .addSelect(
        'SUM(bill.energyChargeAmount + bill.fixedChargeAmount - bill.subsidyAmount - bill.solarExportCredit - COALESCE(payments.paymentAmount, 0))',
        'overdueAmount',
      )
      .getRawOne();

    const overdueBills = parseInt(overdueResult.overdueBills) || 0;
    const overdueAmount = parseFloat(overdueResult.overdueAmount) || 0;

    // Step g) Return summary
    return {
      totalBills,
      totalAmount: this.roundAmount(totalAmount),
      paidAmount: this.roundAmount(paidAmount),
      outstanding: this.roundAmount(outstanding),
      overdueBills,
      overdueAmount: this.roundAmount(overdueAmount),
    };
  }

  /**
   * Void/cancel a bill
   */
  async void(billId: number, reason: string, employeeId: number): Promise<void> {
    // Step a) Get bill
    const bill = await this.findOne(billId);

    // Step b) Check bill not paid
    const totalPaid = bill.payments?.reduce((sum, p) => sum + p.paymentAmount, 0) || 0;
    if (totalPaid > 0) {
      throw new BadRequestException(
        `Cannot void bill ${billId}. Bill has payments totaling ${totalPaid}`,
      );
    }

    // Step c) Mark as voided (add a status column or use a flag)
    // For now, we'll set due_date far in future and set amounts to 0
    bill.dueDate = new Date('2099-12-31');
    bill.energyChargeAmount = 0;
    bill.fixedChargeAmount = 0;
    bill.subsidyAmount = 0;
    bill.solarExportCredit = 0;

    await this.billRepository.save(bill);

    // Step d) Log void
    this.logger.warn(`Bill ${billId} voided by employee ${employeeId}. Reason: ${reason}`);
  }

  /**
   * Auto-generate bill from a meter reading
   * This is called after a meter reading is recorded to automatically generate a bill
   *
   * @param meterId - The meter ID
   * @param readingDate - The date of the new reading
   * @param autoGenerateOptions - Options for auto-generation
   * @returns Generated bill or null if conditions not met
   */
  async generateBillFromReading(
    meterId: number,
    readingDate: Date,
    options?: {
      minDaysBetweenBills?: number;
      dueDaysFromBillDate?: number;
    },
  ): Promise<Bill | null> {
    const minDays = options?.minDaysBetweenBills ?? 25; // Default: at least 25 days between bills
    const dueDays = options?.dueDaysFromBillDate ?? 15; // Default: due 15 days after bill date

    this.logger.log(
      `🔍 Checking auto-bill generation for meter ${meterId} with reading date ${readingDate.toISOString()}`,
    );
    this.logger.log(`   Settings: minDays=${minDays}, dueDays=${dueDays}`);

    try {
      // Step 1: Get the meter with connection info
      const meter = await this.meterRepository.findOne({
        where: { meterId },
        relations: ['utilityType'],
      });

      if (!meter) {
        this.logger.warn(`❌ Auto-bill: Meter ${meterId} not found`);
        return null;
      }
      this.logger.log(`✓ Step 1: Meter ${meterId} found - ${meter.meterSerialNo}`);

      // Step 2: Get active connection for this meter
      const connection = await this.connectionRepository.findOne({
        where: { meterId, connectionStatus: ConnectionStatus.ACTIVE },
        relations: ['tariffCategory'],
      });

      if (!connection) {
        this.logger.warn(
          `❌ Auto-bill: No active connection for meter ${meterId}. Check service_connection table.`,
        );
        return null;
      }
      this.logger.log(
        `✓ Step 2: Active connection found - ID ${connection.connectionId}, Status: ${connection.connectionStatus}`,
      );

      if (!connection.tariffCategory) {
        this.logger.warn(
          `❌ Auto-bill: No tariff category for meter ${meterId}. Assign a tariff category to the connection.`,
        );
        return null;
      }
      this.logger.log(`✓ Step 3: Tariff category assigned - ${connection.tariffCategory.name}`);

      // Step 3: Check if there's an existing bill to determine billing period
      const lastBill = await this.billRepository.findOne({
        where: { meterId },
        order: { billingPeriodEnd: 'DESC' },
      });

      let periodStart: Date;

      if (lastBill) {
        // Period starts from the last bill's end date (inclusive) to capture the ending reading as the starting reading
        periodStart = new Date(lastBill.billingPeriodEnd);

        // Check if enough time has passed since last bill
        const daysSinceLastBill = Math.ceil(
          (readingDate.getTime() - lastBill.billingPeriodEnd.getTime()) / (1000 * 60 * 60 * 24),
        );

        this.logger.log(
          `✓ Step 4: Last bill found - ID ${lastBill.billId}, ended ${lastBill.billingPeriodEnd.toISOString()}`,
        );
        this.logger.log(
          `   Days since last bill: ${daysSinceLastBill} (minimum required: ${minDays})`,
        );

        if (daysSinceLastBill < minDays) {
          this.logger.warn(
            `❌ Auto-bill: Only ${daysSinceLastBill} days since last bill. Minimum is ${minDays} days.`,
          );
          return null;
        }
      } else {
        this.logger.log(`✓ Step 4: No previous bill found - this will be the first bill`);
        // First bill for this meter - get first reading date as period start
        const firstReading = await this.readingRepository.findOne({
          where: { meterId },
          order: { readingDate: 'ASC' },
        });

        if (!firstReading) {
          this.logger.warn(`❌ Auto-bill: No readings found for meter ${meterId}`);
          return null;
        }

        periodStart = new Date(firstReading.readingDate);
        this.logger.log(`   First reading date: ${periodStart.toISOString()}`);
      }

      // Step 4: Get readings count in the billing period
      this.logger.log(
        `🔍 Checking readings between ${periodStart.toISOString()} and ${readingDate.toISOString()}`,
      );
      // Get all readings from period start (inclusive) to current reading date (inclusive)
      const readings = await this.readingRepository
        .createQueryBuilder('reading')
        .where('reading.meterId = :meterId', { meterId })
        .andWhere('reading.readingDate >= :periodStart', { periodStart })
        .andWhere('reading.readingDate <= :readingDate', { readingDate })
        .orderBy('reading.readingDate', 'ASC')
        .getMany();

      this.logger.log(`   Found ${readings.length} readings in billing period`);

      if (readings.length < 2) {
        this.logger.warn(
          `❌ Auto-bill: Insufficient readings for meter ${meterId}. Found ${readings.length}, need at least 2.`,
        );
        return null;
      }

      this.logger.log(`✓ Step 5: Sufficient readings available (${readings.length} readings)`);

      // Step 5: Generate the bill
      this.logger.log(
        `🔧 Generating bill for meter ${meterId}, period: ${periodStart.toISOString()} to ${readingDate.toISOString()}`,
      );

      const bill = await this.create(meterId, periodStart, readingDate);

      // Update due date based on options
      if (dueDays !== 15) {
        bill.dueDate = new Date(bill.billDate);
        bill.dueDate.setDate(bill.dueDate.getDate() + dueDays);
        await this.billRepository.save(bill);
      }

      this.logger.log(
        `✅ AUTO-BILL GENERATED: Bill #${bill.billId} for meter ${meterId}, Amount: ${bill.getTotalAmount().toFixed(2)}`,
      );

      return bill;
    } catch (error) {
      this.logger.error(`❌ Auto-bill generation FAILED for meter ${meterId}: ${error.message}`);
      this.logger.error(error.stack);
      // Don't throw - auto-generation failure shouldn't block reading creation
      return null;
    }
  }

  /**
   * Check if a bill can be auto-generated for a meter
   * Returns information about billing eligibility
   */
  async checkBillingEligibility(meterId: number): Promise<{
    eligible: boolean;
    reason: string;
    lastBillDate?: Date;
    readingCount?: number;
    suggestedPeriodStart?: Date;
  }> {
    try {
      // Check meter exists
      const meter = await this.meterRepository.findOne({
        where: { meterId },
        relations: ['utilityType'],
      });

      if (!meter) {
        return { eligible: false, reason: 'Meter not found' };
      }

      // Check active connection
      const connection = await this.connectionRepository.findOne({
        where: { meterId, connectionStatus: ConnectionStatus.ACTIVE },
        relations: ['tariffCategory'],
      });

      if (!connection) {
        return { eligible: false, reason: 'No active service connection' };
      }

      if (!connection.tariffCategory) {
        return { eligible: false, reason: 'No tariff category assigned' };
      }

      // Get last bill
      const lastBill = await this.billRepository.findOne({
        where: { meterId },
        order: { billingPeriodEnd: 'DESC' },
      });

      let suggestedPeriodStart: Date | undefined;
      if (lastBill) {
        suggestedPeriodStart = new Date(lastBill.billingPeriodEnd);
        suggestedPeriodStart.setDate(suggestedPeriodStart.getDate() + 1);
      } else {
        const firstReading = await this.readingRepository.findOne({
          where: { meterId },
          order: { readingDate: 'ASC' },
        });
        if (firstReading) {
          suggestedPeriodStart = new Date(firstReading.readingDate);
        }
      }

      // Count unbilled readings
      const readingCount = await this.readingRepository.count({
        where: {
          meterId,
          ...(suggestedPeriodStart
            ? { readingDate: Between(suggestedPeriodStart, new Date()) }
            : {}),
        },
      });

      return {
        eligible: readingCount >= 2,
        reason:
          readingCount >= 2
            ? 'Ready for billing'
            : `Need at least 2 readings (currently ${readingCount})`,
        lastBillDate: lastBill?.billingPeriodEnd,
        readingCount,
        suggestedPeriodStart,
      };
    } catch (error) {
      return { eligible: false, reason: error.message };
    }
  }
}

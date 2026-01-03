import { Injectable, Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { MeterReadingCreatedEvent } from '../readings/events';
import { BillingService } from './billing.service';
import { Bill, MeterReading, ServiceConnection } from '../database/entities';
import { ConnectionStatus } from '../database/entities/service-connection.entity';

/**
 * Event listener for automated bill generation
 * Listens to meter reading events and triggers bill generation asynchronously
 */
@Injectable()
export class BillingEventListener {
  private readonly logger = new Logger(BillingEventListener.name);

  constructor(
    private readonly billingService: BillingService,
    @InjectRepository(MeterReading)
    private readonly readingRepository: Repository<MeterReading>,
    @InjectRepository(Bill)
    private readonly billRepository: Repository<Bill>,
    @InjectRepository(ServiceConnection)
    private readonly connectionRepository: Repository<ServiceConnection>,
  ) {}

  /**
   * Handle meter reading created event
   * Automatically generates a bill if conditions are met
   */
  @OnEvent('meter-reading.created', { async: true })
  async handleMeterReadingCreated(event: MeterReadingCreatedEvent): Promise<void> {
    const { reading, options } = event;

    this.logger.log(
      `📨 Event received: meter-reading.created for meter ${reading.meterId}, reading ID ${reading.readingId}`,
    );

    // Check if auto-generation is disabled
    if (options?.autoGenerateBill === false) {
      this.logger.log(`⏭️ Auto-bill generation disabled for meter ${reading.meterId}`);
      return;
    }

    try {
      // Step 1: Validate meter has active connection
      const connection = await this.connectionRepository.findOne({
        where: {
          meterId: reading.meterId,
          connectionStatus: ConnectionStatus.ACTIVE,
        },
        relations: ['tariffCategory'],
      });

      if (!connection) {
        this.logger.warn(
          `⚠️ No active connection found for meter ${reading.meterId}. Skipping bill generation.`,
        );
        return;
      }

      if (!connection.tariffCategory) {
        this.logger.warn(
          `⚠️ No tariff category assigned to meter ${reading.meterId}. Skipping bill generation.`,
        );
        return;
      }

      // Step 2: Find previous reading to determine billing period start
      const allReadings = await this.readingRepository.find({
        where: { meterId: reading.meterId },
        order: { readingDate: 'DESC' },
        take: 2, // Get 2 most recent readings
      });

      const previousReading = allReadings.length > 1 ? allReadings[1] : null;

      let periodStart: Date;

      if (previousReading) {
        periodStart = new Date(previousReading.readingDate);
        this.logger.debug(
          `✓ Previous reading found (ID: ${previousReading.readingId}, Date: ${previousReading.readingDate.toISOString()})`,
        );
      } else {
        // First reading - use connection activation date or first reading date
        periodStart = new Date(reading.readingDate);
        periodStart.setDate(periodStart.getDate() - 30); // Default to 30 days before first reading
        this.logger.debug(
          `✓ First reading for meter ${reading.meterId}. Using ${periodStart.toISOString()} as period start.`,
        );
      }

      const periodEnd = new Date(reading.readingDate);

      // Step 3: Check for duplicate bills
      const existingBill = await this.billRepository.findOne({
        where: {
          meterId: reading.meterId,
          billingPeriodEnd: periodEnd,
        },
      });

      if (existingBill) {
        this.logger.warn(
          `⚠️ Bill already exists for meter ${reading.meterId} with end date ${periodEnd.toISOString()} (Bill ID: ${existingBill.billId}). Skipping duplicate generation.`,
        );
        return;
      }

      // Step 4: Check minimum days requirement
      const minDays = options?.minDaysBetweenBills ?? 25;
      const daysBetween = Math.ceil(
        (periodEnd.getTime() - periodStart.getTime()) / (1000 * 60 * 60 * 24),
      );

      if (daysBetween < minDays) {
        this.logger.log(
          `⏳ Only ${daysBetween} days between readings for meter ${reading.meterId}. Minimum required: ${minDays} days. Skipping bill generation.`,
        );
        return;
      }

      // Step 5: Verify sufficient readings exist in the period
      const readingsInPeriod = await this.readingRepository
        .createQueryBuilder('reading')
        .where('reading.meterId = :meterId', { meterId: reading.meterId })
        .andWhere('reading.readingDate >= :periodStart', { periodStart })
        .andWhere('reading.readingDate <= :periodEnd', { periodEnd })
        .getCount();

      if (readingsInPeriod < 2) {
        this.logger.log(
          `⏳ Insufficient readings for meter ${reading.meterId}. Found ${readingsInPeriod}, need at least 2. Skipping bill generation.`,
        );
        return;
      }

      // Step 6: Generate the bill
      this.logger.log(
        `🔧 Generating bill for meter ${reading.meterId}, period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
      );

      const bill = await this.billingService.create(reading.meterId, periodStart, periodEnd);

      // Update due date if custom due days specified
      const dueDays = options?.dueDaysFromBillDate ?? 15;
      if (dueDays !== 15 && bill) {
        bill.dueDate = new Date(bill.billDate);
        bill.dueDate.setDate(bill.dueDate.getDate() + dueDays);
        await this.billRepository.save(bill);
      }

      this.logger.log(
        `✅ AUTO-BILL GENERATED via Event: Bill #${bill.billId} for meter ${reading.meterId}, Amount: Rs ${bill.getTotalAmount().toFixed(2)}`,
      );
      this.logger.log(
        `   Reading ID: ${reading.readingId}, Period: ${periodStart.toISOString()} to ${periodEnd.toISOString()}`,
      );
    } catch (error) {
      // Log error but don't throw - failures should not crash the app
      this.logger.error(
        `❌ Failed to auto-generate bill for meter ${reading.meterId} after reading ${reading.readingId}`,
      );
      this.logger.error(`   Error: ${error.message}`);
      this.logger.error(error.stack);

      // Optional: Could emit a failed-bill-generation event here for monitoring
      // this.eventEmitter.emit('bill-generation.failed', { reading, error });
    }
  }
}

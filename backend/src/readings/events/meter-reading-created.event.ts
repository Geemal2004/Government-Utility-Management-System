import { MeterReading } from '../../database/entities/meter-reading.entity';

/**
 * Event emitted when a new meter reading is created
 * Used to trigger automated billing processes
 */
export class MeterReadingCreatedEvent {
  constructor(
    public readonly reading: MeterReading,
    public readonly options?: {
      autoGenerateBill?: boolean;
      minDaysBetweenBills?: number;
      dueDaysFromBillDate?: number;
    },
  ) {}
}

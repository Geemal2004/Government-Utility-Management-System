import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import { Meter } from './meter.entity';
// MeterReader import handled via string reference to avoid circular dependency

/**
 * Reading source enum - indicates how the reading was captured
 */
export enum ReadingSource {
  MANUAL = 'MANUAL',
  SMART_METER = 'SMART_METER',
  ESTIMATED = 'ESTIMATED',
  CORRECTED = 'CORRECTED',
}

/**
 * MeterReading entity - Maps to dbo.MeterReading table
 * Stores meter readings for consumption tracking and billing
 */
@Entity({ name: 'MeterReading', synchronize: false })
@Index('IX_MeterReading_meter_date', ['meterId', 'readingDate'])
@Index('IX_MeterReading_reader_date', ['meterReaderId', 'readingDate'])
export class MeterReading {
  @PrimaryGeneratedColumn({ name: 'reading_id', type: 'bigint' })
  readingId: number;

  @Column({ name: 'meter_id', type: 'bigint' })
  meterId: number;

  @Column({ name: 'meter_reader_id', type: 'bigint', nullable: true })
  meterReaderId: number | null;

  @Column({ name: 'reading_date', type: 'datetime2', precision: 0 })
  readingDate: Date;

  @Column({
    name: 'reading_source',
    type: 'varchar',
    length: 30,
    enum: ReadingSource,
  })
  readingSource: ReadingSource;

  @Column({
    name: 'import_reading',
    type: 'decimal',
    precision: 14,
    scale: 3,
    nullable: true,
  })
  importReading: number | null;

  @Column({
    name: 'prev_import_reading',
    type: 'decimal',
    precision: 14,
    scale: 3,
    nullable: true,
  })
  prevImportReading: number | null;

  @Column({
    name: 'export_reading',
    type: 'decimal',
    precision: 14,
    scale: 3,
    nullable: true,
  })
  exportReading: number | null;

  @Column({
    name: 'prev_export_reading',
    type: 'decimal',
    precision: 14,
    scale: 3,
    nullable: true,
  })
  prevExportReading: number | null;

  @Column({ name: 'device_id', type: 'varchar', length: 80, nullable: true })
  deviceId: string | null;

  @Column({ name: 'created_at', type: 'datetime2', precision: 0 })
  createdAt: Date;

  // ==================== RELATIONS ====================

  /**
   * Many-to-one relation with Meter
   * The meter this reading belongs to
   */
  @ManyToOne(() => Meter, (meter) => meter.readings)
  @JoinColumn({ name: 'meter_id', referencedColumnName: 'meterId' })
  meter: Meter;

  /**
   * Many-to-one relation with MeterReader
   * The employee who recorded this reading (if manual)
   */
  @ManyToOne('MeterReader', 'readings', { nullable: true })
  @JoinColumn({ name: 'meter_reader_id', referencedColumnName: 'employeeId' })
  meterReader: import('./meter-reader.entity').MeterReader | null;

  // ==================== COMPUTED FIELDS ====================

  /**
   * Computed consumption (import_reading - prev_import_reading)
   * Represents energy consumed in this period
   */
  get consumption(): number | null {
    if (this.importReading === null || this.prevImportReading === null) {
      return null;
    }
    return Number(this.importReading) - Number(this.prevImportReading);
  }

  /**
   * Computed exported energy (export_reading - prev_export_reading)
   * Represents energy exported to grid (for solar installations)
   */
  get exportedEnergy(): number | null {
    if (this.exportReading === null || this.prevExportReading === null) {
      return null;
    }
    return Number(this.exportReading) - Number(this.prevExportReading);
  }

  /**
   * Net consumption (consumption - exported)
   * Positive = consumed from grid, Negative = exported to grid
   */
  get netConsumption(): number | null {
    const consumed = this.consumption;
    const exported = this.exportedEnergy;
    if (consumed === null) return null;
    if (exported === null) return consumed;
    return consumed - exported;
  }

  // ==================== VALIDATION ====================

  /**
   * Validate reading before insert
   */
  @BeforeInsert()
  validateBeforeInsert(): void {
    this.validate();
    if (!this.createdAt) {
      this.createdAt = new Date();
    }
  }

  /**
   * Validate reading before update
   */
  @BeforeUpdate()
  validateBeforeUpdate(): void {
    this.validate();
  }

  /**
   * Validation logic for meter readings
   */
  private validate(): void {
    // Reading date cannot be in the future
    if (this.readingDate > new Date()) {
      throw new Error('Reading date cannot be in the future');
    }

    // Import reading must be >= prev import reading (unless CORRECTED)
    if (
      this.readingSource !== ReadingSource.CORRECTED &&
      this.importReading !== null &&
      this.prevImportReading !== null &&
      Number(this.importReading) < Number(this.prevImportReading)
    ) {
      throw new Error(
        'Import reading must be greater than or equal to previous import reading (unless corrected)',
      );
    }

    // Export reading must be >= prev export reading (unless CORRECTED)
    if (
      this.readingSource !== ReadingSource.CORRECTED &&
      this.exportReading !== null &&
      this.prevExportReading !== null &&
      Number(this.exportReading) < Number(this.prevExportReading)
    ) {
      throw new Error(
        'Export reading must be greater than or equal to previous export reading (unless corrected)',
      );
    }

    // Validate reading source
    if (!Object.values(ReadingSource).includes(this.readingSource)) {
      throw new Error(
        `Invalid reading source. Must be one of: ${Object.values(ReadingSource).join(', ')}`,
      );
    }
  }
}

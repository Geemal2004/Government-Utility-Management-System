import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  OneToMany,
  JoinColumn,
  Index,
} from 'typeorm';
import { UtilityType } from './utility-type.entity';
import { MeterReading } from './meter-reading.entity';

/**
 * Meter status enum
 */
export enum MeterStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  FAULTY = 'FAULTY',
  REPLACED = 'REPLACED',
}

/**
 * Meter entity mapping to the Meter table in SQL Server
 * Represents utility meters installed at service connections
 */
@Entity({ name: 'Meter' })
export class Meter {
  @PrimaryGeneratedColumn({ name: 'meter_id', type: 'bigint' })
  meterId: number;

  @Column({ name: 'meter_serial_no', type: 'varchar', length: 80, unique: true })
  meterSerialNo: string;

  @Index('IX_Meter_utility_type')
  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  @Column({ name: 'installation_date', type: 'date' })
  installationDate: Date;

  @Column({ name: 'is_smart_meter', type: 'bit', default: false })
  isSmartMeter: boolean;

  @Index('IX_Meter_status')
  @Column({
    name: 'status',
    type: 'varchar',
    length: 30,
    default: MeterStatus.ACTIVE,
  })
  status: MeterStatus;

  // Relations
  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;

  /**
   * One-to-many relation with MeterReading
   * All readings recorded for this meter
   */
  @OneToMany(() => MeterReading, (reading) => reading.meter)
  readings: MeterReading[];
}

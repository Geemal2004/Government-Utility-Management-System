import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { UtilityType } from './utility-type.entity';
import { Employee } from './employee.entity';

/**
 * Outage type enum
 */
export enum OutageType {
  PLANNED = 'PLANNED',
  UNPLANNED = 'UNPLANNED',
}

/**
 * Outage entity mapping to the Outage table in SQL Server
 * Represents planned and unplanned service outages
 */
@Entity({ name: 'Outage' })
@Index('IX_Outage_utility_type', ['utilityTypeId'])
@Index('IX_Outage_type', ['outageType'])
@Index('IX_Outage_dates', ['startTime', 'endTime'])
@Index('IX_Outage_employee', ['employeeId'])
export class Outage {
  @PrimaryGeneratedColumn({ name: 'outage_id', type: 'bigint' })
  outageId: number;

  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  @Column({ name: 'employee_id', type: 'bigint', nullable: true })
  employeeId: number | null;

  @Column({ name: 'start_time', type: 'datetime2', precision: 0 })
  startTime: Date;

  @Column({ name: 'end_time', type: 'datetime2', precision: 0, nullable: true })
  endTime: Date | null;

  @Column({ name: 'outage_type', type: 'varchar', length: 30 })
  outageType: OutageType;

  @Column({ name: 'reason', type: 'nvarchar', length: 'MAX', nullable: true })
  reason: string | null;

  // Relations
  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  /**
   * Check if outage is currently active
   */
  get isActive(): boolean {
    const now = new Date();
    return this.startTime <= now && (!this.endTime || this.endTime >= now);
  }

  /**
   * Calculate outage duration in hours
   */
  get durationHours(): number | null {
    if (!this.endTime) return null;
    const diff = this.endTime.getTime() - this.startTime.getTime();
    return Math.round(diff / (1000 * 60 * 60) * 10) / 10; // Round to 1 decimal
  }
}

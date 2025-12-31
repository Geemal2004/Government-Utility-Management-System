import { Entity, Column, PrimaryColumn, OneToOne, OneToMany, JoinColumn } from 'typeorm';
import { Employee } from './employee.entity';
// MeterReading import handled via forwardRef to avoid circular dependency

/**
 * MeterReader entity - Maps to dbo.MeterReader table
 * Represents employees assigned as meter readers with device and route info
 */
@Entity({ name: 'MeterReader', synchronize: false })
export class MeterReader {
  @PrimaryColumn({ name: 'employee_id', type: 'bigint' })
  employeeId: number;

  @Column({ name: 'device_id', type: 'varchar', length: 80, nullable: true })
  deviceId: string | null;

  @Column({ name: 'assigned_route_code', type: 'varchar', length: 50, nullable: true })
  assignedRouteCode: string | null;

  // ==================== RELATIONS ====================

  /**
   * One-to-one relation with Employee
   * The employee who is a meter reader
   */
  @OneToOne(() => Employee)
  @JoinColumn({ name: 'employee_id', referencedColumnName: 'employeeId' })
  employee: Employee;

  /**
   * One-to-many relation with MeterReading
   * All readings taken by this meter reader
   */
  @OneToMany('MeterReading', 'meterReader')
  readings: import('./meter-reading.entity').MeterReading[];
}

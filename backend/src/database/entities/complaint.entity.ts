import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Customer } from './customer.entity';
import { Employee } from './employee.entity';

/**
 * Complaint status enum
 */
export enum ComplaintStatus {
  OPEN = 'OPEN',
  ASSIGNED = 'ASSIGNED',
  IN_PROGRESS = 'IN_PROGRESS',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

/**
 * Complaint entity mapping to the Complaints table in SQL Server
 * Represents customer complaints
 */
@Entity({ name: 'Complaints' })
@Index('IX_Complaints_customer', ['customerId'])
@Index('IX_Complaints_status', ['status'])
@Index('IX_Complaints_employee', ['assignedEmployeeId'])
@Index('IX_Complaints_type', ['complaintType'])
@Index('IX_Complaints_dates', ['createdDate', 'resolvedDate'])
export class Complaint {
  @PrimaryGeneratedColumn({ name: 'complaint_id', type: 'bigint' })
  complaintId: number;

  @Column({ name: 'customer_id', type: 'bigint' })
  customerId: number;

  @Column({ name: 'assigned_employee_id', type: 'bigint', nullable: true })
  assignedEmployeeId: number | null;

  @Column({ name: 'complaint_type', type: 'varchar', length: 50 })
  complaintType: string;

  @Column({ name: 'created_date', type: 'datetime2', precision: 0 })
  createdDate: Date;

  @Column({ name: 'resolved_date', type: 'datetime2', precision: 0, nullable: true })
  resolvedDate: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status: ComplaintStatus;

  @Column({ name: 'description', type: 'nvarchar', length: 'MAX' })
  description: string;

  // Relations
  @ManyToOne(() => Customer)
  @JoinColumn({ name: 'customer_id' })
  customer: Customer;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'assigned_employee_id' })
  assignedEmployee: Employee | null;

  /**
   * Calculate resolution time in hours
   */
  get resolutionTimeHours(): number | null {
    if (!this.resolvedDate) return null;
    const diff = this.resolvedDate.getTime() - this.createdDate.getTime();
    return Math.round(diff / (1000 * 60 * 60));
  }
}

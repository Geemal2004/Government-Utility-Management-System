import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { ServiceConnection } from './service-connection.entity';
import { Employee } from './employee.entity';

/**
 * Reconnection status enum
 */
export enum ReconnectionStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

/**
 * ReconnectionOrder entity mapping to the ReconnectionOrder table in SQL Server
 * Represents orders to reconnect previously disconnected service connections
 */
@Entity({ name: 'ReconnectionOrder' })
@Index('IX_ReconnectionOrder_connection', ['connectionId'])
@Index('IX_ReconnectionOrder_status', ['status'])
@Index('IX_ReconnectionOrder_employee', ['employeeId'])
@Index('IX_ReconnectionOrder_dates', ['scheduledDate', 'reconnectionDate'])
export class ReconnectionOrder {
  @PrimaryGeneratedColumn({ name: 'reconnection_id', type: 'bigint' })
  reconnectionId: number;

  @Column({ name: 'connection_id', type: 'bigint' })
  connectionId: number;

  @Column({ name: 'employee_id', type: 'bigint' })
  employeeId: number;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: Date | null;

  @Column({ name: 'reconnection_date', type: 'date', nullable: true })
  reconnectionDate: Date | null;

  @Column({ name: 'reconnection_fee', type: 'decimal', precision: 12, scale: 2, default: 0 })
  reconnectionFee: number;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status: ReconnectionStatus;

  // Relations
  @ManyToOne(() => ServiceConnection)
  @JoinColumn({ name: 'connection_id' })
  connection: ServiceConnection;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}

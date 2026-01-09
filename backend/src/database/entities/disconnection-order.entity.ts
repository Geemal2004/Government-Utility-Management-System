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
 * Disconnection status enum
 */
export enum DisconnectionStatus {
  PENDING = 'PENDING',
  SCHEDULED = 'SCHEDULED',
  EXECUTED = 'EXECUTED',
  CANCELLED = 'CANCELLED',
}

/**
 * DisconnectionOrder entity mapping to the DisconnectionOrder table in SQL Server
 * Represents orders to disconnect service connections (usually due to non-payment)
 */
@Entity({ name: 'DisconnectionOrder' })
@Index('IX_DisconnectionOrder_connection', ['connectionId'])
@Index('IX_DisconnectionOrder_status', ['status'])
@Index('IX_DisconnectionOrder_employee', ['employeeId'])
@Index('IX_DisconnectionOrder_dates', ['issueDate', 'scheduledDate'])
export class DisconnectionOrder {
  @PrimaryGeneratedColumn({ name: 'disconnection_id', type: 'bigint' })
  disconnectionId: number;

  @Column({ name: 'connection_id', type: 'bigint' })
  connectionId: number;

  @Column({ name: 'employee_id', type: 'bigint' })
  employeeId: number;

  @Column({ name: 'reason', type: 'nvarchar', length: 'MAX', nullable: true })
  reason: string | null;

  @Column({ name: 'issue_date', type: 'date' })
  issueDate: Date;

  @Column({ name: 'scheduled_date', type: 'date', nullable: true })
  scheduledDate: Date | null;

  @Column({ name: 'executed_date', type: 'date', nullable: true })
  executedDate: Date | null;

  @Column({ name: 'status', type: 'varchar', length: 20 })
  status: DisconnectionStatus;

  // Relations
  @ManyToOne(() => ServiceConnection)
  @JoinColumn({ name: 'connection_id' })
  connection: ServiceConnection;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  employee: Employee;
}

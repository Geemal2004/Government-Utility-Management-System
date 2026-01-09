import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  ManyToMany,
  JoinColumn,
  JoinTable,
  Index,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { Employee } from './employee.entity';

/**
 * WorkOrderLabor entity mapping to the WorkOrderLabor table in SQL Server
 * Represents labor hours recorded for a work order
 */
@Entity({ name: 'WorkOrderLabor' })
@Index('IX_WorkOrderLabor_work_order', ['workOrderId'])
@Index('IX_WorkOrderLabor_date', ['workDate'])
export class WorkOrderLabor {
  @PrimaryGeneratedColumn({ name: 'work_order_labor_id', type: 'bigint' })
  workOrderLaborId: number;

  @Column({ name: 'work_order_id', type: 'bigint' })
  workOrderId: number;

  @Column({ name: 'work_date', type: 'date' })
  workDate: Date;

  @Column({ name: 'hours', type: 'decimal', precision: 6, scale: 2 })
  hours: number;

  @Column({ name: 'hourly_rate_snapshot', type: 'decimal', precision: 12, scale: 2 })
  hourlyRateSnapshot: number;

  // Relations
  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.laborEntries)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @ManyToMany(() => Employee)
  @JoinTable({
    name: 'WorkOrderLaborEmployee',
    joinColumn: { name: 'work_order_labor_id', referencedColumnName: 'workOrderLaborId' },
    inverseJoinColumn: { name: 'employee_id', referencedColumnName: 'employeeId' },
  })
  employees: Employee[];

  /**
   * Calculate total labor cost
   */
  get totalCost(): number {
    return Number(this.hours) * Number(this.hourlyRateSnapshot);
  }
}

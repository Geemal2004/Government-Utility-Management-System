import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
    CreateDateColumn,
} from 'typeorm';
import { Employee } from './employee.entity';

export enum PayrollRunStatus {
    DRAFT = 'DRAFT',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

/**
 * PayrollRun entity mapping to the PayrollRun table in SQL Server
 * Represents a payroll processing run for a specific month/year
 */
@Entity({ name: 'PayrollRun' })
export class PayrollRun {
    @PrimaryGeneratedColumn({ name: 'payroll_run_id', type: 'bigint' })
    payrollRunId: number;

    @Column({ name: 'period_month', type: 'smallint' })
    periodMonth: number;

    @Column({ name: 'period_year', type: 'smallint' })
    periodYear: number;

    @Column({ name: 'run_date', type: 'date' })
    runDate: Date;

    @Column({
        name: 'status',
        type: 'varchar',
        length: 20,
        default: PayrollRunStatus.DRAFT,
    })
    status: PayrollRunStatus;

    @Column({ name: 'created_by_employee_id', type: 'bigint' })
    createdByEmployeeId: number;

    // Relations
    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'created_by_employee_id' })
    createdBy: Employee;

    // Computed properties
    get month(): string {
        return `${this.periodYear}-${String(this.periodMonth).padStart(2, '0')}`;
    }

    get periodStart(): Date {
        return new Date(this.periodYear, this.periodMonth - 1, 1);
    }

    get periodEnd(): Date {
        return new Date(this.periodYear, this.periodMonth, 0);
    }
}

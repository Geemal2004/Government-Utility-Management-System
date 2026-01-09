import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    OneToMany,
    JoinColumn,
} from 'typeorm';
import { Employee } from './employee.entity';
import { PayrollRun } from './payroll-run.entity';

/**
 * Payslip entity mapping to the Payslip table in SQL Server
 * Represents an employee's payslip for a specific payroll run
 */
@Entity({ name: 'Payslip' })
export class Payslip {
    @PrimaryGeneratedColumn({ name: 'payslip_id', type: 'bigint' })
    payslipId: number;

    @Column({ name: 'gross', type: 'decimal', precision: 12, scale: 2 })
    gross: number;

    @Column({ name: 'deductions', type: 'decimal', precision: 12, scale: 2 })
    deductions: number;

    @Column({ name: 'employee_id', type: 'bigint' })
    employeeId: number;

    @Column({ name: 'payroll_run_id', type: 'bigint' })
    payrollRunId: number;

    // Relations
    @ManyToOne(() => Employee)
    @JoinColumn({ name: 'employee_id' })
    employee: Employee;

    @ManyToOne(() => PayrollRun)
    @JoinColumn({ name: 'payroll_run_id' })
    payrollRun: PayrollRun;

    // Computed property
    get net(): number {
        return Number(this.gross) - Number(this.deductions);
    }
}

import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { Payslip } from './payslip.entity';
import { SalaryComponentType } from './salary-component-type.entity';

/**
 * PayslipComponent entity mapping to the PayslipComponent table in SQL Server
 * Represents individual line items in a payslip (earnings or deductions)
 */
@Entity({ name: 'PayslipComponent' })
export class PayslipComponent {
    @PrimaryGeneratedColumn({ name: 'payslip_component_id', type: 'bigint' })
    payslipComponentId: number;

    @Column({ name: 'name', type: 'varchar', length: 120 })
    name: string;

    @Column({ name: 'amount', type: 'decimal', precision: 12, scale: 2 })
    amount: number;

    @Column({ name: 'payslip_id', type: 'bigint' })
    payslipId: number;

    @Column({ name: 'component_type_id', type: 'bigint' })
    componentTypeId: number;

    // Relations
    @ManyToOne(() => Payslip)
    @JoinColumn({ name: 'payslip_id' })
    payslip: Payslip;

    @ManyToOne(() => SalaryComponentType)
    @JoinColumn({ name: 'component_type_id' })
    componentType: SalaryComponentType;
}

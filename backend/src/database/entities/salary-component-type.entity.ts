import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

export enum ComponentType {
    EARNING = 'EARNING',
    DEDUCTION = 'DEDUCTION',
}

/**
 * SalaryComponentType entity mapping to the SalaryComponentType table in SQL Server
 * Represents types of salary components (earnings or deductions)
 */
@Entity({ name: 'SalaryComponentType' })
export class SalaryComponentType {
    @PrimaryGeneratedColumn({ name: 'component_type_id', type: 'bigint' })
    componentTypeId: number;

    @Column({ name: 'name', type: 'varchar', length: 80, unique: true })
    name: string;

    @Column({ name: 'type', type: 'varchar', length: 20 })
    type: ComponentType;
}

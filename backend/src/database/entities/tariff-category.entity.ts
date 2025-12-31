import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn, Index } from 'typeorm';
import { UtilityType } from './utility-type.entity';
import { Employee } from './employee.entity';

/**
 * TariffCategory entity mapping to the TariffCategory table in SQL Server
 * Represents different tariff categories for billing customers
 */
@Entity({ name: 'TariffCategory' })
export class TariffCategory {
  @PrimaryGeneratedColumn({ name: 'tariff_category_id', type: 'bigint' })
  tariffCategoryId: number;

  @Index('IX_TariffCategory_utility_type')
  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  @Column({ name: 'code', type: 'varchar', length: 40, unique: true })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'description', type: 'nvarchar', length: 'max', nullable: true })
  description: string | null;

  @Column({ name: 'is_subsidized', type: 'bit', default: false })
  isSubsidized: boolean;

  @Column({ name: 'employee_id', type: 'bigint', nullable: true })
  employeeId: number | null;

  // Relations
  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;

  @ManyToOne(() => Employee)
  @JoinColumn({ name: 'employee_id' })
  createdBy: Employee | null;
}

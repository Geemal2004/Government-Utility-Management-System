import { Entity, Column, PrimaryGeneratedColumn, ManyToOne, JoinColumn } from 'typeorm';
import { UtilityType } from './utility-type.entity';

/**
 * Department entity mapping to the Department table in SQL Server
 */
@Entity({ name: 'Department' })
export class Department {
  @PrimaryGeneratedColumn({ name: 'department_id', type: 'bigint' })
  departmentId: number;

  @Column({ name: 'name', type: 'varchar', length: 120, unique: true })
  name: string;

  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;
}


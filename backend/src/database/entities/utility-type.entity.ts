import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

@Entity({ name: 'UtilityType' })
export class UtilityType {
  @PrimaryGeneratedColumn({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  @Column({ name: 'code', type: 'varchar', length: 30, unique: true })
  code: string;

  @Column({ name: 'name', type: 'varchar', length: 80 })
  name: string;
}

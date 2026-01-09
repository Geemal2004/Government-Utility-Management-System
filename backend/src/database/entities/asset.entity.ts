import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { UtilityType } from './utility-type.entity';

/**
 * Asset status enum
 */
export enum AssetStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
  RETIRED = 'RETIRED',
}

/**
 * Asset entity mapping to the Asset table in SQL Server
 * Represents physical assets like transformers, generators, pumps, etc.
 */
@Entity({ name: 'Asset' })
@Index('IX_Asset_type_status', ['assetType', 'status'])
@Index('IX_Asset_utility_type', ['utilityTypeId'])
export class Asset {
  @PrimaryGeneratedColumn({ name: 'asset_id', type: 'bigint' })
  assetId: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'asset_type', type: 'varchar', length: 50 })
  assetType: string;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status: AssetStatus;

  @Column({ name: 'utility_type_id', type: 'bigint' })
  utilityTypeId: number;

  // Relations
  @ManyToOne(() => UtilityType)
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType;
}

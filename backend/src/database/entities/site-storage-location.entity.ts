import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Item } from './item.entity';

/**
 * Storage location status enum
 */
export enum StorageLocationStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

/**
 * SiteStorageLocation entity mapping to the SiteStorageLocation table in SQL Server
 * Represents storage locations for bulk items (tanks, reservoirs, silos, etc.)
 */
@Entity({ name: 'SiteStorageLocation' })
@Index('IX_SiteStorageLocation_item', ['itemId'])
@Index('IX_SiteStorageLocation_status', ['status'])
@Index('IX_SiteStorageLocation_storage_type', ['storageType'])
export class SiteStorageLocation {
  @PrimaryGeneratedColumn({ name: 'storage_location_id', type: 'bigint' })
  storageLocationId: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'storage_type', type: 'varchar', length: 50 })
  storageType: string;

  @Column({ name: 'status', type: 'varchar', length: 30 })
  status: StorageLocationStatus;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'capacity_qty', type: 'decimal', precision: 14, scale: 3 })
  capacityQty: number;

  @Column({ name: 'capacity_uom', type: 'varchar', length: 20 })
  capacityUom: string;

  // Relations
  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;
}

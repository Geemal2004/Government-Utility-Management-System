import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Warehouse entity (placeholder for Phase 9: Inventory Management)
 * Represents storage locations for inventory
 */
@Entity({ name: 'Warehouse' })
export class Warehouse {
  @PrimaryGeneratedColumn({ name: 'warehouse_id', type: 'bigint' })
  warehouseId: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'location', type: 'varchar', length: 255 })
  location: string;

  @Column({ name: 'warehouse_type', type: 'varchar', length: 30 })
  warehouseType: string;
}

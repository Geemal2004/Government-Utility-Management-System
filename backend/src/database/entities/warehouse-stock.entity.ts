import {
  Entity,
  Column,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { Item } from './item.entity';

/**
 * WarehouseStock entity mapping to the WarehouseStock table in SQL Server
 * Represents stock levels for items in warehouses
 * Uses composite primary key (warehouse_id, item_id)
 */
@Entity({ name: 'WarehouseStock' })
@Index('IX_WarehouseStock_item', ['itemId'])
@Index('IX_WarehouseStock_reorder', ['reorderLevel'])
export class WarehouseStock {
  @PrimaryColumn({ name: 'warehouse_id', type: 'bigint' })
  warehouseId: number;

  @PrimaryColumn({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'on_hand_qty', type: 'decimal', precision: 14, scale: 3 })
  onHandQty: number;

  @Column({
    name: 'reserved_qty',
    type: 'decimal',
    precision: 14,
    scale: 3,
    default: 0,
  })
  reservedQty: number;

  @Column({
    name: 'reorder_level',
    type: 'decimal',
    precision: 14,
    scale: 3,
    nullable: true,
  })
  reorderLevel: number | null;

  @Column({ name: 'last_stocktake_ts', type: 'datetime2', precision: 0, nullable: true })
  lastStocktakeTs: Date | null;

  // Relations
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.stock)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => Item, (item) => item.stock)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  // Computed properties
  get availableQty(): number {
    return this.onHandQty - this.reservedQty;
  }

  get needsReorder(): boolean {
    return this.reorderLevel !== null && this.availableQty <= this.reorderLevel;
  }

  get stockValue(): number {
    return this.onHandQty * (this.item?.standardUnitCost || 0);
  }
}

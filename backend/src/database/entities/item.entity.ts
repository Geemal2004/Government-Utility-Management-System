import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { ItemCategory } from './item-category.entity';
import { WarehouseStock } from './warehouse-stock.entity';
import { ItemStockTransaction } from './item-stock-transaction.entity';

/**
 * Item entity mapping to the Item table in SQL Server
 * Represents inventory items in the warehouse
 */
@Entity({ name: 'Item' })
@Index('IX_Item_category', ['itemCategoryId'])
@Index('IX_Item_name', ['name'])
@Index('IX_Item_uom', ['uom'])
@Index('IX_Item_is_consumable', ['isConsumable'])
export class Item {
  @PrimaryGeneratedColumn({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'item_category_id', type: 'bigint' })
  itemCategoryId: number;

  @Column({ name: 'uom', type: 'varchar', length: 20 })
  uom: string;

  @Column({ name: 'standard_unit_cost', type: 'decimal', precision: 12, scale: 2 })
  standardUnitCost: number;

  @Column({ name: 'is_consumable', type: 'bit', default: false })
  isConsumable: boolean;

  @Column({ name: 'hazard_class', type: 'varchar', length: 50, nullable: true })
  hazardClass: string | null;

  @Column({ name: 'shelf_life_days', type: 'int', nullable: true })
  shelfLifeDays: number | null;

  @Column({ name: 'storage_requirements', type: 'nvarchar', length: 'MAX', nullable: true })
  storageRequirements: string | null;

  // Relations
  @ManyToOne(() => ItemCategory, (category) => category.items)
  @JoinColumn({ name: 'item_category_id' })
  category: ItemCategory;

  @OneToMany(() => WarehouseStock, (stock) => stock.item)
  stock: WarehouseStock[];

  @OneToMany(() => ItemStockTransaction, (txn) => txn.item)
  stockTransactions: ItemStockTransaction[];
}

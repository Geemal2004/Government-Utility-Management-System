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
import { Item } from './item.entity';

/**
 * Category types for inventory items
 */
export enum CategoryType {
  SPARE_PARTS = 'SPARE_PARTS',
  CONSUMABLES = 'CONSUMABLES',
  EQUIPMENT = 'EQUIPMENT',
  MATERIALS = 'MATERIALS',
  TOOLS = 'TOOLS',
}

/**
 * ItemCategory entity mapping to the ItemCategory table in SQL Server
 * Represents categories for inventory items
 */
@Entity({ name: 'ItemCategory' })
@Index('IX_ItemCategory_category_type', ['categoryType'])
@Index('IX_ItemCategory_utility_type', ['utilityTypeId'])
export class ItemCategory {
  @PrimaryGeneratedColumn({ name: 'item_category_id', type: 'bigint' })
  itemCategoryId: number;

  @Column({ name: 'name', type: 'varchar', length: 120 })
  name: string;

  @Column({ name: 'category_type', type: 'varchar', length: 30 })
  categoryType: CategoryType;

  @Column({ name: 'utility_type_id', type: 'bigint', nullable: true })
  utilityTypeId: number | null;

  // Relations
  @ManyToOne(() => UtilityType, { nullable: true })
  @JoinColumn({ name: 'utility_type_id' })
  utilityType: UtilityType | null;

  @OneToMany(() => Item, (item) => item.category)
  items: Item[];
}

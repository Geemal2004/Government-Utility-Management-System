import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * Item entity (placeholder for Phase 9: Inventory Management)
 * Represents inventory items in the warehouse
 */
@Entity({ name: 'Item' })
export class Item {
  @PrimaryGeneratedColumn({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'name', type: 'varchar', length: 150 })
  name: string;

  @Column({ name: 'item_code', type: 'varchar', length: 50, unique: true })
  itemCode: string;

  @Column({ name: 'description', type: 'nvarchar', length: 'MAX', nullable: true })
  description: string | null;

  @Column({ name: 'unit_of_measure', type: 'varchar', length: 20 })
  unitOfMeasure: string;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2 })
  unitCost: number;
}

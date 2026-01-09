import { Entity, Column, PrimaryGeneratedColumn } from 'typeorm';

/**
 * StockTransaction entity (placeholder for Phase 9: Inventory Management)
 * Represents inventory stock transactions
 */
@Entity({ name: 'StockTransaction' })
export class StockTransaction {
  @PrimaryGeneratedColumn({ name: 'stock_txn_id', type: 'bigint' })
  stockTxnId: number;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'warehouse_id', type: 'bigint' })
  warehouseId: number;

  @Column({ name: 'transaction_type', type: 'varchar', length: 30 })
  transactionType: string;

  @Column({ name: 'quantity', type: 'decimal', precision: 14, scale: 3 })
  quantity: number;

  @Column({ name: 'transaction_date', type: 'datetime2', precision: 0 })
  transactionDate: Date;

  @Column({ name: 'work_order_item_usage_id', type: 'bigint', nullable: true })
  workOrderItemUsageId: number | null;
}

import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { Warehouse } from './warehouse.entity';
import { WorkOrderItemUsage } from './work-order-item-usage.entity';
import { ItemStockTransaction } from './item-stock-transaction.entity';

/**
 * Transaction types enum
 */
export enum TransactionType {
  RECEIPT = 'RECEIPT',
  ISSUE = 'ISSUE',
  ADJUSTMENT = 'ADJUSTMENT',
  TRANSFER = 'TRANSFER',
  RETURN = 'RETURN',
  WRITE_OFF = 'WRITE_OFF',
}

/**
 * Reference types enum
 */
export enum ReferenceType {
  WORK_ORDER = 'WORK_ORDER',
  PURCHASE_ORDER = 'PURCHASE_ORDER',
  STOCKTAKE = 'STOCKTAKE',
  DONATION = 'DONATION',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  CORRECTION = 'CORRECTION',
}

/**
 * StockTransaction entity mapping to the StockTransaction table in SQL Server
 * Represents inventory stock transactions
 */
@Entity({ name: 'StockTransaction' })
@Index('IX_StockTransaction_warehouse', ['warehouseId'])
@Index('IX_StockTransaction_txn_type', ['txnType'])
@Index('IX_StockTransaction_txn_ts', ['txnTs'])
@Index('IX_StockTransaction_reference', ['referenceType', 'referenceId'])
@Index('IX_StockTransaction_work_order_usage', ['workOrderItemUsageId'])
export class StockTransaction {
  @PrimaryGeneratedColumn({ name: 'stock_txn_id', type: 'bigint' })
  stockTxnId: number;

  @Column({ name: 'warehouse_id', type: 'bigint' })
  warehouseId: number;

  @Column({ name: 'txn_type', type: 'varchar', length: 30 })
  txnType: TransactionType;

  @Column({ name: 'txn_ts', type: 'datetime2', precision: 0 })
  txnTs: Date;

  @Column({ name: 'qty', type: 'decimal', precision: 14, scale: 3 })
  qty: number;

  @Column({ name: 'unit_cost', type: 'decimal', precision: 12, scale: 2 })
  unitCost: number;

  @Column({ name: 'reference_type', type: 'varchar', length: 30, nullable: true })
  referenceType: ReferenceType | null;

  @Column({ name: 'reference_id', type: 'bigint', nullable: true })
  referenceId: number | null;

  @Column({ name: 'work_order_item_usage_id', type: 'bigint', nullable: true })
  workOrderItemUsageId: number | null;

  // Relations
  @ManyToOne(() => Warehouse, (warehouse) => warehouse.transactions)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => WorkOrderItemUsage, { nullable: true })
  @JoinColumn({ name: 'work_order_item_usage_id' })
  workOrderItemUsage: WorkOrderItemUsage | null;

  @OneToMany(() => ItemStockTransaction, (itemTxn) => itemTxn.stockTransaction)
  itemTransactions: ItemStockTransaction[];

  // Computed property
  get totalValue(): number {
    return this.qty * this.unitCost;
  }
}

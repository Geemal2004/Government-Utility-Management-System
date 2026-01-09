import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { WorkOrder } from './work-order.entity';
import { Item } from './item.entity';
import { Warehouse } from './warehouse.entity';
import { StockTransaction } from './stock-transaction.entity';

/**
 * WorkOrderItemUsage entity mapping to the WorkOrderItemUsage table in SQL Server
 * Represents items consumed during work order execution
 */
@Entity({ name: 'WorkOrderItemUsage' })
@Index('IX_WorkOrderItemUsage_work_order', ['workOrderId'])
@Index('IX_WorkOrderItemUsage_item', ['itemId'])
@Index('IX_WorkOrderItemUsage_warehouse', ['warehouseId'])
export class WorkOrderItemUsage {
  @PrimaryGeneratedColumn({ name: 'work_order_item_usage_id', type: 'bigint' })
  workOrderItemUsageId: number;

  @Column({ name: 'work_order_id', type: 'bigint' })
  workOrderId: number;

  @Column({ name: 'item_id', type: 'bigint' })
  itemId: number;

  @Column({ name: 'warehouse_id', type: 'bigint' })
  warehouseId: number;

  @Column({ name: 'qty_used', type: 'decimal', precision: 14, scale: 3 })
  qtyUsed: number;

  @Column({ name: 'unit_cost_snapshot', type: 'decimal', precision: 12, scale: 2 })
  unitCostSnapshot: number;

  @Column({ name: 'item_cost_amount', type: 'decimal', precision: 12, scale: 2 })
  itemCostAmount: number;

  @Column({ name: 'issued_ts', type: 'datetime2', precision: 0 })
  issuedTs: Date;

  @Column({ name: 'stock_txn_id', type: 'bigint', nullable: true })
  stockTxnId: number | null;

  // Relations
  @ManyToOne(() => WorkOrder, (workOrder) => workOrder.itemUsages)
  @JoinColumn({ name: 'work_order_id' })
  workOrder: WorkOrder;

  @ManyToOne(() => Item)
  @JoinColumn({ name: 'item_id' })
  item: Item;

  @ManyToOne(() => Warehouse)
  @JoinColumn({ name: 'warehouse_id' })
  warehouse: Warehouse;

  @ManyToOne(() => StockTransaction, { nullable: true })
  @JoinColumn({ name: 'stock_txn_id' })
  stockTransaction: StockTransaction | null;
}

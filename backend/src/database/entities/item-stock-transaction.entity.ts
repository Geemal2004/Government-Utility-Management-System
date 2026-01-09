import {
  Entity,
  PrimaryColumn,
  ManyToOne,
  JoinColumn,
  Index,
} from 'typeorm';
import { StockTransaction } from './stock-transaction.entity';
import { Item } from './item.entity';

/**
 * ItemStockTransaction entity mapping to the ItemStockTransaction table in SQL Server
 * Junction table between StockTransaction and Item (many-to-many)
 * Uses composite primary key (stock_txn_id, item_id)
 */
@Entity({ name: 'ItemStockTransaction' })
@Index('IX_ItemStockTransaction_item', ['itemId'])
export class ItemStockTransaction {
  @PrimaryColumn({ name: 'stock_txn_id', type: 'bigint' })
  stockTxnId: number;

  @PrimaryColumn({ name: 'item_id', type: 'bigint' })
  itemId: number;

  // Relations
  @ManyToOne(() => StockTransaction, (txn) => txn.itemTransactions)
  @JoinColumn({ name: 'stock_txn_id' })
  stockTransaction: StockTransaction;

  @ManyToOne(() => Item, (item) => item.stockTransactions)
  @JoinColumn({ name: 'item_id' })
  item: Item;
}

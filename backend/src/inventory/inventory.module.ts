import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  ItemCategory,
  Item,
  Warehouse,
  WarehouseStock,
  StockTransaction,
  ItemStockTransaction,
  SiteStorageLocation,
} from '../database/entities';
import {
  ItemCategoryService,
  ItemService,
  WarehouseService,
  StockTransactionService,
} from './services';
import {
  ItemCategoryController,
  ItemController,
  WarehouseController,
  StockTransactionController,
} from './controllers';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ItemCategory,
      Item,
      Warehouse,
      WarehouseStock,
      StockTransaction,
      ItemStockTransaction,
      SiteStorageLocation,
    ]),
  ],
  controllers: [
    ItemCategoryController,
    ItemController,
    WarehouseController,
    StockTransactionController,
  ],
  providers: [
    ItemCategoryService,
    ItemService,
    WarehouseService,
    StockTransactionService,
  ],
  exports: [
    ItemService,
    WarehouseService,
    StockTransactionService,
  ],
})
export class InventoryModule {}

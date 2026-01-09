import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import {
  StockTransaction,
  TransactionType,
} from '../../database/entities/stock-transaction.entity';
import { WarehouseStock } from '../../database/entities/warehouse-stock.entity';
import { ItemStockTransaction } from '../../database/entities/item-stock-transaction.entity';
import { Warehouse, WarehouseStatus } from '../../database/entities/warehouse.entity';
import { Item } from '../../database/entities/item.entity';
import {
  StockReceiptDto,
  StockIssueDto,
  StockTransferDto,
  StockAdjustmentDto,
  StockWriteOffDto,
  StockTransactionResponseDto,
  StockTransactionFilterDto,
} from '../dto';

/**
 * Service for managing stock transactions
 */
@Injectable()
export class StockTransactionService {
  constructor(
    @InjectRepository(StockTransaction)
    private readonly stockTransactionRepository: Repository<StockTransaction>,
    @InjectRepository(WarehouseStock)
    private readonly warehouseStockRepository: Repository<WarehouseStock>,
    @InjectRepository(ItemStockTransaction)
    private readonly itemStockTransactionRepository: Repository<ItemStockTransaction>,
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Receive stock into warehouse
   */
  async receiveStock(receiptDto: StockReceiptDto): Promise<StockTransactionResponseDto[]> {
    // Validate warehouse
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: receiptDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${receiptDto.warehouseId} not found`);
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
      throw new BadRequestException(`Warehouse ${warehouse.name} is not active`);
    }

    // Validate all items exist
    const itemIds = receiptDto.items.map((i) => i.itemId);
    const items = await this.itemRepository.findByIds(itemIds);

    if (items.length !== itemIds.length) {
      throw new NotFoundException('One or more items not found');
    }

    const results: StockTransactionResponseDto[] = [];

    // Use transaction to ensure atomicity
    await this.dataSource.transaction(async (manager) => {
      for (const receiptItem of receiptDto.items) {
        const item = items.find((i) => i.itemId === receiptItem.itemId);

        // Create stock transaction
        const transaction = manager.create(StockTransaction, {
          warehouseId: receiptDto.warehouseId,
          txnType: TransactionType.RECEIPT,
          txnTs: new Date(),
          qty: receiptItem.qty,
          unitCost: receiptItem.unitCost,
          referenceType: receiptDto.referenceType,
          referenceId: receiptDto.referenceId || null,
        });

        const savedTxn = await manager.save(StockTransaction, transaction);

        // Create item-transaction link
        const itemTxn = manager.create(ItemStockTransaction, {
          stockTxnId: savedTxn.stockTxnId,
          itemId: receiptItem.itemId,
        });
        await manager.save(ItemStockTransaction, itemTxn);

        // Update or create warehouse stock
        let stock = await manager.findOne(WarehouseStock, {
          where: {
            warehouseId: receiptDto.warehouseId,
            itemId: receiptItem.itemId,
          },
        });

        if (stock) {
          stock.onHandQty = Number(stock.onHandQty) + receiptItem.qty;
        } else {
          stock = manager.create(WarehouseStock, {
            warehouseId: receiptDto.warehouseId,
            itemId: receiptItem.itemId,
            onHandQty: receiptItem.qty,
            reservedQty: 0,
            reorderLevel: null,
          });
        }

        await manager.save(WarehouseStock, stock);

        results.push({
          stockTxnId: savedTxn.stockTxnId,
          warehouseId: receiptDto.warehouseId,
          warehouseName: warehouse.name,
          itemId: receiptItem.itemId,
          itemName: item?.name || '',
          txnType: TransactionType.RECEIPT,
          txnTs: savedTxn.txnTs,
          qty: receiptItem.qty,
          unitCost: receiptItem.unitCost,
          totalValue: receiptItem.qty * receiptItem.unitCost,
          referenceType: receiptDto.referenceType,
          referenceId: receiptDto.referenceId,
        });
      }
    });

    return results;
  }

  /**
   * Issue stock from warehouse
   */
  async issueStock(issueDto: StockIssueDto): Promise<StockTransactionResponseDto[]> {
    // Validate warehouse
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: issueDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${issueDto.warehouseId} not found`);
    }

    if (warehouse.status !== WarehouseStatus.ACTIVE) {
      throw new BadRequestException(`Warehouse ${warehouse.name} is not active`);
    }

    const results: StockTransactionResponseDto[] = [];

    // Use transaction
    await this.dataSource.transaction(async (manager) => {
      for (const issueItem of issueDto.items) {
        // Check stock availability
        const stock = await manager.findOne(WarehouseStock, {
          where: {
            warehouseId: issueDto.warehouseId,
            itemId: issueItem.itemId,
          },
          relations: ['item'],
        });

        if (!stock) {
          throw new NotFoundException(
            `Item ${issueItem.itemId} not found in warehouse ${issueDto.warehouseId}`,
          );
        }

        const availableQty = Number(stock.onHandQty) - Number(stock.reservedQty);
        if (availableQty < issueItem.qty) {
          throw new BadRequestException(
            `Insufficient stock for item ${stock.item.name}. Available: ${availableQty}, Requested: ${issueItem.qty}`,
          );
        }

        // Create stock transaction
        const transaction = manager.create(StockTransaction, {
          warehouseId: issueDto.warehouseId,
          txnType: TransactionType.ISSUE,
          txnTs: new Date(),
          qty: -issueItem.qty, // Negative for issue
          unitCost: Number(stock.item.standardUnitCost),
          referenceType: issueDto.referenceType,
          referenceId: issueDto.referenceId || null,
        });

        const savedTxn = await manager.save(StockTransaction, transaction);

        // Create item-transaction link
        const itemTxn = manager.create(ItemStockTransaction, {
          stockTxnId: savedTxn.stockTxnId,
          itemId: issueItem.itemId,
        });
        await manager.save(ItemStockTransaction, itemTxn);

        // Update warehouse stock
        stock.onHandQty = Number(stock.onHandQty) - issueItem.qty;
        await manager.save(WarehouseStock, stock);

        results.push({
          stockTxnId: savedTxn.stockTxnId,
          warehouseId: issueDto.warehouseId,
          warehouseName: warehouse.name,
          itemId: issueItem.itemId,
          itemName: stock.item.name,
          txnType: TransactionType.ISSUE,
          txnTs: savedTxn.txnTs,
          qty: issueItem.qty,
          unitCost: Number(stock.item.standardUnitCost),
          totalValue: issueItem.qty * Number(stock.item.standardUnitCost),
          referenceType: issueDto.referenceType,
          referenceId: issueDto.referenceId,
        });
      }
    });

    return results;
  }

  /**
   * Transfer stock between warehouses
   */
  async transferStock(transferDto: StockTransferDto): Promise<{ from: StockTransactionResponseDto[]; to: StockTransactionResponseDto[] }> {
    if (transferDto.fromWarehouseId === transferDto.toWarehouseId) {
      throw new BadRequestException('Cannot transfer to the same warehouse');
    }

    // Validate both warehouses
    const [fromWarehouse, toWarehouse] = await Promise.all([
      this.warehouseRepository.findOne({ where: { warehouseId: transferDto.fromWarehouseId } }),
      this.warehouseRepository.findOne({ where: { warehouseId: transferDto.toWarehouseId } }),
    ]);

    if (!fromWarehouse) {
      throw new NotFoundException(`Source warehouse with ID ${transferDto.fromWarehouseId} not found`);
    }

    if (!toWarehouse) {
      throw new NotFoundException(`Destination warehouse with ID ${transferDto.toWarehouseId} not found`);
    }

    if (fromWarehouse.status !== WarehouseStatus.ACTIVE) {
      throw new BadRequestException(`Source warehouse ${fromWarehouse.name} is not active`);
    }

    if (toWarehouse.status !== WarehouseStatus.ACTIVE) {
      throw new BadRequestException(`Destination warehouse ${toWarehouse.name} is not active`);
    }

    const fromResults: StockTransactionResponseDto[] = [];
    const toResults: StockTransactionResponseDto[] = [];

    // Use transaction for atomicity
    await this.dataSource.transaction(async (manager) => {
      for (const transferItem of transferDto.items) {
        // Check source stock
        const fromStock = await manager.findOne(WarehouseStock, {
          where: {
            warehouseId: transferDto.fromWarehouseId,
            itemId: transferItem.itemId,
          },
          relations: ['item'],
        });

        if (!fromStock) {
          throw new NotFoundException(
            `Item ${transferItem.itemId} not found in source warehouse`,
          );
        }

        const availableQty = Number(fromStock.onHandQty) - Number(fromStock.reservedQty);
        if (availableQty < transferItem.qty) {
          throw new BadRequestException(
            `Insufficient stock for item ${fromStock.item.name}. Available: ${availableQty}, Requested: ${transferItem.qty}`,
          );
        }

        // Issue from source warehouse
        const issueTxn = manager.create(StockTransaction, {
          warehouseId: transferDto.fromWarehouseId,
          txnType: TransactionType.TRANSFER,
          txnTs: new Date(),
          qty: -transferItem.qty,
          unitCost: Number(fromStock.item.standardUnitCost),
          referenceType: 'TRANSFER' as any,
          referenceId: transferDto.toWarehouseId,
        });

        const savedIssueTxn = await manager.save(StockTransaction, issueTxn);

        await manager.save(ItemStockTransaction, {
          stockTxnId: savedIssueTxn.stockTxnId,
          itemId: transferItem.itemId,
        });

        fromStock.onHandQty = Number(fromStock.onHandQty) - transferItem.qty;
        await manager.save(WarehouseStock, fromStock);

        fromResults.push({
          stockTxnId: savedIssueTxn.stockTxnId,
          warehouseId: transferDto.fromWarehouseId,
          warehouseName: fromWarehouse.name,
          itemId: transferItem.itemId,
          itemName: fromStock.item.name,
          txnType: TransactionType.TRANSFER,
          txnTs: savedIssueTxn.txnTs,
          qty: transferItem.qty,
          unitCost: Number(fromStock.item.standardUnitCost),
          totalValue: transferItem.qty * Number(fromStock.item.standardUnitCost),
        });

        // Receive in destination warehouse
        const receiptTxn = manager.create(StockTransaction, {
          warehouseId: transferDto.toWarehouseId,
          txnType: TransactionType.TRANSFER,
          txnTs: new Date(),
          qty: transferItem.qty,
          unitCost: Number(fromStock.item.standardUnitCost),
          referenceType: 'TRANSFER' as any,
          referenceId: transferDto.fromWarehouseId,
        });

        const savedReceiptTxn = await manager.save(StockTransaction, receiptTxn);

        await manager.save(ItemStockTransaction, {
          stockTxnId: savedReceiptTxn.stockTxnId,
          itemId: transferItem.itemId,
        });

        let toStock = await manager.findOne(WarehouseStock, {
          where: {
            warehouseId: transferDto.toWarehouseId,
            itemId: transferItem.itemId,
          },
        });

        if (toStock) {
          toStock.onHandQty = Number(toStock.onHandQty) + transferItem.qty;
        } else {
          toStock = manager.create(WarehouseStock, {
            warehouseId: transferDto.toWarehouseId,
            itemId: transferItem.itemId,
            onHandQty: transferItem.qty,
            reservedQty: 0,
          });
        }

        await manager.save(WarehouseStock, toStock);

        toResults.push({
          stockTxnId: savedReceiptTxn.stockTxnId,
          warehouseId: transferDto.toWarehouseId,
          warehouseName: toWarehouse.name,
          itemId: transferItem.itemId,
          itemName: fromStock.item.name,
          txnType: TransactionType.TRANSFER,
          txnTs: savedReceiptTxn.txnTs,
          qty: transferItem.qty,
          unitCost: Number(fromStock.item.standardUnitCost),
          totalValue: transferItem.qty * Number(fromStock.item.standardUnitCost),
        });
      }
    });

    return { from: fromResults, to: toResults };
  }

  /**
   * Adjust stock levels
   */
  async adjustStock(adjustmentDto: StockAdjustmentDto): Promise<StockTransactionResponseDto[]> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: adjustmentDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${adjustmentDto.warehouseId} not found`);
    }

    const results: StockTransactionResponseDto[] = [];

    await this.dataSource.transaction(async (manager) => {
      for (const adjustItem of adjustmentDto.items) {
        const stock = await manager.findOne(WarehouseStock, {
          where: {
            warehouseId: adjustmentDto.warehouseId,
            itemId: adjustItem.itemId,
          },
          relations: ['item'],
        });

        if (!stock) {
          throw new NotFoundException(
            `Item ${adjustItem.itemId} not found in warehouse ${adjustmentDto.warehouseId}`,
          );
        }

        // Create adjustment transaction
        const transaction = manager.create(StockTransaction, {
          warehouseId: adjustmentDto.warehouseId,
          txnType: TransactionType.ADJUSTMENT,
          txnTs: new Date(),
          qty: adjustItem.qtyAdjustment,
          unitCost: Number(stock.item.standardUnitCost),
          referenceType: adjustmentDto.adjustmentType as any,
        });

        const savedTxn = await manager.save(StockTransaction, transaction);

        await manager.save(ItemStockTransaction, {
          stockTxnId: savedTxn.stockTxnId,
          itemId: adjustItem.itemId,
        });

        // Update stock
        stock.onHandQty = Number(stock.onHandQty) + adjustItem.qtyAdjustment;
        await manager.save(WarehouseStock, stock);

        results.push({
          stockTxnId: savedTxn.stockTxnId,
          warehouseId: adjustmentDto.warehouseId,
          warehouseName: warehouse.name,
          itemId: adjustItem.itemId,
          itemName: stock.item.name,
          txnType: TransactionType.ADJUSTMENT,
          txnTs: savedTxn.txnTs,
          qty: Math.abs(adjustItem.qtyAdjustment),
          unitCost: Number(stock.item.standardUnitCost),
          totalValue: Math.abs(adjustItem.qtyAdjustment) * Number(stock.item.standardUnitCost),
        });
      }
    });

    return results;
  }

  /**
   * Write off damaged/expired stock
   */
  async writeOffStock(writeOffDto: StockWriteOffDto): Promise<StockTransactionResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: writeOffDto.warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${writeOffDto.warehouseId} not found`);
    }

    let result: StockTransactionResponseDto | undefined;

    await this.dataSource.transaction(async (manager) => {
      const stock = await manager.findOne(WarehouseStock, {
        where: {
          warehouseId: writeOffDto.warehouseId,
          itemId: writeOffDto.itemId,
        },
        relations: ['item'],
      });

      if (!stock) {
        throw new NotFoundException(
          `Item ${writeOffDto.itemId} not found in warehouse ${writeOffDto.warehouseId}`,
        );
      }

      if (Number(stock.onHandQty) < writeOffDto.qty) {
        throw new BadRequestException(
          `Insufficient stock to write off. Available: ${stock.onHandQty}, Requested: ${writeOffDto.qty}`,
        );
      }

      // Create write-off transaction
      const transaction = manager.create(StockTransaction, {
        warehouseId: writeOffDto.warehouseId,
        txnType: TransactionType.WRITE_OFF,
        txnTs: new Date(),
        qty: -writeOffDto.qty,
        unitCost: Number(stock.item.standardUnitCost),
        referenceType: 'WRITE_OFF' as any,
      });

      const savedTxn = await manager.save(StockTransaction, transaction);

      await manager.save(ItemStockTransaction, {
        stockTxnId: savedTxn.stockTxnId,
        itemId: writeOffDto.itemId,
      });

      // Update stock
      stock.onHandQty = Number(stock.onHandQty) - writeOffDto.qty;
      await manager.save(WarehouseStock, stock);

      result = {
        stockTxnId: savedTxn.stockTxnId,
        warehouseId: writeOffDto.warehouseId,
        warehouseName: warehouse.name,
        itemId: writeOffDto.itemId,
        itemName: stock.item.name,
        txnType: TransactionType.WRITE_OFF,
        txnTs: savedTxn.txnTs,
        qty: writeOffDto.qty,
        unitCost: Number(stock.item.standardUnitCost),
        totalValue: writeOffDto.qty * Number(stock.item.standardUnitCost),
      };
    });

    if (!result) {
      throw new Error('Failed to write off stock');
    }

    return result;
  }

  /**
   * Get all transactions with filters
   */
  async findAll(filters: StockTransactionFilterDto): Promise<{
    data: StockTransactionResponseDto[];
    total: number;
    page: number;
    limit: number;
  }> {
    const queryBuilder = this.stockTransactionRepository
      .createQueryBuilder('txn')
      .leftJoinAndSelect('txn.warehouse', 'warehouse')
      .leftJoinAndSelect('txn.itemTransactions', 'itemTxn')
      .leftJoinAndSelect('itemTxn.item', 'item');

    if (filters.warehouseId) {
      queryBuilder.andWhere('txn.warehouseId = :warehouseId', {
        warehouseId: filters.warehouseId,
      });
    }

    if (filters.itemId) {
      queryBuilder.andWhere('itemTxn.itemId = :itemId', { itemId: filters.itemId });
    }

    if (filters.txnType) {
      queryBuilder.andWhere('txn.txnType = :txnType', { txnType: filters.txnType });
    }

    if (filters.startDate) {
      queryBuilder.andWhere('txn.txnTs >= :startDate', { startDate: filters.startDate });
    }

    if (filters.endDate) {
      queryBuilder.andWhere('txn.txnTs <= :endDate', { endDate: filters.endDate });
    }

    if (filters.referenceType) {
      queryBuilder.andWhere('txn.referenceType = :referenceType', {
        referenceType: filters.referenceType,
      });
    }

    if (filters.referenceId) {
      queryBuilder.andWhere('txn.referenceId = :referenceId', {
        referenceId: filters.referenceId,
      });
    }

    const total = await queryBuilder.getCount();

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    queryBuilder
      .orderBy(`txn.${filters.sortBy || 'txnTs'}`, filters.order || 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    const transactions = await queryBuilder.getMany();

    const data = transactions.map((txn) => ({
      stockTxnId: txn.stockTxnId,
      warehouseId: txn.warehouseId,
      warehouseName: txn.warehouse?.name || '',
      itemId: txn.itemTransactions[0]?.itemId || 0,
      itemName: txn.itemTransactions[0]?.item?.name || '',
      txnType: txn.txnType,
      txnTs: txn.txnTs,
      qty: Math.abs(Number(txn.qty)),
      unitCost: Number(txn.unitCost),
      totalValue: Math.abs(Number(txn.qty)) * Number(txn.unitCost),
      referenceType: txn.referenceType || undefined,
      referenceId: txn.referenceId !== null ? txn.referenceId : undefined,
    }));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single transaction by ID
   */
  async findOne(id: number): Promise<StockTransactionResponseDto> {
    const txn = await this.stockTransactionRepository.findOne({
      where: { stockTxnId: id },
      relations: ['warehouse', 'itemTransactions', 'itemTransactions.item'],
    });

    if (!txn) {
      throw new NotFoundException(`Transaction with ID ${id} not found`);
    }

    return {
      stockTxnId: txn.stockTxnId,
      warehouseId: txn.warehouseId,
      warehouseName: txn.warehouse?.name || '',
      itemId: txn.itemTransactions[0]?.itemId || 0,
      itemName: txn.itemTransactions[0]?.item?.name || '',
      txnType: txn.txnType,
      txnTs: txn.txnTs,
      qty: Math.abs(Number(txn.qty)),
      unitCost: Number(txn.unitCost),
      totalValue: Math.abs(Number(txn.qty)) * Number(txn.unitCost),
      referenceType: txn.referenceType || undefined,
      referenceId: txn.referenceId !== null ? txn.referenceId : undefined,
    };
  }
}

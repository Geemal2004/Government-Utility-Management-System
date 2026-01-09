import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Warehouse, WarehouseStatus } from '../../database/entities/warehouse.entity';
import { WarehouseStock } from '../../database/entities/warehouse-stock.entity';
import {
  CreateWarehouseDto,
  UpdateWarehouseDto,
  WarehouseResponseDto,
  WarehouseStockDto,
} from '../dto';

/**
 * Service for managing warehouses
 */
@Injectable()
export class WarehouseService {
  constructor(
    @InjectRepository(Warehouse)
    private readonly warehouseRepository: Repository<Warehouse>,
    @InjectRepository(WarehouseStock)
    private readonly warehouseStockRepository: Repository<WarehouseStock>,
  ) {}

  /**
   * Create a new warehouse
   */
  async create(createDto: CreateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = this.warehouseRepository.create({
      name: createDto.name,
      geoAreaId: createDto.geoAreaId,
      status: createDto.status || WarehouseStatus.ACTIVE,
    });

    const saved = await this.warehouseRepository.save(warehouse);
    return this.toResponseDto(saved);
  }

  /**
   * Get all warehouses with stock summary
   */
  async findAll(): Promise<WarehouseResponseDto[]> {
    const warehouses = await this.warehouseRepository.find({
      relations: ['geoArea', 'stock', 'stock.item'],
    });

    return warehouses.map((warehouse) => this.toResponseDto(warehouse, true));
  }

  /**
   * Get a single warehouse by ID with full stock list
   */
  async findOne(id: number): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: id },
      relations: ['geoArea', 'stock', 'stock.item', 'stock.item.category'],
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    return this.toResponseDto(warehouse, true);
  }

  /**
   * Update a warehouse
   */
  async update(id: number, updateDto: UpdateWarehouseDto): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    if (updateDto.name !== undefined) warehouse.name = updateDto.name;
    if (updateDto.geoAreaId !== undefined) warehouse.geoAreaId = updateDto.geoAreaId;
    if (updateDto.status !== undefined) warehouse.status = updateDto.status;

    const saved = await this.warehouseRepository.save(warehouse);
    return this.toResponseDto(saved);
  }

  /**
   * Deactivate a warehouse
   */
  async deactivate(id: number): Promise<WarehouseResponseDto> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId: id },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${id} not found`);
    }

    warehouse.status = WarehouseStatus.INACTIVE;
    const saved = await this.warehouseRepository.save(warehouse);

    return this.toResponseDto(saved);
  }

  /**
   * Get all stock in a warehouse
   */
  async getStock(warehouseId: number): Promise<WarehouseStockDto[]> {
    const warehouse = await this.warehouseRepository.findOne({
      where: { warehouseId },
    });

    if (!warehouse) {
      throw new NotFoundException(`Warehouse with ID ${warehouseId} not found`);
    }

    const stocks = await this.warehouseStockRepository.find({
      where: { warehouseId },
      relations: ['item', 'item.category'],
    });

    return stocks.map((stock) => ({
      itemId: stock.itemId,
      itemName: stock.item.name,
      category: stock.item.category?.name || '',
      uom: stock.item.uom,
      onHandQty: Number(stock.onHandQty),
      reservedQty: Number(stock.reservedQty),
      availableQty: stock.availableQty,
      reorderLevel: stock.reorderLevel ? Number(stock.reorderLevel) : undefined,
      needsReorder: stock.needsReorder,
      unitCost: Number(stock.item.standardUnitCost),
      totalValue: Number(stock.onHandQty) * Number(stock.item.standardUnitCost),
      lastStocktake: stock.lastStocktakeTs !== null ? stock.lastStocktakeTs : undefined,
    }));
  }

  /**
   * Get specific item stock in a warehouse
   */
  async getItemStock(warehouseId: number, itemId: number): Promise<WarehouseStockDto> {
    const stock = await this.warehouseStockRepository.findOne({
      where: { warehouseId, itemId },
      relations: ['item', 'item.category', 'warehouse'],
    });

    if (!stock) {
      throw new NotFoundException(
        `Stock not found for item ${itemId} in warehouse ${warehouseId}`,
      );
    }

    return {
      itemId: stock.itemId,
      itemName: stock.item.name,
      category: stock.item.category?.name || '',
      uom: stock.item.uom,
      onHandQty: Number(stock.onHandQty),
      reservedQty: Number(stock.reservedQty),
      availableQty: stock.availableQty,
      reorderLevel: stock.reorderLevel ? Number(stock.reorderLevel) : undefined,
      needsReorder: stock.needsReorder,
      unitCost: Number(stock.item.standardUnitCost),
      totalValue: Number(stock.onHandQty) * Number(stock.item.standardUnitCost),
      lastStocktake: stock.lastStocktakeTs !== null ? stock.lastStocktakeTs : undefined,
    };
  }

  /**
   * Get total stock value for a warehouse
   */
  async getStockValue(warehouseId: number): Promise<number> {
    const stocks = await this.warehouseStockRepository.find({
      where: { warehouseId },
      relations: ['item'],
    });

    return stocks.reduce((sum, stock) => {
      return sum + Number(stock.onHandQty) * Number(stock.item.standardUnitCost);
    }, 0);
  }

  /**
   * Get items below reorder level in a warehouse
   */
  async getLowStockItems(warehouseId: number): Promise<WarehouseStockDto[]> {
    const stocks = await this.warehouseStockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .where('stock.warehouseId = :warehouseId', { warehouseId })
      .andWhere('stock.reorderLevel IS NOT NULL')
      .andWhere('(stock.onHandQty - stock.reservedQty) <= stock.reorderLevel')
      .getMany();

    return stocks.map((stock) => ({
      itemId: stock.itemId,
      itemName: stock.item.name,
      category: stock.item.category?.name || '',
      uom: stock.item.uom,
      onHandQty: Number(stock.onHandQty),
      reservedQty: Number(stock.reservedQty),
      availableQty: stock.availableQty,
      reorderLevel: stock.reorderLevel ? Number(stock.reorderLevel) : undefined,
      needsReorder: stock.needsReorder,
      unitCost: Number(stock.item.standardUnitCost),
      totalValue: Number(stock.onHandQty) * Number(stock.item.standardUnitCost),
      lastStocktake: stock.lastStocktakeTs !== null ? stock.lastStocktakeTs : undefined,
    }));
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(warehouse: Warehouse, includeStats: boolean = false): WarehouseResponseDto {
    const response: WarehouseResponseDto = {
      warehouseId: warehouse.warehouseId,
      name: warehouse.name,
      status: warehouse.status,
      geoAreaName: warehouse.geoArea?.name || '',
    };

    if (includeStats && warehouse.stock) {
      response.totalItems = warehouse.stock.length;
      response.totalStockValue = warehouse.stock.reduce((sum, stock) => {
        return sum + Number(stock.onHandQty) * Number(stock.item?.standardUnitCost || 0);
      }, 0);
      response.lowStockItems = warehouse.stock.filter((stock) => stock.needsReorder).length;

      const stocktakeDates = warehouse.stock
        .map((s) => s.lastStocktakeTs)
        .filter((d) => d !== null)
        .sort((a, b) => b.getTime() - a.getTime());

      if (stocktakeDates.length > 0) {
        response.lastStocktakeDate = stocktakeDates[0];
      }
    }

    return response;
  }
}

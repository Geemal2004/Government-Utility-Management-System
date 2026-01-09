import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like, FindOptionsWhere } from 'typeorm';
import { Item } from '../../database/entities/item.entity';
import { WarehouseStock } from '../../database/entities/warehouse-stock.entity';
import {
  CreateItemDto,
  UpdateItemDto,
  ItemResponseDto,
  ItemFilterDto,
  WarehouseStockInfoDto,
} from '../dto';

/**
 * Service for managing inventory items
 */
@Injectable()
export class ItemService {
  constructor(
    @InjectRepository(Item)
    private readonly itemRepository: Repository<Item>,
    @InjectRepository(WarehouseStock)
    private readonly warehouseStockRepository: Repository<WarehouseStock>,
  ) {}

  /**
   * Create a new item
   */
  async create(createDto: CreateItemDto): Promise<ItemResponseDto> {
    const item = this.itemRepository.create({
      name: createDto.name,
      itemCategoryId: createDto.itemCategoryId,
      uom: createDto.uom,
      standardUnitCost: createDto.standardUnitCost,
      isConsumable: createDto.isConsumable || false,
      hazardClass: createDto.hazardClass || null,
      shelfLifeDays: createDto.shelfLifeDays || null,
      storageRequirements: createDto.storageRequirements || null,
    });

    const saved = await this.itemRepository.save(item);
    return this.toResponseDto(saved);
  }

  /**
   * Get all items with filtering and pagination
   */
  async findAll(filters: ItemFilterDto): Promise<{ data: ItemResponseDto[]; total: number; page: number; limit: number }> {
    const where: FindOptionsWhere<Item> = {};

    if (filters.categoryId) {
      where.itemCategoryId = filters.categoryId;
    }

    if (filters.uom) {
      where.uom = filters.uom;
    }

    if (filters.isConsumable !== undefined) {
      where.isConsumable = filters.isConsumable;
    }

    if (filters.hazardClass) {
      where.hazardClass = filters.hazardClass;
    }

    const queryBuilder = this.itemRepository.createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('item.stock', 'stock')
      .leftJoinAndSelect('stock.warehouse', 'warehouse');

    if (filters.categoryId) {
      queryBuilder.andWhere('item.itemCategoryId = :categoryId', { categoryId: filters.categoryId });
    }

    if (filters.search) {
      queryBuilder.andWhere('item.name LIKE :search', { search: `%${filters.search}%` });
    }

    if (filters.uom) {
      queryBuilder.andWhere('item.uom = :uom', { uom: filters.uom });
    }

    if (filters.isConsumable !== undefined) {
      queryBuilder.andWhere('item.isConsumable = :isConsumable', { isConsumable: filters.isConsumable });
    }

    if (filters.hazardClass) {
      queryBuilder.andWhere('item.hazardClass = :hazardClass', { hazardClass: filters.hazardClass });
    }

    if (filters.warehouseId) {
      queryBuilder.andWhere('stock.warehouseId = :warehouseId', { warehouseId: filters.warehouseId });
    }

    if (filters.belowReorderLevel) {
      queryBuilder.andWhere('stock.reorderLevel IS NOT NULL')
        .andWhere('(stock.onHandQty - stock.reservedQty) <= stock.reorderLevel');
    }

    const total = await queryBuilder.getCount();

    const page = filters.page || 1;
    const limit = filters.limit || 20;

    queryBuilder
      .orderBy(`item.${filters.sortBy || 'name'}`, filters.order || 'ASC')
      .skip((page - 1) * limit)
      .take(limit);

    const items = await queryBuilder.getMany();

    const data = items.map((item) => this.toResponseDto(item));

    return {
      data,
      total,
      page,
      limit,
    };
  }

  /**
   * Get a single item by ID with stock details
   */
  async findOne(id: number): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { itemId: id },
      relations: ['category', 'stock', 'stock.warehouse'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    return this.toResponseDto(item, true);
  }

  /**
   * Update an item
   */
  async update(id: number, updateDto: UpdateItemDto): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { itemId: id },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    if (updateDto.name !== undefined) item.name = updateDto.name;
    if (updateDto.itemCategoryId !== undefined) item.itemCategoryId = updateDto.itemCategoryId;
    if (updateDto.uom !== undefined) item.uom = updateDto.uom;
    if (updateDto.standardUnitCost !== undefined) item.standardUnitCost = updateDto.standardUnitCost;
    if (updateDto.isConsumable !== undefined) item.isConsumable = updateDto.isConsumable;
    if (updateDto.hazardClass !== undefined) item.hazardClass = updateDto.hazardClass || null;
    if (updateDto.shelfLifeDays !== undefined) item.shelfLifeDays = updateDto.shelfLifeDays || null;
    if (updateDto.storageRequirements !== undefined) {
      item.storageRequirements = updateDto.storageRequirements || null;
    }

    const saved = await this.itemRepository.save(item);
    return this.toResponseDto(saved);
  }

  /**
   * Delete an item (only if no stock)
   */
  async delete(id: number): Promise<void> {
    const item = await this.itemRepository.findOne({
      where: { itemId: id },
      relations: ['stock'],
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${id} not found`);
    }

    if (item.stock && item.stock.length > 0) {
      const totalStock = item.stock.reduce((sum, s) => sum + Number(s.onHandQty), 0);
      if (totalStock > 0) {
        throw new BadRequestException(
          `Cannot delete item with stock. Total stock: ${totalStock}`,
        );
      }
    }

    await this.itemRepository.remove(item);
  }

  /**
   * Get items by category
   */
  async getByCategory(categoryId: number): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository.find({
      where: { itemCategoryId: categoryId },
      relations: ['category', 'stock'],
    });

    return items.map((item) => this.toResponseDto(item));
  }

  /**
   * Search items by name
   */
  async searchItems(searchTerm: string): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository.find({
      where: { name: Like(`%${searchTerm}%`) },
      relations: ['category', 'stock'],
    });

    return items.map((item) => this.toResponseDto(item));
  }

  /**
   * Get items below reorder level
   */
  async getBelowReorderLevel(): Promise<ItemResponseDto[]> {
    const stocks = await this.warehouseStockRepository
      .createQueryBuilder('stock')
      .leftJoinAndSelect('stock.item', 'item')
      .leftJoinAndSelect('item.category', 'category')
      .leftJoinAndSelect('stock.warehouse', 'warehouse')
      .where('stock.reorderLevel IS NOT NULL')
      .andWhere('(stock.onHandQty - stock.reservedQty) <= stock.reorderLevel')
      .getMany();

    const itemIds = [...new Set(stocks.map((s) => s.itemId))];
    const items = await this.itemRepository.find({
      where: itemIds.map((id) => ({ itemId: id })),
      relations: ['category', 'stock', 'stock.warehouse'],
    });

    return items.map((item) => this.toResponseDto(item, true));
  }

  /**
   * Get item stock across all warehouses
   */
  async getItemStock(itemId: number): Promise<WarehouseStockInfoDto[]> {
    const item = await this.itemRepository.findOne({
      where: { itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    const stocks = await this.warehouseStockRepository.find({
      where: { itemId },
      relations: ['warehouse'],
    });

    return stocks.map((stock) => ({
      warehouseId: stock.warehouseId,
      warehouseName: stock.warehouse.name,
      onHandQty: Number(stock.onHandQty),
      reservedQty: Number(stock.reservedQty),
      availableQty: stock.availableQty,
      reorderLevel: stock.reorderLevel ? Number(stock.reorderLevel) : undefined,
      stockValue: Number(stock.onHandQty) * Number(item.standardUnitCost),
    }));
  }

  /**
   * Update standard cost for an item
   */
  async updateStandardCost(itemId: number, newCost: number): Promise<ItemResponseDto> {
    const item = await this.itemRepository.findOne({
      where: { itemId },
    });

    if (!item) {
      throw new NotFoundException(`Item with ID ${itemId} not found`);
    }

    item.standardUnitCost = newCost;
    const saved = await this.itemRepository.save(item);

    return this.toResponseDto(saved);
  }

  /**
   * Get items expiring within specified days
   */
  async getExpiringItems(days: number): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository
      .createQueryBuilder('item')
      .leftJoinAndSelect('item.category', 'category')
      .where('item.shelfLifeDays IS NOT NULL')
      .andWhere('item.shelfLifeDays <= :days', { days })
      .getMany();

    return items.map((item) => this.toResponseDto(item));
  }

  /**
   * Get all hazardous items
   */
  async getHazardousItems(): Promise<ItemResponseDto[]> {
    const items = await this.itemRepository.find({
      where: [
        { hazardClass: 'FLAMMABLE' },
        { hazardClass: 'TOXIC' },
        { hazardClass: 'CORROSIVE' },
        { hazardClass: 'EXPLOSIVE' },
        { hazardClass: 'RADIOACTIVE' },
        { hazardClass: 'OXIDIZING' },
      ],
      relations: ['category', 'stock'],
    });

    return items.map((item) => this.toResponseDto(item));
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(item: Item, includeStockDetails: boolean = false): ItemResponseDto {
    const response: ItemResponseDto = {
      itemId: item.itemId,
      name: item.name,
      categoryName: item.category?.name || '',
      uom: item.uom as any,
      standardUnitCost: Number(item.standardUnitCost),
      isConsumable: item.isConsumable,
      hazardClass: item.hazardClass as any,
      shelfLifeDays: item.shelfLifeDays !== null ? item.shelfLifeDays : undefined,
      storageRequirements: item.storageRequirements !== null ? item.storageRequirements : undefined,
    };

    if (item.stock && item.stock.length > 0) {
      const totalStock = item.stock.reduce((sum, s) => sum + Number(s.onHandQty), 0);
      response.totalStock = totalStock;
      response.totalValue = totalStock * Number(item.standardUnitCost);

      if (includeStockDetails) {
        response.warehouseStock = item.stock.map((stock) => ({
          warehouseId: stock.warehouseId,
          warehouseName: stock.warehouse?.name || '',
          onHandQty: Number(stock.onHandQty),
          reservedQty: Number(stock.reservedQty),
          availableQty: stock.availableQty,
          reorderLevel: stock.reorderLevel ? Number(stock.reorderLevel) : undefined,
          stockValue: Number(stock.onHandQty) * Number(item.standardUnitCost),
        }));
      }
    }

    return response;
  }
}

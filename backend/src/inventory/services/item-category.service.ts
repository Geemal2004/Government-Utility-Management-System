import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ItemCategory } from '../../database/entities/item-category.entity';
import {
  CreateItemCategoryDto,
  UpdateItemCategoryDto,
  ItemCategoryResponseDto,
} from '../dto';

/**
 * Service for managing item categories
 */
@Injectable()
export class ItemCategoryService {
  constructor(
    @InjectRepository(ItemCategory)
    private readonly itemCategoryRepository: Repository<ItemCategory>,
  ) {}

  /**
   * Create a new item category
   */
  async create(createDto: CreateItemCategoryDto): Promise<ItemCategoryResponseDto> {
    const category = this.itemCategoryRepository.create({
      name: createDto.name,
      categoryType: createDto.categoryType,
      utilityTypeId: createDto.utilityTypeId || null,
    });

    const saved = await this.itemCategoryRepository.save(category);

    return this.toResponseDto(saved);
  }

  /**
   * Get all categories with optional item counts
   */
  async findAll(): Promise<ItemCategoryResponseDto[]> {
    const categories = await this.itemCategoryRepository.find({
      relations: ['utilityType', 'items'],
    });

    return categories.map((category) => ({
      itemCategoryId: category.itemCategoryId,
      name: category.name,
      categoryType: category.categoryType,
      utilityTypeName: category.utilityType?.name,
      itemCount: category.items?.length || 0,
    }));
  }

  /**
   * Get a single category by ID
   */
  async findOne(id: number): Promise<ItemCategoryResponseDto> {
    const category = await this.itemCategoryRepository.findOne({
      where: { itemCategoryId: id },
      relations: ['utilityType', 'items'],
    });

    if (!category) {
      throw new NotFoundException(`Item category with ID ${id} not found`);
    }

    return {
      itemCategoryId: category.itemCategoryId,
      name: category.name,
      categoryType: category.categoryType,
      utilityTypeName: category.utilityType?.name,
      itemCount: category.items?.length || 0,
    };
  }

  /**
   * Update a category
   */
  async update(id: number, updateDto: UpdateItemCategoryDto): Promise<ItemCategoryResponseDto> {
    const category = await this.itemCategoryRepository.findOne({
      where: { itemCategoryId: id },
    });

    if (!category) {
      throw new NotFoundException(`Item category with ID ${id} not found`);
    }

    if (updateDto.name !== undefined) {
      category.name = updateDto.name;
    }
    if (updateDto.categoryType !== undefined) {
      category.categoryType = updateDto.categoryType;
    }
    if (updateDto.utilityTypeId !== undefined) {
      category.utilityTypeId = updateDto.utilityTypeId || null;
    }

    const saved = await this.itemCategoryRepository.save(category);
    return this.toResponseDto(saved);
  }

  /**
   * Delete a category (only if no items)
   */
  async delete(id: number): Promise<void> {
    const category = await this.itemCategoryRepository.findOne({
      where: { itemCategoryId: id },
      relations: ['items'],
    });

    if (!category) {
      throw new NotFoundException(`Item category with ID ${id} not found`);
    }

    if (category.items && category.items.length > 0) {
      throw new BadRequestException(
        `Cannot delete category with ${category.items.length} items. Remove items first.`,
      );
    }

    await this.itemCategoryRepository.remove(category);
  }

  /**
   * Get categories by utility type
   */
  async getByUtilityType(utilityTypeId: number): Promise<ItemCategoryResponseDto[]> {
    const categories = await this.itemCategoryRepository.find({
      where: { utilityTypeId },
      relations: ['utilityType', 'items'],
    });

    return categories.map((category) => this.toResponseDto(category));
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(category: ItemCategory): ItemCategoryResponseDto {
    return {
      itemCategoryId: category.itemCategoryId,
      name: category.name,
      categoryType: category.categoryType,
      utilityTypeName: category.utilityType?.name,
      itemCount: category.items?.length || 0,
    };
  }
}

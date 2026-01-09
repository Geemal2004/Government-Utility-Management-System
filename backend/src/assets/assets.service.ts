import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Like } from 'typeorm';
import { Asset } from '../database/entities/asset.entity';
import { CreateAssetDto, UpdateAssetDto, AssetResponseDto, AssetFilterDto } from './dto';

/**
 * Service for managing assets
 */
@Injectable()
export class AssetsService {
  constructor(
    @InjectRepository(Asset)
    private assetRepository: Repository<Asset>,
  ) {}

  /**
   * Create a new asset
   */
  async create(createAssetDto: CreateAssetDto): Promise<AssetResponseDto> {
    const asset = this.assetRepository.create(createAssetDto);
    const saved = await this.assetRepository.save(asset);
    return this.toResponseDto(await this.findOne(saved.assetId));
  }

  /**
   * Find all assets with filtering and pagination
   */
  async findAll(filters: AssetFilterDto): Promise<{ data: AssetResponseDto[]; total: number; page: number; limit: number }> {
    const { search, assetType, status, utilityTypeId, page = 1, limit = 10, sortBy = 'assetId', order = 'ASC' } = filters;

    const queryBuilder = this.assetRepository
      .createQueryBuilder('asset')
      .leftJoinAndSelect('asset.utilityType', 'utilityType');

    if (search) {
      queryBuilder.andWhere('asset.name LIKE :search', { search: `%${search}%` });
    }

    if (assetType) {
      queryBuilder.andWhere('asset.assetType = :assetType', { assetType });
    }

    if (status) {
      queryBuilder.andWhere('asset.status = :status', { status });
    }

    if (utilityTypeId) {
      queryBuilder.andWhere('asset.utilityTypeId = :utilityTypeId', { utilityTypeId });
    }

    const total = await queryBuilder.getCount();
    
    const assets = await queryBuilder
      .orderBy(`asset.${sortBy}`, order)
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      data: assets.map(asset => this.toResponseDto(asset)),
      total,
      page,
      limit,
    };
  }

  /**
   * Find one asset by ID
   */
  async findOne(id: number): Promise<Asset> {
    const asset = await this.assetRepository.findOne({
      where: { assetId: id },
      relations: ['utilityType'],
    });

    if (!asset) {
      throw new NotFoundException(`Asset with ID ${id} not found`);
    }

    return asset;
  }

  /**
   * Update an asset
   */
  async update(id: number, updateAssetDto: UpdateAssetDto): Promise<AssetResponseDto> {
    await this.findOne(id); // Check if exists
    await this.assetRepository.update(id, updateAssetDto);
    return this.toResponseDto(await this.findOne(id));
  }

  /**
   * Delete an asset (soft delete by setting status to RETIRED)
   */
  async remove(id: number): Promise<void> {
    const asset = await this.findOne(id);
    asset.status = 'RETIRED' as any;
    await this.assetRepository.save(asset);
  }

  /**
   * Get assets by type
   */
  async getByType(assetType: string): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.find({
      where: { assetType },
      relations: ['utilityType'],
    });
    return assets.map(asset => this.toResponseDto(asset));
  }

  /**
   * Get assets by utility type
   */
  async getByUtilityType(utilityTypeId: number): Promise<AssetResponseDto[]> {
    const assets = await this.assetRepository.find({
      where: { utilityTypeId },
      relations: ['utilityType'],
    });
    return assets.map(asset => this.toResponseDto(asset));
  }

  /**
   * Convert entity to response DTO
   */
  private toResponseDto(asset: Asset): AssetResponseDto {
    return {
      assetId: asset.assetId,
      name: asset.name,
      assetType: asset.assetType,
      status: asset.status,
      utilityTypeId: asset.utilityTypeId,
      utilityType: asset.utilityType ? {
        utilityTypeId: asset.utilityType.utilityTypeId,
        code: asset.utilityType.code,
        name: asset.utilityType.name,
      } : undefined,
    };
  }
}

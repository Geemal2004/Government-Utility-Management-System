import { IsOptional, IsString, IsEnum, IsNumber, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { AssetStatus } from '../../database/entities/asset.entity';

/**
 * DTO for filtering assets
 */
export class AssetFilterDto {
  @ApiPropertyOptional({ description: 'Search by name', example: 'Transformer' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by asset type', example: 'TRANSFORMER' })
  @IsOptional()
  @IsString()
  assetType?: string;

  @ApiPropertyOptional({ 
    description: 'Filter by status', 
    enum: AssetStatus,
    example: AssetStatus.ACTIVE 
  })
  @IsOptional()
  @IsEnum(AssetStatus)
  status?: AssetStatus;

  @ApiPropertyOptional({ description: 'Filter by utility type ID', example: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  utilityTypeId?: number;

  @ApiPropertyOptional({ description: 'Page number', example: 1, minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', example: 10, minimum: 1, default: 10 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 10;

  @ApiPropertyOptional({ description: 'Sort by field', example: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'assetId';

  @ApiPropertyOptional({ description: 'Sort order', example: 'ASC', enum: ['ASC', 'DESC'] })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}

import { IsOptional, IsNumber, IsString, IsBoolean, IsEnum, Min } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * DTO for filtering items
 */
export class ItemFilterDto {
  @ApiPropertyOptional({ description: 'Filter by category ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  categoryId?: number;

  @ApiPropertyOptional({ description: 'Search by name' })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ description: 'Filter by unit of measure' })
  @IsOptional()
  @IsString()
  uom?: string;

  @ApiPropertyOptional({ description: 'Filter by consumable status' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  isConsumable?: boolean;

  @ApiPropertyOptional({ description: 'Filter by hazard class' })
  @IsOptional()
  @IsString()
  hazardClass?: string;

  @ApiPropertyOptional({ description: 'Show only items below reorder level' })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  belowReorderLevel?: boolean;

  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  warehouseId?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'name' })
  @IsOptional()
  @IsString()
  sortBy?: string = 'name';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'ASC',
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'ASC';
}

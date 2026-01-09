import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../../database/entities/item-category.entity';

/**
 * Response DTO for item category
 */
export class ItemCategoryResponseDto {
  @ApiProperty({ description: 'Category ID' })
  itemCategoryId: number;

  @ApiProperty({ description: 'Category name' })
  name: string;

  @ApiProperty({ description: 'Category type', enum: CategoryType })
  categoryType: CategoryType;

  @ApiPropertyOptional({ description: 'Utility type name (if applicable)' })
  utilityTypeName?: string;

  @ApiPropertyOptional({ description: 'Number of items in this category' })
  itemCount?: number;
}

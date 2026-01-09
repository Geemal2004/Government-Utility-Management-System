import { IsNotEmpty, IsString, IsEnum, IsOptional, MinLength } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CategoryType } from '../../database/entities/item-category.entity';

/**
 * DTO for creating a new item category
 */
export class CreateItemCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Electrical Spare Parts',
    minLength: 2,
  })
  @IsNotEmpty({ message: 'Category name is required' })
  @IsString()
  @MinLength(2, { message: 'Category name must be at least 2 characters' })
  name: string;

  @ApiProperty({
    description: 'Category type',
    enum: CategoryType,
    example: CategoryType.SPARE_PARTS,
  })
  @IsNotEmpty({ message: 'Category type is required' })
  @IsEnum(CategoryType, { message: 'Invalid category type' })
  categoryType: CategoryType;

  @ApiPropertyOptional({
    description: 'Utility type ID (optional, for utility-specific categories)',
    example: 1,
  })
  @IsOptional()
  utilityTypeId?: number;
}

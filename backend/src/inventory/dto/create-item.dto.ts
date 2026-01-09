import {
  IsNotEmpty,
  IsString,
  IsNumber,
  IsBoolean,
  IsOptional,
  IsEnum,
  MinLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Unit of measure enum
 */
export enum UnitOfMeasure {
  PIECES = 'PIECES',
  KG = 'KG',
  METERS = 'METERS',
  LITERS = 'LITERS',
  BOXES = 'BOXES',
  UNITS = 'UNITS',
  GRAMS = 'GRAMS',
  TONS = 'TONS',
  CUBIC_METERS = 'CUBIC_METERS',
}

/**
 * Hazard class enum
 */
export enum HazardClass {
  FLAMMABLE = 'FLAMMABLE',
  TOXIC = 'TOXIC',
  CORROSIVE = 'CORROSIVE',
  EXPLOSIVE = 'EXPLOSIVE',
  RADIOACTIVE = 'RADIOACTIVE',
  OXIDIZING = 'OXIDIZING',
}

/**
 * DTO for creating a new item
 */
export class CreateItemDto {
  @ApiProperty({
    description: 'Item name',
    example: 'Electrical Wire - 2.5mm',
    minLength: 3,
  })
  @IsNotEmpty({ message: 'Item name is required' })
  @IsString()
  @MinLength(3, { message: 'Item name must be at least 3 characters' })
  name: string;

  @ApiProperty({
    description: 'Item category ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Item category ID is required' })
  @IsNumber()
  itemCategoryId: number;

  @ApiProperty({
    description: 'Unit of measure',
    enum: UnitOfMeasure,
    example: UnitOfMeasure.METERS,
  })
  @IsNotEmpty({ message: 'Unit of measure is required' })
  @IsEnum(UnitOfMeasure, { message: 'Invalid unit of measure' })
  uom: UnitOfMeasure;

  @ApiProperty({
    description: 'Standard unit cost',
    example: 15.75,
    minimum: 0,
  })
  @IsNotEmpty({ message: 'Standard unit cost is required' })
  @IsNumber()
  @Min(0, { message: 'Unit cost must be non-negative' })
  standardUnitCost: number;

  @ApiPropertyOptional({
    description: 'Is item consumable',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  isConsumable?: boolean;

  @ApiPropertyOptional({
    description: 'Hazard class (if applicable)',
    enum: HazardClass,
    example: HazardClass.FLAMMABLE,
  })
  @IsOptional()
  @IsEnum(HazardClass, { message: 'Invalid hazard class' })
  hazardClass?: HazardClass;

  @ApiPropertyOptional({
    description: 'Shelf life in days',
    example: 365,
    minimum: 0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'Shelf life days must be non-negative' })
  shelfLifeDays?: number;

  @ApiPropertyOptional({
    description: 'Storage requirements',
    example: 'Store in cool, dry place away from direct sunlight',
  })
  @IsOptional()
  @IsString()
  storageRequirements?: string;
}

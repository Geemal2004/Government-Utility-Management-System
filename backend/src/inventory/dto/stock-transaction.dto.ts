import {
  IsNotEmpty,
  IsNumber,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  IsEnum,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  TransactionType,
  ReferenceType,
} from '../../database/entities/stock-transaction.entity';

/**
 * DTO for stock receipt item
 */
export class StockReceiptItemDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @ApiProperty({ description: 'Quantity received', example: 100 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001, { message: 'Quantity must be greater than 0' })
  qty: number;

  @ApiProperty({ description: 'Unit cost', example: 15.75 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0, { message: 'Unit cost must be non-negative' })
  unitCost: number;
}

/**
 * DTO for receiving stock
 */
export class StockReceiptDto {
  @ApiProperty({ description: 'Warehouse ID', example: 1 })
  @IsNotEmpty({ message: 'Warehouse ID is required' })
  @IsNumber()
  warehouseId: number;

  @ApiProperty({
    description: 'Items to receive',
    type: [StockReceiptItemDto],
  })
  @IsNotEmpty({ message: 'Items are required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockReceiptItemDto)
  items: StockReceiptItemDto[];

  @ApiProperty({
    description: 'Reference type',
    enum: ReferenceType,
    example: ReferenceType.PURCHASE_ORDER,
  })
  @IsNotEmpty({ message: 'Reference type is required' })
  @IsEnum(ReferenceType, { message: 'Invalid reference type' })
  referenceType: ReferenceType;

  @ApiPropertyOptional({ description: 'Reference ID', example: 123 })
  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for stock issue item
 */
export class StockIssueItemDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @ApiProperty({ description: 'Quantity to issue', example: 10 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001, { message: 'Quantity must be greater than 0' })
  qty: number;
}

/**
 * DTO for issuing stock
 */
export class StockIssueDto {
  @ApiProperty({ description: 'Warehouse ID', example: 1 })
  @IsNotEmpty({ message: 'Warehouse ID is required' })
  @IsNumber()
  warehouseId: number;

  @ApiProperty({
    description: 'Items to issue',
    type: [StockIssueItemDto],
  })
  @IsNotEmpty({ message: 'Items are required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockIssueItemDto)
  items: StockIssueItemDto[];

  @ApiProperty({
    description: 'Reference type',
    enum: ReferenceType,
    example: ReferenceType.WORK_ORDER,
  })
  @IsNotEmpty({ message: 'Reference type is required' })
  @IsEnum(ReferenceType, { message: 'Invalid reference type' })
  referenceType: ReferenceType;

  @ApiPropertyOptional({ description: 'Reference ID', example: 456 })
  @IsOptional()
  @IsNumber()
  referenceId?: number;

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for stock transfer item
 */
export class StockTransferItemDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @ApiProperty({ description: 'Quantity to transfer', example: 50 })
  @IsNotEmpty()
  @IsNumber()
  @Min(0.001, { message: 'Quantity must be greater than 0' })
  qty: number;
}

/**
 * DTO for transferring stock between warehouses
 */
export class StockTransferDto {
  @ApiProperty({ description: 'Source warehouse ID', example: 1 })
  @IsNotEmpty({ message: 'Source warehouse ID is required' })
  @IsNumber()
  fromWarehouseId: number;

  @ApiProperty({ description: 'Destination warehouse ID', example: 2 })
  @IsNotEmpty({ message: 'Destination warehouse ID is required' })
  @IsNumber()
  toWarehouseId: number;

  @ApiProperty({
    description: 'Items to transfer',
    type: [StockTransferItemDto],
  })
  @IsNotEmpty({ message: 'Items are required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockTransferItemDto)
  items: StockTransferItemDto[];

  @ApiPropertyOptional({ description: 'Notes' })
  @IsOptional()
  @IsString()
  notes?: string;
}

/**
 * DTO for stock adjustment item
 */
export class StockAdjustmentItemDto {
  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  itemId: number;

  @ApiProperty({ description: 'Quantity adjustment (can be negative)', example: -5 })
  @IsNotEmpty()
  @IsNumber()
  qtyAdjustment: number;

  @ApiProperty({ description: 'Adjustment reason', example: 'Damaged goods' })
  @IsNotEmpty()
  @IsString()
  reason: string;
}

/**
 * Adjustment type enum
 */
export enum AdjustmentType {
  STOCKTAKE = 'STOCKTAKE',
  DAMAGE = 'DAMAGE',
  EXPIRY = 'EXPIRY',
  CORRECTION = 'CORRECTION',
}

/**
 * DTO for adjusting stock
 */
export class StockAdjustmentDto {
  @ApiProperty({ description: 'Warehouse ID', example: 1 })
  @IsNotEmpty({ message: 'Warehouse ID is required' })
  @IsNumber()
  warehouseId: number;

  @ApiProperty({
    description: 'Items to adjust',
    type: [StockAdjustmentItemDto],
  })
  @IsNotEmpty({ message: 'Items are required' })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => StockAdjustmentItemDto)
  items: StockAdjustmentItemDto[];

  @ApiProperty({
    description: 'Adjustment type',
    enum: AdjustmentType,
    example: AdjustmentType.DAMAGE,
  })
  @IsNotEmpty({ message: 'Adjustment type is required' })
  @IsEnum(AdjustmentType, { message: 'Invalid adjustment type' })
  adjustmentType: AdjustmentType;
}

/**
 * DTO for stock write-off
 */
export class StockWriteOffDto {
  @ApiProperty({ description: 'Warehouse ID', example: 1 })
  @IsNotEmpty({ message: 'Warehouse ID is required' })
  @IsNumber()
  warehouseId: number;

  @ApiProperty({ description: 'Item ID', example: 1 })
  @IsNotEmpty({ message: 'Item ID is required' })
  @IsNumber()
  itemId: number;

  @ApiProperty({ description: 'Quantity to write off', example: 10 })
  @IsNotEmpty({ message: 'Quantity is required' })
  @IsNumber()
  @Min(0.001, { message: 'Quantity must be greater than 0' })
  qty: number;

  @ApiProperty({ description: 'Write-off reason', example: 'Expired items' })
  @IsNotEmpty({ message: 'Reason is required' })
  @IsString()
  reason: string;
}

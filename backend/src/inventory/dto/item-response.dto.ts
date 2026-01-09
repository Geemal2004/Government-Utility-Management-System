import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { UnitOfMeasure, HazardClass } from './create-item.dto';

/**
 * Warehouse stock info DTO
 */
export class WarehouseStockInfoDto {
  @ApiProperty({ description: 'Warehouse ID' })
  warehouseId: number;

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName: string;

  @ApiProperty({ description: 'On-hand quantity' })
  onHandQty: number;

  @ApiProperty({ description: 'Reserved quantity' })
  reservedQty: number;

  @ApiProperty({ description: 'Available quantity' })
  availableQty: number;

  @ApiPropertyOptional({ description: 'Reorder level' })
  reorderLevel?: number;

  @ApiProperty({ description: 'Stock value' })
  stockValue: number;
}

/**
 * Response DTO for item
 */
export class ItemResponseDto {
  @ApiProperty({ description: 'Item ID' })
  itemId: number;

  @ApiProperty({ description: 'Item name' })
  name: string;

  @ApiProperty({ description: 'Category name' })
  categoryName: string;

  @ApiProperty({ description: 'Unit of measure', enum: UnitOfMeasure })
  uom: UnitOfMeasure;

  @ApiProperty({ description: 'Standard unit cost' })
  standardUnitCost: number;

  @ApiProperty({ description: 'Is consumable' })
  isConsumable: boolean;

  @ApiPropertyOptional({ description: 'Hazard class', enum: HazardClass })
  hazardClass?: HazardClass;

  @ApiPropertyOptional({ description: 'Shelf life days' })
  shelfLifeDays?: number;

  @ApiPropertyOptional({ description: 'Storage requirements' })
  storageRequirements?: string;

  @ApiPropertyOptional({ description: 'Total stock across all warehouses' })
  totalStock?: number;

  @ApiPropertyOptional({ description: 'Total value across all warehouses' })
  totalValue?: number;

  @ApiPropertyOptional({
    description: 'Stock levels by warehouse',
    type: [WarehouseStockInfoDto],
  })
  warehouseStock?: WarehouseStockInfoDto[];
}

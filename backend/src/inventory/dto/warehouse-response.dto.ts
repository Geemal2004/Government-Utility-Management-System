import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarehouseStatus } from '../../database/entities/warehouse.entity';

/**
 * Response DTO for warehouse
 */
export class WarehouseResponseDto {
  @ApiProperty({ description: 'Warehouse ID' })
  warehouseId: number;

  @ApiProperty({ description: 'Warehouse name' })
  name: string;

  @ApiProperty({ description: 'Warehouse status', enum: WarehouseStatus })
  status: WarehouseStatus;

  @ApiProperty({ description: 'Geographic area name' })
  geoAreaName: string;

  @ApiPropertyOptional({ description: 'Total number of items in stock' })
  totalItems?: number;

  @ApiPropertyOptional({ description: 'Total stock value' })
  totalStockValue?: number;

  @ApiPropertyOptional({ description: 'Number of items below reorder level' })
  lowStockItems?: number;

  @ApiPropertyOptional({ description: 'Last stocktake date' })
  lastStocktakeDate?: Date;
}

/**
 * Warehouse stock DTO
 */
export class WarehouseStockDto {
  @ApiProperty({ description: 'Item ID' })
  itemId: number;

  @ApiProperty({ description: 'Item name' })
  itemName: string;

  @ApiProperty({ description: 'Category name' })
  category: string;

  @ApiProperty({ description: 'Unit of measure' })
  uom: string;

  @ApiProperty({ description: 'On-hand quantity' })
  onHandQty: number;

  @ApiProperty({ description: 'Reserved quantity' })
  reservedQty: number;

  @ApiProperty({ description: 'Available quantity' })
  availableQty: number;

  @ApiPropertyOptional({ description: 'Reorder level' })
  reorderLevel?: number;

  @ApiProperty({ description: 'Needs reorder' })
  needsReorder: boolean;

  @ApiProperty({ description: 'Unit cost' })
  unitCost: number;

  @ApiProperty({ description: 'Total value' })
  totalValue: number;

  @ApiPropertyOptional({ description: 'Last stocktake timestamp' })
  lastStocktake?: Date;
}

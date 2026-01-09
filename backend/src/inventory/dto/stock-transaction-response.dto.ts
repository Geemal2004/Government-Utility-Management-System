import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { TransactionType, ReferenceType } from '../../database/entities/stock-transaction.entity';

/**
 * Response DTO for stock transaction
 */
export class StockTransactionResponseDto {
  @ApiProperty({ description: 'Transaction ID' })
  stockTxnId: number;

  @ApiProperty({ description: 'Warehouse ID' })
  warehouseId: number;

  @ApiProperty({ description: 'Warehouse name' })
  warehouseName: string;

  @ApiProperty({ description: 'Item ID' })
  itemId: number;

  @ApiProperty({ description: 'Item name' })
  itemName: string;

  @ApiProperty({ description: 'Transaction type', enum: TransactionType })
  txnType: TransactionType;

  @ApiProperty({ description: 'Transaction timestamp' })
  txnTs: Date;

  @ApiProperty({ description: 'Quantity' })
  qty: number;

  @ApiProperty({ description: 'Unit cost' })
  unitCost: number;

  @ApiProperty({ description: 'Total value' })
  totalValue: number;

  @ApiPropertyOptional({ description: 'Reference type', enum: ReferenceType })
  referenceType?: ReferenceType;

  @ApiPropertyOptional({ description: 'Reference ID' })
  referenceId?: number;

  @ApiPropertyOptional({ description: 'Stock quantity before transaction' })
  beforeQty?: number;

  @ApiPropertyOptional({ description: 'Stock quantity after transaction' })
  afterQty?: number;
}

/**
 * DTO for filtering stock transactions
 */
export class StockTransactionFilterDto {
  @ApiPropertyOptional({ description: 'Filter by warehouse ID' })
  warehouseId?: number;

  @ApiPropertyOptional({ description: 'Filter by item ID' })
  itemId?: number;

  @ApiPropertyOptional({ description: 'Filter by transaction type' })
  txnType?: string;

  @ApiPropertyOptional({ description: 'Filter by start date' })
  startDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by end date' })
  endDate?: Date;

  @ApiPropertyOptional({ description: 'Filter by reference type' })
  referenceType?: string;

  @ApiPropertyOptional({ description: 'Filter by reference ID' })
  referenceId?: number;

  @ApiPropertyOptional({ description: 'Page number', default: 1 })
  page?: number = 1;

  @ApiPropertyOptional({ description: 'Items per page', default: 20 })
  limit?: number = 20;

  @ApiPropertyOptional({ description: 'Sort by field', default: 'txnTs' })
  sortBy?: string = 'txnTs';

  @ApiPropertyOptional({ description: 'Sort order', enum: ['ASC', 'DESC'], default: 'DESC' })
  order?: 'ASC' | 'DESC' = 'DESC';
}

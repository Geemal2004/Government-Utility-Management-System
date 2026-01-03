import {
  IsOptional,
  IsNumber,
  IsString,
  IsDate,
  IsBoolean,
  IsEnum,
  IsIn,
  Min,
  Max,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Bill status enum for filtering
 */
export enum BillStatusFilter {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
}

/**
 * DTO for filtering bills with pagination
 */
export class BillFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by meter ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  meterId?: number;

  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by utility type ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  utilityTypeId?: number;

  @ApiPropertyOptional({
    description: 'Filter by payment status',
    enum: BillStatusFilter,
    example: 'UNPAID',
  })
  @IsOptional()
  @IsEnum(BillStatusFilter)
  status?: BillStatusFilter;

  @ApiPropertyOptional({
    description: 'Filter bills from this date (bill_date)',
    example: '2024-01-01',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  startDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter bills up to this date (bill_date)',
    example: '2024-12-31',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  endDate?: Date;

  @ApiPropertyOptional({
    description: 'Filter by paid status',
    example: false,
  })
  @IsOptional()
  @IsBoolean()
  isPaid?: boolean;

  @ApiPropertyOptional({
    description: 'Filter by overdue status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isOverdue?: boolean;

  @ApiPropertyOptional({
    description: 'Page number (1-based)',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Field to sort by',
    example: 'billDate',
    default: 'billDate',
  })
  @IsOptional()
  @IsString()
  sortBy?: string = 'billDate';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsIn(['ASC', 'DESC'])
  order?: 'ASC' | 'DESC' = 'DESC';
}

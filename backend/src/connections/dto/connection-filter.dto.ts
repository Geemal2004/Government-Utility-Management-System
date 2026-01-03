import { IsOptional, IsNumber, IsString, IsEnum, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { ConnectionStatus } from '../../database/entities/service-connection.entity';

/**
 * DTO for filtering and paginating service connections
 */
export class ConnectionFilterDto {
  @ApiPropertyOptional({
    description: 'Filter by customer ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Customer ID must be a number' })
  @Type(() => Number)
  customerId?: number;

  @ApiPropertyOptional({
    description: 'Filter by utility type ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Utility type ID must be a number' })
  @Type(() => Number)
  utilityTypeId?: number;

  @ApiPropertyOptional({
    description: 'Filter by tariff category ID',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Tariff category ID must be a number' })
  @Type(() => Number)
  tariffCategoryId?: number;

  @ApiPropertyOptional({
    description: 'Filter by connection status',
    enum: ConnectionStatus,
    example: ConnectionStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(ConnectionStatus, {
    message: `Connection status must be one of: ${Object.values(ConnectionStatus).join(', ')}`,
  })
  connectionStatus?: ConnectionStatus;

  @ApiPropertyOptional({
    description: 'Filter by city',
    example: 'Colombo',
  })
  @IsOptional()
  @IsString({ message: 'City must be a string' })
  city?: string;

  @ApiPropertyOptional({
    description: 'Filter by meter serial number (partial match)',
    example: 'MTR-2024',
  })
  @IsOptional()
  @IsString({ message: 'Meter serial must be a string' })
  meterSerial?: string;

  @ApiPropertyOptional({
    description: 'Search by customer name (partial match)',
    example: 'John',
  })
  @IsOptional()
  @IsString({ message: 'Customer name must be a string' })
  customerName?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    default: 1,
    minimum: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Page must be a number' })
  @Min(1, { message: 'Page must be at least 1' })
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Limit must be a number' })
  @Min(1, { message: 'Limit must be at least 1' })
  @Max(100, { message: 'Limit must not exceed 100' })
  @Type(() => Number)
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'connectionId',
    enum: ['connectionId', 'customerId', 'connectionStatus', 'city'],
  })
  @IsOptional()
  @IsString({ message: 'Sort by must be a string' })
  sortBy?: string = 'connectionId';

  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'], { message: 'Order must be ASC or DESC' })
  order?: 'ASC' | 'DESC' = 'DESC';
}

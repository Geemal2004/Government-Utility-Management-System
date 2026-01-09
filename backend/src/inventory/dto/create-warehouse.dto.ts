import { IsNotEmpty, IsString, IsNumber, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { WarehouseStatus } from '../../database/entities/warehouse.entity';

/**
 * DTO for creating a new warehouse
 */
export class CreateWarehouseDto {
  @ApiProperty({
    description: 'Warehouse name',
    example: 'Central Warehouse',
  })
  @IsNotEmpty({ message: 'Warehouse name is required' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Geographic area ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Geographic area ID is required' })
  @IsNumber()
  geoAreaId: number;

  @ApiPropertyOptional({
    description: 'Warehouse status',
    enum: WarehouseStatus,
    default: WarehouseStatus.ACTIVE,
  })
  @IsOptional()
  @IsEnum(WarehouseStatus, { message: 'Invalid warehouse status' })
  status?: WarehouseStatus;
}

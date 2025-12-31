import { IsNotEmpty, IsNumber, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { CreateConnectionAddressDto } from './create-connection-address.dto';

/**
 * DTO for creating a new service connection
 */
export class CreateConnectionDto {
  @ApiProperty({
    description: 'Customer ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Customer ID is required' })
  @IsNumber({}, { message: 'Customer ID must be a number' })
  customerId: number;

  @ApiProperty({
    description: 'Utility type ID (1=Electricity, 2=Water, 3=Gas)',
    example: 1,
  })
  @IsNotEmpty({ message: 'Utility type ID is required' })
  @IsNumber({}, { message: 'Utility type ID must be a number' })
  utilityTypeId: number;

  @ApiProperty({
    description: 'Tariff category ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Tariff category ID is required' })
  @IsNumber({}, { message: 'Tariff category ID must be a number' })
  tariffCategoryId: number;

  @ApiProperty({
    description: 'Connection address details',
    type: CreateConnectionAddressDto,
  })
  @IsNotEmpty({ message: 'Connection address is required' })
  @ValidateNested({ message: 'Connection address validation failed' })
  @Type(() => CreateConnectionAddressDto)
  connectionAddress: CreateConnectionAddressDto;

  @ApiPropertyOptional({
    description: 'Meter ID (optional - can be assigned later)',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Meter ID must be a number' })
  meterId?: number;

  @ApiPropertyOptional({
    description: 'Network node ID (optional)',
    example: 1,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Node ID must be a number' })
  nodeId?: number;
}

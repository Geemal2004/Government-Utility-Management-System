import { IsNotEmpty, IsString, IsNumber, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO for creating a connection address
 */
export class CreateConnectionAddressDto {
  @ApiProperty({
    description: 'Address line 1',
    example: '123 Main Street',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Address line 1 is required' })
  @IsString({ message: 'Address line 1 must be a string' })
  @MaxLength(200, { message: 'Address line 1 must not exceed 200 characters' })
  line1: string;

  @ApiProperty({
    description: 'City name',
    example: 'Colombo',
    maxLength: 120,
  })
  @IsNotEmpty({ message: 'City is required' })
  @IsString({ message: 'City must be a string' })
  @MaxLength(120, { message: 'City must not exceed 120 characters' })
  city: string;

  @ApiProperty({
    description: 'Postal code',
    example: '00100',
    maxLength: 20,
  })
  @IsNotEmpty({ message: 'Postal code is required' })
  @IsString({ message: 'Postal code must be a string' })
  @MaxLength(20, { message: 'Postal code must not exceed 20 characters' })
  postalCode: string;

  @ApiProperty({
    description: 'Geographic area ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Geo area ID is required' })
  @IsNumber({}, { message: 'Geo area ID must be a number' })
  geoAreaId: number;
}

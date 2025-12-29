import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  IsArray,
  MaxLength,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Customer types enum
 */
export enum CustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  GOVERNMENT = 'GOVERNMENT',
}

/**
 * Identity types enum
 */
export enum IdentityType {
  NIC = 'NIC',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  BUSINESS_REG = 'BUSINESS_REG',
}

/**
 * DTO for creating customer address
 */
export class CreateCustomerAddressDto {
  @ApiProperty({ description: 'Postal code', example: '10100', maxLength: 20 })
  @IsNotEmpty({ message: 'Postal code is required' })
  @IsString()
  @MaxLength(20)
  postalCode: string;

  @ApiProperty({
    description: 'Address line 1',
    example: '123 Main Street, Apartment 4B',
    maxLength: 200,
  })
  @IsNotEmpty({ message: 'Address line 1 is required' })
  @IsString()
  @MaxLength(200)
  line1: string;
}

/**
 * DTO for creating a new customer
 */
export class CreateCustomerDto {
  @ApiProperty({ description: 'First name', example: 'John', maxLength: 80 })
  @IsNotEmpty({ message: 'First name is required' })
  @IsString()
  @MaxLength(80)
  firstName: string;

  @ApiPropertyOptional({
    description: 'Middle name',
    example: 'William',
    maxLength: 80,
  })
  @IsOptional()
  @IsString()
  @MaxLength(80)
  middleName?: string;

  @ApiProperty({ description: 'Last name', example: 'Doe', maxLength: 80 })
  @IsNotEmpty({ message: 'Last name is required' })
  @IsString()
  @MaxLength(80)
  lastName: string;

  @ApiPropertyOptional({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsOptional()
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email?: string;

  @ApiProperty({
    description: 'Password (min 6 characters)',
    example: 'securePassword123',
    minLength: 6,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters' })
  password: string;

  @ApiProperty({
    description: 'Customer type',
    enum: CustomerType,
    example: CustomerType.RESIDENTIAL,
  })
  @IsNotEmpty({ message: 'Customer type is required' })
  @IsEnum(CustomerType, { message: 'Invalid customer type' })
  customerType: CustomerType;

  @ApiProperty({
    description: 'Identity document type',
    enum: IdentityType,
    example: IdentityType.NIC,
  })
  @IsNotEmpty({ message: 'Identity type is required' })
  @IsEnum(IdentityType, { message: 'Invalid identity type' })
  identityType: IdentityType;

  @ApiProperty({
    description: 'Identity reference number (unique)',
    example: '123456789V',
    maxLength: 80,
  })
  @IsNotEmpty({ message: 'Identity reference is required' })
  @IsString()
  @MaxLength(80)
  identityRef: string;

  @ApiProperty({
    description: 'Customer address',
    type: CreateCustomerAddressDto,
  })
  @IsNotEmpty({ message: 'Address is required' })
  @ValidateNested()
  @Type(() => CreateCustomerAddressDto)
  address: CreateCustomerAddressDto;

  @ApiPropertyOptional({
    description: 'Phone numbers',
    type: [String],
    example: ['+1234567890', '+0987654321'],
  })
  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @MaxLength(30, { each: true })
  phoneNumbers?: string[];

  @ApiPropertyOptional({
    description: 'Default tariff category ID',
    example: 1,
  })
  @IsOptional()
  tariffCategoryId?: number;
}

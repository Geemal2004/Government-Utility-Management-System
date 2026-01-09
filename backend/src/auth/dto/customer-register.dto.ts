import {
  IsNotEmpty,
  IsString,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
  MinLength,
} from 'class-validator';
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
 * DTO for customer self-registration (simplified)
 */
export class CustomerRegisterDto {
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

  @ApiProperty({
    description: 'Email address',
    example: 'john.doe@example.com',
  })
  @IsNotEmpty({ message: 'Email is required' })
  @IsEmail({}, { message: 'Invalid email format' })
  @MaxLength(255)
  email: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+94771234567',
    maxLength: 30,
  })
  @IsNotEmpty({ message: 'Phone number is required' })
  @IsString()
  @MaxLength(30)
  phoneNumber: string;

  @ApiProperty({
    description: 'Password (min 8 characters)',
    example: 'securePassword123',
    minLength: 8,
  })
  @IsNotEmpty({ message: 'Password is required' })
  @IsString()
  @MinLength(8, { message: 'Password must be at least 8 characters' })
  password: string;

  @ApiProperty({
    description: 'Address',
    example: '123 Main Street, Colombo',
    maxLength: 255,
  })
  @IsNotEmpty({ message: 'Address is required' })
  @IsString()
  @MaxLength(255)
  address: string;

  @ApiPropertyOptional({
    description: 'Postal code',
    example: '10100',
    maxLength: 20,
  })
  @IsOptional()
  @IsString()
  @MaxLength(20)
  postalCode?: string;

  @ApiProperty({
    description: 'NIC / Passport number (unique)',
    example: '123456789V',
    maxLength: 80,
  })
  @IsNotEmpty({ message: 'Identity reference is required' })
  @IsString()
  @MaxLength(80)
  identityRef: string;

  @ApiPropertyOptional({
    description: 'Identity type (NIC, PASSPORT, etc.)',
    example: 'NIC',
    default: 'NIC',
  })
  @IsOptional()
  @IsString()
  @MaxLength(30)
  identityType?: string;

  @ApiPropertyOptional({
    description: 'Customer type',
    enum: CustomerType,
    default: CustomerType.RESIDENTIAL,
  })
  @IsOptional()
  @IsEnum(CustomerType, { message: 'Invalid customer type' })
  customerType?: CustomerType;
}

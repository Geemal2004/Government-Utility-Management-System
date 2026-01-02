import {
  IsNotEmpty,
  IsNumber,
  IsEnum,
  IsOptional,
  IsString,
  Min,
  MaxLength,
  Validate,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * Reading source enum for DTO validation
 */
export enum ReadingSourceDto {
  MANUAL = 'MANUAL',
  SMART_METER = 'SMART_METER',
  ESTIMATED = 'ESTIMATED',
}

/**
 * Custom validator to ensure date is not in the future
 */
@ValidatorConstraint({ name: 'isNotFuture', async: false })
export class IsNotFutureConstraint implements ValidatorConstraintInterface {
  validate(date: Date): boolean {
    if (!date) return true;
    return new Date(date) <= new Date();
  }

  defaultMessage(args: ValidationArguments): string {
    return `${args.property} cannot be in the future`;
  }
}

/**
 * DTO for creating a new meter reading
 */
export class CreateMeterReadingDto {
  @ApiProperty({
    description: 'Meter ID',
    example: 1,
  })
  @IsNotEmpty({ message: 'Meter ID is required' })
  @IsNumber({}, { message: 'Meter ID must be a number' })
  meterId: number;

  @ApiProperty({
    description: 'Reading date and time',
    example: '2025-12-31T10:30:00Z',
  })
  @IsNotEmpty({ message: 'Reading date is required' })
  @Type(() => Date)
  @Validate(IsNotFutureConstraint, { message: 'Reading date cannot be in the future' })
  readingDate: Date;

  @ApiProperty({
    description: 'Source of the reading',
    enum: ReadingSourceDto,
    example: ReadingSourceDto.MANUAL,
  })
  @IsNotEmpty({ message: 'Reading source is required' })
  @IsEnum(ReadingSourceDto, {
    message: `Reading source must be one of: ${Object.values(ReadingSourceDto).join(', ')}`,
  })
  readingSource: ReadingSourceDto;

  @ApiProperty({
    description: 'Import reading (consumption from grid)',
    example: 12500.5,
  })
  @IsNotEmpty({ message: 'Import reading is required' })
  @IsNumber({}, { message: 'Import reading must be a number' })
  @Min(0, { message: 'Import reading must be non-negative' })
  importReading: number;

  @ApiPropertyOptional({
    description: 'Export reading (for solar/net metering)',
    example: 500.25,
  })
  @IsOptional()
  @IsNumber({}, { message: 'Export reading must be a number' })
  @Min(0, { message: 'Export reading must be non-negative' })
  exportReading?: number;

  @ApiPropertyOptional({
    description: 'Mobile device ID used for reading',
    example: 'DEV-001',
    maxLength: 80,
  })
  @IsOptional()
  @IsString({ message: 'Device ID must be a string' })
  @MaxLength(80, { message: 'Device ID must not exceed 80 characters' })
  deviceId?: string;

  @ApiPropertyOptional({
    description: 'Additional notes about the reading',
    example: 'Customer reported meter access issue',
  })
  @IsOptional()
  @IsString({ message: 'Notes must be a string' })
  @MaxLength(500, { message: 'Notes must not exceed 500 characters' })
  notes?: string;

  // Auto-billing options
  @ApiPropertyOptional({
    description: 'Whether to auto-generate a bill after creating this reading. Default is true.',
    example: true,
    default: true,
  })
  @IsOptional()
  autoGenerateBill?: boolean;

  @ApiPropertyOptional({
    description: 'Minimum days between bills for auto-generation. Default is 25 days.',
    example: 25,
    default: 25,
  })
  @IsOptional()
  @IsNumber({}, { message: 'minDaysBetweenBills must be a number' })
  @Min(1, { message: 'minDaysBetweenBills must be at least 1' })
  minDaysBetweenBills?: number;

  @ApiPropertyOptional({
    description: 'Number of days from bill date until due date. Default is 15 days.',
    example: 15,
    default: 15,
  })
  @IsOptional()
  @IsNumber({}, { message: 'dueDaysFromBillDate must be a number' })
  @Min(1, { message: 'dueDaysFromBillDate must be at least 1' })
  dueDaysFromBillDate?: number;
}

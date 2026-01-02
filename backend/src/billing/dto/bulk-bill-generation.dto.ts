import {
  IsNotEmpty,
  IsDate,
  IsOptional,
  IsNumber,
  IsString,
  IsBoolean,
  IsArray,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for bulk bill generation
 * Used to generate bills for multiple meters at once
 */
export class BulkBillGenerationDto {
  @ApiProperty({
    description: 'Start date of the billing period for all bills',
    example: '2024-01-01',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  billingPeriodStart: Date;

  @ApiProperty({
    description: 'End date of the billing period for all bills',
    example: '2024-01-31',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  billingPeriodEnd: Date;

  @ApiPropertyOptional({
    description: 'Filter by utility type ID (e.g., 1 for Electricity)',
    example: 1,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  utilityTypeId?: number;

  @ApiPropertyOptional({
    description: 'Filter by customer type (RESIDENTIAL, COMMERCIAL, etc.)',
    example: 'RESIDENTIAL',
  })
  @IsOptional()
  @IsString()
  customerType?: string;

  @ApiPropertyOptional({
    description: 'Generate bills for specific meter IDs only',
    example: [1, 2, 3, 4, 5],
    type: [Number],
  })
  @IsOptional()
  @IsArray()
  @IsNumber({}, { each: true })
  meterIds?: number[];

  @ApiPropertyOptional({
    description: 'Dry run mode - preview bill generation without saving to database',
    example: false,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  dryRun?: boolean = false;
}

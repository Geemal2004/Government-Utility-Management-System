import { IsOptional, IsNumber, IsDate, IsString, Min, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for updating a bill
 * Allows manual adjustments to bill amounts
 */
export class UpdateBillDto {
  @ApiPropertyOptional({
    description: 'Update energy charge amount',
    example: 2436.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  energyChargeAmount?: number;

  @ApiPropertyOptional({
    description: 'Update fixed charge amount',
    example: 100.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  fixedChargeAmount?: number;

  @ApiPropertyOptional({
    description: 'Update subsidy amount',
    example: 50.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  subsidyAmount?: number;

  @ApiPropertyOptional({
    description: 'Update solar export credit',
    example: 25.0,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  solarExportCredit?: number;

  @ApiPropertyOptional({
    description: 'Update payment due date',
    example: '2024-03-15',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Additional notes or remarks about this bill update',
    example: 'Manual adjustment approved by manager',
    maxLength: 500,
  })
  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}

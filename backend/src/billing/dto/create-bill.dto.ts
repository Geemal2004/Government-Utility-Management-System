import { IsNotEmpty, IsNumber, IsDate, IsOptional, IsBoolean, Min } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

/**
 * DTO for creating a new bill
 */
export class CreateBillDto {
  @ApiProperty({
    description: 'ID of the meter for which the bill is generated',
    example: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  meterId: number;

  @ApiProperty({
    description: 'Start date of the billing period',
    example: '2024-01-01',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  billingPeriodStart: Date;

  @ApiProperty({
    description: 'End date of the billing period',
    example: '2024-01-31',
    type: Date,
  })
  @IsNotEmpty()
  @Type(() => Date)
  @IsDate()
  billingPeriodEnd: Date;

  @ApiPropertyOptional({
    description: 'Payment due date (defaults to bill_date + 30 days if not provided)',
    example: '2024-03-01',
    type: Date,
  })
  @IsOptional()
  @Type(() => Date)
  @IsDate()
  dueDate?: Date;

  @ApiPropertyOptional({
    description: 'Whether to apply eligible subsidies to the bill',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  applySubsidy?: boolean = true;

  @ApiPropertyOptional({
    description: 'Whether to apply solar export credits to the bill',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  applySolarCredit?: boolean = true;
}

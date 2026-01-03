import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * DTO for slab breakdown in bill calculation
 */
export class SlabBreakdownDto {
  @ApiProperty({
    description: 'Starting unit for this slab',
    example: 0,
  })
  @Expose()
  from: number;

  @ApiProperty({
    description: 'Ending unit for this slab (null means unlimited)',
    example: 60,
    nullable: true,
  })
  @Expose()
  to: number | null;

  @ApiProperty({
    description: 'Number of units in this slab',
    example: 60,
  })
  @Expose()
  units: number;

  @ApiProperty({
    description: 'Rate per unit for this slab',
    example: 7.85,
  })
  @Expose()
  rate: number;

  @ApiProperty({
    description: 'Total amount for this slab',
    example: 471.0,
  })
  @Expose()
  amount: number;
}

/**
 * DTO for tax breakdown in bill calculation
 */
export class TaxBreakdownDto {
  @ApiProperty({
    description: 'Name of the tax',
    example: 'VAT (Value Added Tax)',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 15.0,
  })
  @Expose()
  rate: number;

  @ApiProperty({
    description: 'Calculated tax amount',
    example: 380.4,
  })
  @Expose()
  amount: number;
}

/**
 * DTO for detailed bill calculation breakdown
 * Shows step-by-step how the final bill amount is calculated
 */
export class BillCalculationDto {
  @ApiProperty({
    description: 'Starting meter reading',
    example: 100.0,
  })
  @Expose()
  startReading: number;

  @ApiProperty({
    description: 'Ending meter reading',
    example: 250.0,
  })
  @Expose()
  endReading: number;

  @ApiProperty({
    description: 'Total consumption in units',
    example: 150.0,
  })
  @Expose()
  consumption: number;

  @ApiProperty({
    description: 'Breakdown by tariff slabs',
    type: [SlabBreakdownDto],
  })
  @Expose()
  @Type(() => SlabBreakdownDto)
  slabBreakdown: SlabBreakdownDto[];

  @ApiProperty({
    description: 'Total energy charge from all slabs',
    example: 2436.0,
  })
  @Expose()
  energyCharge: number;

  @ApiProperty({
    description: 'Fixed charge for the billing period',
    example: 100.0,
  })
  @Expose()
  fixedCharge: number;

  @ApiProperty({
    description: 'Subtotal (energy + fixed)',
    example: 2536.0,
  })
  @Expose()
  subtotal: number;

  @ApiProperty({
    description: 'Subsidy amount deducted',
    example: 0.0,
  })
  @Expose()
  subsidy: number;

  @ApiProperty({
    description: 'Solar export credit deducted',
    example: 0.0,
  })
  @Expose()
  solarCredit: number;

  @ApiProperty({
    description: 'Amount before tax (subtotal - subsidy - credit)',
    example: 2536.0,
  })
  @Expose()
  beforeTax: number;

  @ApiProperty({
    description: 'Tax breakdown',
    type: [TaxBreakdownDto],
  })
  @Expose()
  @Type(() => TaxBreakdownDto)
  taxes: TaxBreakdownDto[];

  @ApiProperty({
    description: 'Final total amount payable',
    example: 2979.8,
  })
  @Expose()
  totalAmount: number;
}

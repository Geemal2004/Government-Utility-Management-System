import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * DTO for bill detail (slab breakdown)
 */
export class BillDetailDto {
  @ApiProperty({
    description: 'Slab range description',
    example: '0-60 units',
  })
  @Expose()
  slabRange: string;

  @ApiProperty({
    description: 'Number of units consumed in this slab',
    example: 60,
  })
  @Expose()
  unitsInSlab: number;

  @ApiProperty({
    description: 'Rate per unit for this slab',
    example: 7.85,
  })
  @Expose()
  ratePerUnit: number;

  @ApiProperty({
    description: 'Total amount for units in this slab',
    example: 471.0,
  })
  @Expose()
  amount: number;
}

/**
 * DTO for bill tax breakdown
 */
export class BillTaxDto {
  @ApiProperty({
    description: 'Name of the tax',
    example: 'VAT (Value Added Tax)',
  })
  @Expose()
  taxName: string;

  @ApiProperty({
    description: 'Tax rate percentage',
    example: 15.0,
  })
  @Expose()
  ratePercent: number;

  @ApiProperty({
    description: 'Taxable base amount',
    example: 2536.0,
  })
  @Expose()
  taxableAmount: number;

  @ApiProperty({
    description: 'Calculated tax amount',
    example: 380.4,
  })
  @Expose()
  taxAmount: number;
}

/**
 * DTO for payment summary
 */
export class PaymentSummaryDto {
  @ApiProperty({
    description: 'Payment ID',
    example: 1,
  })
  @Expose()
  paymentId: number;

  @ApiProperty({
    description: 'Payment date',
    example: '2024-02-15T10:30:00Z',
  })
  @Expose()
  @Type(() => Date)
  paymentDate: Date;

  @ApiProperty({
    description: 'Payment amount',
    example: 2979.8,
  })
  @Expose()
  paymentAmount: number;

  @ApiProperty({
    description: 'Payment method',
    example: 'CARD',
  })
  @Expose()
  paymentMethod: string;

  @ApiProperty({
    description: 'Transaction reference number',
    example: 'TXN-20240215-001234',
  })
  @Expose()
  transactionRef: string;
}

/**
 * DTO for bill response with all details
 */
export class BillResponseDto {
  @ApiProperty({
    description: 'Bill ID',
    example: 1,
  })
  @Expose()
  billId: number;

  @ApiProperty({
    description: 'Meter ID',
    example: 1,
  })
  @Expose()
  meterId: number;

  @ApiProperty({
    description: 'Meter serial number',
    example: 'ELEC-001-2024',
  })
  @Expose()
  meterSerialNo: string;

  @ApiProperty({
    description: 'Customer full name',
    example: 'Amal Kumara Perera',
  })
  @Expose()
  customerName: string;

  @ApiPropertyOptional({
    description: 'Customer email address',
    example: 'amal.perera@gmail.com',
  })
  @Expose()
  customerEmail?: string;

  @ApiProperty({
    description: 'Connection address',
    example: '45/2, Gregory Road, Cinnamon Gardens, Colombo 7',
  })
  @Expose()
  connectionAddress: string;

  @ApiProperty({
    description: 'Tariff category name',
    example: 'Residential Standard',
  })
  @Expose()
  tariffCategoryName: string;

  @ApiProperty({
    description: 'Utility type name',
    example: 'Electricity',
  })
  @Expose()
  utilityTypeName: string;

  @ApiProperty({
    description: 'Billing period start date',
    example: '2024-01-01',
  })
  @Expose()
  @Type(() => Date)
  billingPeriodStart: Date;

  @ApiProperty({
    description: 'Billing period end date',
    example: '2024-01-31',
  })
  @Expose()
  @Type(() => Date)
  billingPeriodEnd: Date;

  @ApiProperty({
    description: 'Bill generation date',
    example: '2024-02-01',
  })
  @Expose()
  @Type(() => Date)
  billDate: Date;

  @ApiProperty({
    description: 'Payment due date',
    example: '2024-03-01',
  })
  @Expose()
  @Type(() => Date)
  dueDate: Date;

  @ApiProperty({
    description: 'Total imported units (consumption)',
    example: 150.0,
  })
  @Expose()
  totalImportUnit: number;

  @ApiProperty({
    description: 'Total exported units (solar)',
    example: 0.0,
  })
  @Expose()
  totalExportUnit: number;

  @ApiProperty({
    description: 'Energy charge amount (from tariff slabs)',
    example: 2436.0,
  })
  @Expose()
  energyChargeAmount: number;

  @ApiProperty({
    description: 'Fixed charge amount',
    example: 100.0,
  })
  @Expose()
  fixedChargeAmount: number;

  @ApiProperty({
    description: 'Subsidy amount applied',
    example: 0.0,
  })
  @Expose()
  subsidyAmount: number;

  @ApiProperty({
    description: 'Solar export credit amount',
    example: 0.0,
  })
  @Expose()
  solarExportCredit: number;

  @ApiProperty({
    description: 'Bill detail breakdown by tariff slabs',
    type: [BillDetailDto],
  })
  @Expose()
  @Type(() => BillDetailDto)
  details: BillDetailDto[];

  @ApiProperty({
    description: 'Tax breakdown',
    type: [BillTaxDto],
  })
  @Expose()
  @Type(() => BillTaxDto)
  taxes: BillTaxDto[];

  @ApiProperty({
    description: 'Total amount payable (computed)',
    example: 2979.8,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Total tax amount (computed)',
    example: 443.8,
  })
  @Expose()
  taxAmount: number;

  @ApiProperty({
    description: 'Whether the bill has been fully paid',
    example: false,
  })
  @Expose()
  isPaid: boolean;

  @ApiProperty({
    description: 'Whether the bill is overdue',
    example: false,
  })
  @Expose()
  isOverdue: boolean;

  @ApiPropertyOptional({
    description: 'List of payments made against this bill',
    type: [PaymentSummaryDto],
  })
  @Expose()
  @Type(() => PaymentSummaryDto)
  payments?: PaymentSummaryDto[];
}

import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

/**
 * DTO for bill summary statistics
 */
export class BillSummaryDto {
  @ApiProperty({
    description: 'Total number of bills',
    example: 150,
  })
  @Expose()
  totalBills: number;

  @ApiProperty({
    description: 'Total amount of all bills',
    example: 450000.0,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Total amount paid',
    example: 380000.0,
  })
  @Expose()
  totalPaid: number;

  @ApiProperty({
    description: 'Total outstanding amount',
    example: 70000.0,
  })
  @Expose()
  totalOutstanding: number;

  @ApiProperty({
    description: 'Number of overdue bills',
    example: 25,
  })
  @Expose()
  overdueBills: number;

  @ApiProperty({
    description: 'Total amount of overdue bills',
    example: 45000.0,
  })
  @Expose()
  overdueAmount: number;
}

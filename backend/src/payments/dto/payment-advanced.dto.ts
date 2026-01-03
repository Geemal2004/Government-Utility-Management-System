import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PaymentBreakdownDto } from './payment-summary.dto';

/**
 * DTO for reconciliation discrepancy
 */
export class ReconciliationDiscrepancyDto {
    @ApiProperty({
        description: 'Category (payment method)',
        example: 'CASH',
    })
    @Expose()
    category: string;

    @ApiProperty({
        description: 'Expected amount',
        example: 50000.0,
    })
    @Expose()
    expectedAmount: number;

    @ApiProperty({
        description: 'Actual amount recorded',
        example: 49500.0,
    })
    @Expose()
    actualAmount: number;

    @ApiProperty({
        description: 'Variance (actual - expected)',
        example: -500.0,
    })
    @Expose()
    variance: number;

    @ApiProperty({
        description: 'Variance percentage',
        example: -1.0,
    })
    @Expose()
    variancePercent: number;

    @ApiProperty({
        description: 'Whether variance exceeds threshold',
        example: true,
    })
    @Expose()
    exceedsThreshold: boolean;
}

/**
 * DTO for reconciliation report
 */
export class ReconciliationReportDto {
    @ApiProperty({
        description: 'Reconciliation date',
        example: '2026-01-03',
        type: Date,
    })
    @Expose()
    @Type(() => Date)
    date: Date;

    @ApiProperty({
        description: 'Total expected amount',
        example: 100000.0,
    })
    @Expose()
    expectedTotal: number;

    @ApiProperty({
        description: 'Total actual amount',
        example: 99500.0,
    })
    @Expose()
    actualTotal: number;

    @ApiProperty({
        description: 'Total variance',
        example: -500.0,
    })
    @Expose()
    totalVariance: number;

    @ApiProperty({
        description: 'Total number of payments',
        example: 50,
    })
    @Expose()
    totalPayments: number;

    @ApiProperty({
        description: 'Breakdown by payment method',
        type: [PaymentBreakdownDto],
    })
    @Expose()
    @Type(() => PaymentBreakdownDto)
    byMethod: PaymentBreakdownDto[];

    @ApiProperty({
        description: 'Discrepancies found',
        type: [ReconciliationDiscrepancyDto],
    })
    @Expose()
    @Type(() => ReconciliationDiscrepancyDto)
    discrepancies: ReconciliationDiscrepancyDto[];

    @ApiProperty({
        description: 'Whether reconciliation has variances',
        example: true,
    })
    @Expose()
    hasVariances: boolean;

    @ApiProperty({
        description: 'Reconciliation status',
        example: 'NEEDS_REVIEW',
        enum: ['BALANCED', 'NEEDS_REVIEW', 'DISCREPANCY_FOUND'],
    })
    @Expose()
    status: 'BALANCED' | 'NEEDS_REVIEW' | 'DISCREPANCY_FOUND';
}

/**
 * DTO for payment allocation to a bill
 */
export class PaymentAllocationResultDto {
    @ApiProperty({
        description: 'Bill ID',
        example: 1,
    })
    @Expose()
    billId: number;

    @ApiProperty({
        description: 'Bill outstanding before allocation',
        example: 2500.0,
    })
    @Expose()
    outstandingBefore: number;

    @ApiProperty({
        description: 'Amount allocated to this bill',
        example: 2500.0,
    })
    @Expose()
    allocatedAmount: number;

    @ApiProperty({
        description: 'Bill outstanding after allocation',
        example: 0.0,
    })
    @Expose()
    outstandingAfter: number;

    @ApiProperty({
        description: 'Whether bill is now fully paid',
        example: true,
    })
    @Expose()
    isFullyPaid: boolean;
}

/**
 * DTO for multi-bill payment allocation result
 */
export class AllocationResultDto {
    @ApiProperty({
        description: 'Total payment amount',
        example: 5000.0,
    })
    @Expose()
    totalPaymentAmount: number;

    @ApiProperty({
        description: 'Total amount allocated',
        example: 4500.0,
    })
    @Expose()
    totalAllocated: number;

    @ApiProperty({
        description: 'Excess amount (if any)',
        example: 500.0,
    })
    @Expose()
    excessAmount: number;

    @ApiProperty({
        description: 'Allocation breakdown per bill',
        type: [PaymentAllocationResultDto],
    })
    @Expose()
    @Type(() => PaymentAllocationResultDto)
    allocations: PaymentAllocationResultDto[];

    @ApiProperty({
        description: 'Payment IDs created',
        type: [Number],
        example: [1, 2, 3],
    })
    @Expose()
    paymentIds: number[];
}

/**
 * DTO for overpayment record
 */
export class OverpaymentDto {
    @ApiProperty({
        description: 'Payment ID',
        example: 1,
    })
    @Expose()
    paymentId: number;

    @ApiProperty({
        description: 'Bill ID',
        example: 1,
    })
    @Expose()
    billId: number;

    @ApiProperty({
        description: 'Customer ID',
        example: 1,
    })
    @Expose()
    customerId: number | null;

    @ApiProperty({
        description: 'Customer name',
        example: 'Amal Kumara Perera',
    })
    @Expose()
    customerName: string;

    @ApiProperty({
        description: 'Bill total amount',
        example: 2000.0,
    })
    @Expose()
    billAmount: number;

    @ApiProperty({
        description: 'Total paid amount',
        example: 2500.0,
    })
    @Expose()
    totalPaid: number;

    @ApiProperty({
        description: 'Overpayment amount',
        example: 500.0,
    })
    @Expose()
    overpaymentAmount: number;

    @ApiProperty({
        description: 'Payment date',
        example: '2026-01-03T10:30:00Z',
        type: Date,
    })
    @Expose()
    @Type(() => Date)
    paymentDate: Date;
}

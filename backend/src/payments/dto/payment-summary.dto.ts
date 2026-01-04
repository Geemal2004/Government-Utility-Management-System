import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

/**
 * DTO for payment breakdown by category (method or channel)
 */
export class PaymentBreakdownDto {
    @ApiProperty({
        description: 'Category name (payment method or channel)',
        example: 'CASH',
    })
    @Expose()
    category: string;

    @ApiProperty({
        description: 'Number of payments in this category',
        example: 25,
    })
    @Expose()
    count: number;

    @ApiProperty({
        description: 'Total amount in this category',
        example: 50000.0,
    })
    @Expose()
    amount: number;
}

/**
 * DTO for payment period
 */
export class PaymentPeriodDto {
    @ApiProperty({
        description: 'Period start date',
        example: '2026-01-01',
        type: Date,
    })
    @Expose()
    @Type(() => Date)
    start: Date;

    @ApiProperty({
        description: 'Period end date',
        example: '2026-01-31',
        type: Date,
    })
    @Expose()
    @Type(() => Date)
    end: Date;
}

/**
 * DTO for payment summary/statistics
 */
export class PaymentSummaryDto {
    @ApiProperty({
        description: 'Total number of payments',
        example: 50,
    })
    @Expose()
    totalPayments: number;

    @ApiProperty({
        description: 'Total amount collected',
        example: 125000.0,
    })
    @Expose()
    totalAmount: number;

    @ApiProperty({
        description: 'Breakdown by payment method',
        type: [PaymentBreakdownDto],
        example: [
            { category: 'CASH', count: 25, amount: 50000 },
            { category: 'CARD', count: 15, amount: 45000 },
            { category: 'MOBILE_MONEY', count: 10, amount: 30000 },
        ],
    })
    @Expose()
    @Type(() => PaymentBreakdownDto)
    byMethod: PaymentBreakdownDto[];

    @ApiProperty({
        description: 'Breakdown by payment channel',
        type: [PaymentBreakdownDto],
        example: [
            { category: 'OFFICE', count: 30, amount: 75000 },
            { category: 'MOBILE_APP', count: 20, amount: 50000 },
        ],
    })
    @Expose()
    @Type(() => PaymentBreakdownDto)
    byChannel: PaymentBreakdownDto[];

    @ApiProperty({
        description: 'Breakdown by payment status',
        type: [PaymentBreakdownDto],
        example: [
            { category: 'COMPLETED', count: 45, amount: 120000 },
            { category: 'PENDING', count: 3, amount: 3000 },
            { category: 'FAILED', count: 2, amount: 2000 },
        ],
    })
    @Expose()
    @Type(() => PaymentBreakdownDto)
    byStatus: PaymentBreakdownDto[];

    @ApiProperty({
        description: 'Stripe payment success rate (percentage)',
        example: 95.5,
    })
    @Expose()
    stripeSuccessRate: number;

    @ApiProperty({
        description: 'Count of failed payments',
        example: 2,
    })
    @Expose()
    failedCount: number;

    @ApiProperty({
        description: 'Total amount refunded',
        example: 5000.0,
    })
    @Expose()
    refundedAmount: number;

    @ApiProperty({
        description: 'Summary period',
        type: PaymentPeriodDto,
    })
    @Expose()
    @Type(() => PaymentPeriodDto)
    period: PaymentPeriodDto;
}

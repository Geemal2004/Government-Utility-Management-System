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
        description: 'Summary period',
        type: PaymentPeriodDto,
    })
    @Expose()
    @Type(() => PaymentPeriodDto)
    period: PaymentPeriodDto;
}

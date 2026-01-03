import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PaymentResponseDto } from './payment-response.dto';
import { PaymentBreakdownDto } from './payment-summary.dto';

/**
 * DTO for daily collection report (cashier end-of-day report)
 */
export class DailyCollectionReportDto {
    @ApiProperty({
        description: 'Report date',
        example: '2026-01-03',
        type: Date,
    })
    @Expose()
    @Type(() => Date)
    date: Date;

    @ApiProperty({
        description: 'Name of the cashier/employee',
        example: 'Sunil Fernando',
    })
    @Expose()
    cashierName: string;

    @ApiProperty({
        description: 'Cashier/Employee ID',
        example: 5,
    })
    @Expose()
    cashierId: number;

    @ApiProperty({
        description: 'Opening balance (cash on hand at start of day)',
        example: 5000.0,
    })
    @Expose()
    openingBalance: number;

    @ApiProperty({
        description: 'Total amount collected during the day',
        example: 75000.0,
    })
    @Expose()
    totalCollected: number;

    @ApiProperty({
        description: 'Collection breakdown by payment method',
        type: [PaymentBreakdownDto],
        example: [
            { category: 'CASH', count: 20, amount: 45000 },
            { category: 'CARD', count: 10, amount: 25000 },
            { category: 'CHEQUE', count: 2, amount: 5000 },
        ],
    })
    @Expose()
    @Type(() => PaymentBreakdownDto)
    byMethod: PaymentBreakdownDto[];

    @ApiProperty({
        description: 'List of all payments collected',
        type: [PaymentResponseDto],
    })
    @Expose()
    @Type(() => PaymentResponseDto)
    paymentsList: PaymentResponseDto[];

    @ApiProperty({
        description: 'Closing balance (opening + cash collections)',
        example: 50000.0,
    })
    @Expose()
    closingBalance: number;

    @ApiProperty({
        description: 'Total number of transactions',
        example: 32,
    })
    @Expose()
    totalTransactions: number;

    @ApiProperty({
        description: 'Cash amount collected',
        example: 45000.0,
    })
    @Expose()
    cashCollected: number;

    @ApiProperty({
        description: 'Non-cash amount collected (cards, transfers, etc.)',
        example: 30000.0,
    })
    @Expose()
    nonCashCollected: number;
}

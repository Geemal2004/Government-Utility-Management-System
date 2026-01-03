import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { PaymentMethod, PaymentChannel } from '../../database/entities/payment.entity';

/**
 * DTO for bill details in payment response
 */
export class PaymentBillDetailsDto {
    @ApiProperty({
        description: 'Billing period description',
        example: '2025-12-01 to 2025-12-31',
    })
    @Expose()
    period: string;

    @ApiProperty({
        description: 'Type of utility',
        example: 'Electricity',
    })
    @Expose()
    utilityType: string;

    @ApiProperty({
        description: 'Meter serial number',
        example: 'ELEC-001-2024',
    })
    @Expose()
    meterSerialNo: string;
}

/**
 * DTO for payment response with all details
 */
export class PaymentResponseDto {
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
        description: 'Customer ID (snapshot)',
        example: 1,
    })
    @Expose()
    customerId: number | null;

    @ApiProperty({
        description: 'Employee ID who recorded the payment',
        example: 5,
    })
    @Expose()
    employeeId: number | null;

    @ApiProperty({
        description: 'Date and time of payment',
        example: '2026-01-03T10:30:00Z',
        type: Date,
    })
    @Expose()
    @Type(() => Date)
    paymentDate: Date;

    @ApiProperty({
        description: 'Payment amount',
        example: 1500.0,
    })
    @Expose()
    paymentAmount: number;

    @ApiProperty({
        description: 'Payment method used',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    })
    @Expose()
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Payment channel',
        enum: PaymentChannel,
        example: PaymentChannel.OFFICE,
    })
    @Expose()
    paymentChannel: PaymentChannel | null;

    @ApiPropertyOptional({
        description: 'External transaction reference',
        example: 'TXN-20260103-123456',
    })
    @Expose()
    transactionRef: string | null;

    @ApiPropertyOptional({
        description: 'Notes about the payment',
        example: 'Customer reference: Monthly bill payment',
    })
    @Expose()
    notes: string | null;

    // ─────────────────────────────────────────────────────────────────────────────
    // Computed and Related Fields
    // ─────────────────────────────────────────────────────────────────────────────

    @ApiProperty({
        description: 'Bill number/reference',
        example: 'BILL-2025-00001',
    })
    @Expose()
    billNumber: string;

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
    customerEmail: string | null;

    @ApiProperty({
        description: 'Total bill amount',
        example: 2500.0,
    })
    @Expose()
    billAmount: number;

    @ApiProperty({
        description: 'Outstanding amount before this payment',
        example: 2500.0,
    })
    @Expose()
    billOutstanding: number;

    @ApiProperty({
        description: 'New outstanding amount after this payment',
        example: 1000.0,
    })
    @Expose()
    newOutstanding: number;

    @ApiProperty({
        description: 'Generated receipt number',
        example: 'RCP-2026-00001',
    })
    @Expose()
    receiptNumber: string;

    @ApiPropertyOptional({
        description: 'Name of employee who recorded the payment',
        example: 'Sunil Fernando',
    })
    @Expose()
    recordedByName: string | null;

    @ApiProperty({
        description: 'Bill details',
        type: PaymentBillDetailsDto,
    })
    @Expose()
    @Type(() => PaymentBillDetailsDto)
    billDetails: PaymentBillDetailsDto;
}

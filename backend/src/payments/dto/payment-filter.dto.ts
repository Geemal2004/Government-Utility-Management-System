import {
    IsOptional,
    IsNumber,
    IsString,
    IsDate,
    IsEnum,
    IsInt,
    Min,
    Max,
    IsIn,
    MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentChannel } from '../../database/entities/payment.entity';

/**
 * DTO for filtering and paginating payment queries
 */
export class PaymentFilterDto {
    @ApiPropertyOptional({
        description: 'Filter by bill ID',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    billId?: number;

    @ApiPropertyOptional({
        description: 'Filter by customer ID',
        example: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    customerId?: number;

    @ApiPropertyOptional({
        description: 'Filter by employee ID (for cashier reports)',
        example: 5,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(1)
    employeeId?: number;

    @ApiPropertyOptional({
        description: 'Filter by payment method',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    })
    @IsOptional()
    @IsEnum(PaymentMethod, {
        message: `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
    })
    paymentMethod?: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Filter by payment channel',
        enum: PaymentChannel,
        example: PaymentChannel.OFFICE,
    })
    @IsOptional()
    @IsEnum(PaymentChannel, {
        message: `Payment channel must be one of: ${Object.values(PaymentChannel).join(', ')}`,
    })
    paymentChannel?: PaymentChannel;

    @ApiPropertyOptional({
        description: 'Filter payments on or after this date',
        example: '2026-01-01',
        type: Date,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    startDate?: Date;

    @ApiPropertyOptional({
        description: 'Filter payments on or before this date',
        example: '2026-01-31',
        type: Date,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate()
    endDate?: Date;

    @ApiPropertyOptional({
        description: 'Filter payments with amount >= this value',
        example: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    minAmount?: number;

    @ApiPropertyOptional({
        description: 'Filter payments with amount <= this value',
        example: 10000,
    })
    @IsOptional()
    @Type(() => Number)
    @IsNumber()
    @Min(0)
    maxAmount?: number;

    @ApiPropertyOptional({
        description: 'Filter by transaction reference (partial match)',
        example: 'TXN-2026',
        maxLength: 120,
    })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    transactionRef?: string;

    // ─────────────────────────────────────────────────────────────────────────────
    // Pagination
    // ─────────────────────────────────────────────────────────────────────────────

    @ApiPropertyOptional({
        description: 'Page number (1-based)',
        default: 1,
        minimum: 1,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    @ApiPropertyOptional({
        description: 'Number of items per page',
        default: 10,
        minimum: 1,
        maximum: 100,
    })
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @ApiPropertyOptional({
        description: 'Field to sort by',
        default: 'paymentDate',
        example: 'paymentDate',
    })
    @IsOptional()
    @IsString()
    sortBy?: string = 'paymentDate';

    @ApiPropertyOptional({
        description: 'Sort order',
        enum: ['ASC', 'DESC'],
        default: 'DESC',
    })
    @IsOptional()
    @IsIn(['ASC', 'DESC'])
    order?: 'ASC' | 'DESC' = 'DESC';
}

import {
    IsOptional,
    IsString,
    IsDate,
    MaxLength,
    Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotFutureDateConstraint } from './create-payment.dto';

/**
 * DTO for updating an existing payment
 * Only allows updating specific fields for corrections
 */
export class UpdatePaymentDto {
    @ApiPropertyOptional({
        description: 'Updated transaction reference for reconciliation',
        example: 'TXN-20260103-123456-CORRECTED',
        maxLength: 120,
    })
    @IsOptional()
    @IsString({ message: 'Transaction reference must be a string' })
    @MaxLength(120, { message: 'Transaction reference cannot exceed 120 characters' })
    transactionRef?: string;

    @ApiPropertyOptional({
        description: 'Updated notes about the payment',
        example: 'Corrected reference number per bank statement',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
    notes?: string;

    @ApiPropertyOptional({
        description: 'Corrected payment date. Cannot be in the future',
        example: '2026-01-02T14:30:00Z',
        type: Date,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'Payment date must be a valid date' })
    @Validate(IsNotFutureDateConstraint)
    paymentDate?: Date;
}

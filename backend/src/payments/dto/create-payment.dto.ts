import {
    IsNotEmpty,
    IsNumber,
    IsEnum,
    IsOptional,
    IsString,
    IsDate,
    Min,
    MaxLength,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    Validate,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentChannel, PAYMENT_METHODS_REQUIRING_REF } from '../../database/entities/payment.entity';

/**
 * Custom validator: Ensures transaction reference is provided for electronic payments
 */
@ValidatorConstraint({ name: 'transactionRefRequiredForMethod', async: false })
export class TransactionRefRequiredForMethodConstraint implements ValidatorConstraintInterface {
    validate(_value: string | undefined, args: ValidationArguments): boolean {
        const dto = args.object as CreatePaymentDto;
        const requiresRef = PAYMENT_METHODS_REQUIRING_REF.includes(dto.paymentMethod);

        if (requiresRef) {
            return dto.transactionRef !== undefined && dto.transactionRef.trim().length > 0;
        }
        return true;
    }

    defaultMessage(args: ValidationArguments): string {
        const dto = args.object as CreatePaymentDto;
        return `Transaction reference is required for ${dto.paymentMethod} payments`;
    }
}

/**
 * Custom validator: Ensures payment date is not in the future
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
    validate(value: Date | undefined): boolean {
        if (!value) {
            return true; // Optional field, let other validators handle required check
        }
        const paymentDate = new Date(value);
        const now = new Date();
        return paymentDate <= now;
    }

    defaultMessage(): string {
        return 'Payment date cannot be in the future';
    }
}

/**
 * DTO for creating a new payment
 */
export class CreatePaymentDto {
    @ApiProperty({
        description: 'ID of the bill this payment is for',
        example: 1,
    })
    @IsNotEmpty({ message: 'Bill ID is required' })
    @IsNumber({}, { message: 'Bill ID must be a number' })
    @Min(1, { message: 'Bill ID must be a positive number' })
    billId: number;

    @ApiProperty({
        description: 'Payment amount in the local currency',
        example: 1500.0,
        minimum: 0.01,
    })
    @IsNotEmpty({ message: 'Payment amount is required' })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Payment amount must be a valid decimal number with at most 2 decimal places' })
    @Min(0.01, { message: 'Payment amount must be greater than 0' })
    paymentAmount: number;

    @ApiProperty({
        description: 'Method of payment',
        enum: PaymentMethod,
        example: PaymentMethod.CASH,
    })
    @IsNotEmpty({ message: 'Payment method is required' })
    @IsEnum(PaymentMethod, {
        message: `Payment method must be one of: ${Object.values(PaymentMethod).join(', ')}`,
    })
    paymentMethod: PaymentMethod;

    @ApiPropertyOptional({
        description: 'Channel through which payment was received',
        enum: PaymentChannel,
        example: PaymentChannel.OFFICE,
    })
    @IsOptional()
    @IsEnum(PaymentChannel, {
        message: `Payment channel must be one of: ${Object.values(PaymentChannel).join(', ')}`,
    })
    paymentChannel?: PaymentChannel;

    @ApiPropertyOptional({
        description: 'External transaction reference. Required for ONLINE, BANK_TRANSFER, MOBILE_MONEY payments',
        example: 'TXN-20260103-123456',
        maxLength: 120,
    })
    @IsOptional()
    @IsString({ message: 'Transaction reference must be a string' })
    @MaxLength(120, { message: 'Transaction reference cannot exceed 120 characters' })
    @Validate(TransactionRefRequiredForMethodConstraint)
    transactionRef?: string;

    @ApiPropertyOptional({
        description: 'Date and time of payment. Defaults to current time if not provided',
        example: '2026-01-03T10:30:00Z',
        type: Date,
    })
    @IsOptional()
    @Type(() => Date)
    @IsDate({ message: 'Payment date must be a valid date' })
    @Validate(IsNotFutureDateConstraint)
    paymentDate?: Date;

    @ApiPropertyOptional({
        description: 'Additional notes about the payment',
        example: 'Customer reference: Monthly bill payment',
        maxLength: 500,
    })
    @IsOptional()
    @IsString({ message: 'Notes must be a string' })
    @MaxLength(500, { message: 'Notes cannot exceed 500 characters' })
    notes?: string;
}

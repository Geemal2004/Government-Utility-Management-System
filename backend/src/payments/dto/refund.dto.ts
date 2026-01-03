import {
    IsNotEmpty,
    IsNumber,
    IsString,
    IsEnum,
    IsOptional,
    Min,
    MaxLength,
    ValidateNested,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';

/**
 * Refund method enum
 */
export enum RefundMethod {
    CASH = 'CASH',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

/**
 * DTO for bank details (for bank transfer refunds)
 */
export class BankDetailsDto {
    @ApiProperty({ description: 'Bank name', example: 'Bank of Ceylon' })
    @IsString()
    @IsNotEmpty()
    bankName: string;

    @ApiProperty({ description: 'Account number', example: '1234567890' })
    @IsString()
    @IsNotEmpty()
    accountNumber: string;

    @ApiPropertyOptional({ description: 'Branch name', example: 'Colombo Fort' })
    @IsOptional()
    @IsString()
    branchName?: string;

    @ApiPropertyOptional({ description: 'Account holder name', example: 'John Doe' })
    @IsOptional()
    @IsString()
    accountHolderName?: string;
}

/**
 * DTO for processing payment refunds
 */
export class RefundDto {
    @ApiProperty({
        description: 'ID of the payment to refund',
        example: 1,
    })
    @IsNotEmpty({ message: 'Payment ID is required' })
    @IsNumber({}, { message: 'Payment ID must be a number' })
    @Min(1, { message: 'Payment ID must be a positive number' })
    paymentId: number;

    @ApiProperty({
        description: 'Amount to refund. Must be positive and <= original payment amount',
        example: 500.0,
    })
    @IsNotEmpty({ message: 'Refund amount is required' })
    @IsNumber({ maxDecimalPlaces: 2 }, { message: 'Refund amount must be a valid decimal number with at most 2 decimal places' })
    @Min(0.01, { message: 'Refund amount must be greater than 0' })
    refundAmount: number;

    @ApiProperty({
        description: 'Reason for the refund',
        example: 'Duplicate payment by customer',
        maxLength: 500,
    })
    @IsNotEmpty({ message: 'Refund reason is required' })
    @IsString({ message: 'Refund reason must be a string' })
    @MaxLength(500, { message: 'Refund reason cannot exceed 500 characters' })
    refundReason: string;

    @ApiProperty({
        description: 'Method for processing the refund',
        enum: RefundMethod,
        example: RefundMethod.CASH,
    })
    @IsNotEmpty({ message: 'Refund method is required' })
    @IsEnum(RefundMethod, {
        message: `Refund method must be one of: ${Object.values(RefundMethod).join(', ')}`,
    })
    refundMethod: RefundMethod;

    @ApiPropertyOptional({
        description: 'Additional notes for the refund',
        example: 'Customer requested refund via phone',
        maxLength: 500,
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;

    @ApiPropertyOptional({
        description: 'Bank details for bank transfer refunds',
        type: BankDetailsDto,
    })
    @IsOptional()
    @ValidateNested()
    @Type(() => BankDetailsDto)
    bankDetails?: BankDetailsDto;
}

/**
 * DTO for refund response
 */
export class RefundResponseDto {
    @ApiProperty({
        description: 'Refund ID',
        example: 1,
    })
    refundId: number;

    @ApiProperty({
        description: 'Original payment ID',
        example: 123,
    })
    paymentId: number;

    @ApiProperty({
        description: 'Refund amount',
        example: 500.0,
    })
    refundAmount: number;

    @ApiProperty({
        description: 'Refund reason',
        example: 'Duplicate payment by customer',
    })
    refundReason: string;

    @ApiProperty({
        description: 'Refund method',
        enum: RefundMethod,
        example: RefundMethod.CASH,
    })
    refundMethod: RefundMethod;

    @ApiProperty({
        description: 'Date and time of refund',
        example: '2026-01-03T15:30:00Z',
        type: Date,
    })
    refundDate: Date;

    @ApiProperty({
        description: 'Employee who processed the refund',
        example: 'Sunil Fernando',
    })
    processedBy: string;

    @ApiProperty({
        description: 'Refund reference number',
        example: 'REF-2026-00001',
    })
    refundReference: string;
}

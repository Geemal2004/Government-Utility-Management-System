import {
    IsArray,
    IsNotEmpty,
    IsNumber,
    IsString,
    IsUrl,
    IsEnum,
    IsOptional,
    IsBoolean,
    IsDate,
    ArrayMinSize,
    Min,
    MaxLength,
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
    Validate,
    registerDecorator,
    ValidationOptions,
} from 'class-validator';
import { Type, Transform } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PaymentMethod, PaymentChannel, PaymentStatus } from '../../database/entities/payment.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Enums for Stripe Payments
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Online payment methods (Stripe-based)
 */
export enum OnlinePaymentMethod {
    STRIPE = 'STRIPE',
}

/**
 * Cashier payment methods (office counter)
 */
export enum CashierPaymentMethod {
    CASH = 'CASH',
    CARD_TERMINAL = 'CARD_TERMINAL',
    CHEQUE = 'CHEQUE',
    BANK_TRANSFER = 'BANK_TRANSFER',
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Validators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Validator: Transaction reference required for non-cash payments
 */
@ValidatorConstraint({ name: 'requiresTransactionRefForNonCash', async: false })
export class RequiresTransactionRefForNonCashConstraint implements ValidatorConstraintInterface {
    validate(_value: string | undefined, args: ValidationArguments): boolean {
        const dto = args.object as CreateCashierPaymentDto;

        // Cash payments don't require transaction ref
        if (dto.paymentMethod === CashierPaymentMethod.CASH) {
            return true;
        }

        // Other methods require transaction ref
        return dto.transactionRef !== undefined && dto.transactionRef.trim().length > 0;
    }

    defaultMessage(args: ValidationArguments): string {
        const dto = args.object as CreateCashierPaymentDto;
        return `Transaction reference is required for ${dto.paymentMethod} payments`;
    }
}

/**
 * Decorator for conditional transaction ref validation
 */
function RequiresTransactionRefForNonCash(validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'requiresTransactionRefForNonCash',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: RequiresTransactionRefForNonCashConstraint,
        });
    };
}

// ─────────────────────────────────────────────────────────────────────────────
// 1. CreateOnlinePaymentDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for initiating online payment by customer
 */
export class CreateOnlinePaymentDto {
    @ApiProperty({
        description: 'Array of bill IDs to pay (supports multi-bill payment)',
        example: [1, 2, 3],
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one bill must be selected' })
    @IsNumber({}, { each: true })
    billIds: number[];

    @ApiProperty({
        description: 'Payment method for online payment',
        enum: OnlinePaymentMethod,
        example: OnlinePaymentMethod.STRIPE,
    })
    @IsEnum(OnlinePaymentMethod)
    @IsNotEmpty()
    paymentMethod: OnlinePaymentMethod;

    @ApiProperty({
        description: 'URL to redirect after payment completion',
        example: 'https://example.com/payments/complete',
    })
    @IsUrl({}, { message: 'Return URL must be a valid URL' })
    @IsNotEmpty()
    returnUrl: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 2. CreateCheckoutSessionDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for creating Stripe Checkout session
 */
export class CreateCheckoutSessionDto {
    @ApiProperty({
        description: 'Array of bill IDs for checkout',
        example: [1, 2],
        type: [Number],
    })
    @IsArray()
    @ArrayMinSize(1, { message: 'At least one bill must be selected' })
    @IsNumber({}, { each: true })
    billIds: number[];

    @ApiProperty({
        description: 'URL to redirect on successful payment',
        example: 'https://example.com/payments/success',
    })
    @IsUrl()
    @IsNotEmpty()
    successUrl: string;

    @ApiProperty({
        description: 'URL to redirect if payment is cancelled',
        example: 'https://example.com/payments/cancel',
    })
    @IsUrl()
    @IsNotEmpty()
    cancelUrl: string;
}

/**
 * Response DTO for Checkout Session creation
 */
export class CheckoutSessionResponseDto {
    @ApiProperty({ description: 'Stripe Checkout session ID' })
    sessionId: string;

    @ApiProperty({ description: 'URL to redirect customer for payment' })
    sessionUrl: string;

    @ApiProperty({ description: 'Session expiration time' })
    expiresAt: Date;

    @ApiProperty({ description: 'Total amount to be charged' })
    totalAmount: number;

    @ApiProperty({ description: 'Currency code' })
    currency: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 3. CreateCashierPaymentDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for recording payment by cashier at office
 */
export class CreateCashierPaymentDto {
    @ApiProperty({
        description: 'Bill ID to apply payment to',
        example: 123,
    })
    @IsNumber()
    @IsNotEmpty()
    billId: number;

    @ApiProperty({
        description: 'Customer ID making payment',
        example: 456,
    })
    @IsNumber()
    @IsNotEmpty()
    customerId: number;

    @ApiProperty({
        description: 'Payment amount',
        example: 1500.00,
    })
    @IsNumber()
    @Min(0.01, { message: 'Payment amount must be at least 0.01' })
    @IsNotEmpty()
    paymentAmount: number;

    @ApiProperty({
        description: 'Payment method',
        enum: CashierPaymentMethod,
        example: CashierPaymentMethod.CASH,
    })
    @IsEnum(CashierPaymentMethod)
    @IsNotEmpty()
    paymentMethod: CashierPaymentMethod;

    @ApiPropertyOptional({
        description: 'Transaction reference (required for non-cash payments)',
        example: 'TXN-123456',
    })
    @IsOptional()
    @IsString()
    @MaxLength(120)
    @RequiresTransactionRefForNonCash()
    transactionRef?: string;

    @ApiPropertyOptional({
        description: 'Additional notes',
        example: 'Payment received in person',
    })
    @IsOptional()
    @IsString()
    @MaxLength(500)
    notes?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// 4. ConfirmStripePaymentDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for confirming Stripe payment (from webhook)
 */
export class ConfirmStripePaymentDto {
    @ApiProperty({
        description: 'Stripe Payment Intent ID',
        example: 'pi_xxx',
    })
    @IsString()
    @IsNotEmpty()
    paymentIntentId: string;

    @ApiProperty({
        description: 'Stripe Charge ID',
        example: 'ch_xxx',
    })
    @IsString()
    @IsNotEmpty()
    stripeChargeId: string;

    @ApiProperty({
        description: 'Amount in smallest currency unit (cents)',
        example: 150000,
    })
    @IsNumber()
    @IsNotEmpty()
    amount: number;

    @ApiProperty({
        description: 'Currency code',
        example: 'lkr',
    })
    @IsString()
    @IsNotEmpty()
    currency: string;

    @ApiProperty({
        description: 'Payment method type from Stripe',
        example: 'card',
    })
    @IsString()
    @IsNotEmpty()
    paymentMethodType: string;

    @ApiProperty({
        description: 'Metadata from Stripe payment',
        example: { billIds: '1,2,3', customerId: '456' },
    })
    @IsOptional()
    metadata?: Record<string, string>;
}

// ─────────────────────────────────────────────────────────────────────────────
// 5. StripePaymentResponseDto (Updated)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Comprehensive Stripe Payment Response DTO
 */
export class StripePaymentResponseDto {
    @ApiProperty({ description: 'Payment ID' })
    paymentId: number;

    @ApiProperty({ description: 'Bill ID' })
    billId: number;

    @ApiProperty({ description: 'Customer ID', nullable: true })
    customerId: number | null;

    @ApiProperty({ description: 'Employee ID who recorded payment', nullable: true })
    employeeId: number | null;

    @ApiProperty({ description: 'Payment date and time' })
    paymentDate: Date;

    @ApiProperty({ description: 'Payment amount' })
    paymentAmount: number;

    @ApiProperty({ description: 'Payment method', enum: PaymentMethod })
    paymentMethod: PaymentMethod;

    @ApiProperty({ description: 'Payment channel', enum: PaymentChannel })
    paymentChannel: PaymentChannel;

    @ApiProperty({ description: 'Payment status', enum: PaymentStatus })
    paymentStatus: PaymentStatus;

    @ApiProperty({ description: 'Transaction reference', nullable: true })
    transactionRef: string | null;

    // Stripe fields
    @ApiPropertyOptional({ description: 'Stripe Payment Intent ID' })
    stripePaymentIntentId?: string | null;

    @ApiPropertyOptional({ description: 'Stripe Charge ID' })
    stripeChargeId?: string | null;

    // Related data
    @ApiProperty({ description: 'Bill number' })
    billNumber: string;

    @ApiProperty({ description: 'Customer name' })
    customerName: string;

    @ApiProperty({ description: 'Customer email', nullable: true })
    customerEmail: string | null;

    @ApiProperty({ description: 'Total bill amount' })
    billAmount: number;

    @ApiProperty({ description: 'Outstanding amount after payment' })
    outstanding: number;

    @ApiProperty({ description: 'Formatted receipt number' })
    receiptNumber: string;

    @ApiPropertyOptional({ description: 'Name of employee who recorded payment' })
    recordedByName?: string;

    // URLs (for pending Stripe payments)
    @ApiPropertyOptional({ description: 'Stripe payment URL for pending payments' })
    stripePaymentUrl?: string;

    // Computed fields
    @ApiProperty({ description: 'Whether payment can be refunded' })
    canRefund: boolean;

    @ApiProperty({ description: 'Whether this is a partial payment' })
    isPartialPayment: boolean;

    @ApiProperty({ description: 'Whether this was an overpayment' })
    isOverpayment: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// 6. CustomerBillPaymentDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for customer view of payable bills
 */
export class CustomerBillPaymentDto {
    @ApiProperty({ description: 'Bill ID' })
    billId: number;

    @ApiProperty({ description: 'Bill number' })
    billNumber: string;

    @ApiProperty({ description: 'Bill date' })
    billDate: Date;

    @ApiProperty({ description: 'Due date' })
    dueDate: Date;

    @ApiProperty({ description: 'Total bill amount' })
    amount: number;

    @ApiProperty({ description: 'Outstanding amount' })
    outstanding: number;

    @ApiProperty({ description: 'Whether bill is overdue' })
    isOverdue: boolean;

    @ApiPropertyOptional({ description: 'Days overdue (if applicable)' })
    daysOverdue?: number;

    @ApiProperty({ description: 'Meter serial number' })
    meterSerialNo: string;

    @ApiProperty({ description: 'Utility type' })
    utilityType: string;

    @ApiProperty({ description: 'Billing period' })
    billingPeriod: string;

    @ApiProperty({ description: 'Whether bill is selected for payment', default: false })
    selected: boolean;
}

/**
 * Response DTO for customer bills list
 */
export class CustomerBillsResponseDto {
    @ApiProperty({ description: 'Customer ID' })
    customerId: number;

    @ApiProperty({ description: 'Customer name' })
    customerName: string;

    @ApiProperty({ description: 'Customer email' })
    customerEmail: string;

    @ApiProperty({ description: 'Total outstanding amount' })
    totalOutstanding: number;

    @ApiProperty({ description: 'Number of unpaid bills' })
    unpaidBillCount: number;

    @ApiProperty({ description: 'Number of overdue bills' })
    overdueBillCount: number;

    @ApiProperty({ description: 'List of payable bills', type: [CustomerBillPaymentDto] })
    @Type(() => CustomerBillPaymentDto)
    bills: CustomerBillPaymentDto[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 7. PaymentIntentResponseDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Response DTO for Payment Intent creation
 */
export class PaymentIntentResponseDto {
    @ApiProperty({ description: 'Stripe Payment Intent ID' })
    paymentIntentId: string;

    @ApiProperty({ description: 'Client secret for Stripe.js' })
    clientSecret: string;

    @ApiProperty({ description: 'Amount in standard currency unit' })
    amount: number;

    @ApiProperty({ description: 'Currency code' })
    currency: string;

    @ApiProperty({ description: 'Payment Intent status' })
    status: string;

    @ApiProperty({ description: 'Stripe publishable key for frontend' })
    publicKey: string;

    @ApiProperty({ description: 'List of bill IDs included' })
    billIds: number[];
}

// ─────────────────────────────────────────────────────────────────────────────
// 8. StripeWebhookEventDto
// ─────────────────────────────────────────────────────────────────────────────

/**
 * DTO for processing Stripe webhook events
 */
export class StripeWebhookEventDto {
    @ApiProperty({ description: 'Stripe event ID' })
    eventId: string;

    @ApiProperty({ description: 'Event type (e.g., payment_intent.succeeded)' })
    eventType: string;

    @ApiPropertyOptional({ description: 'Payment Intent ID' })
    paymentIntentId?: string;

    @ApiPropertyOptional({ description: 'Checkout Session ID' })
    checkoutSessionId?: string;

    @ApiProperty({ description: 'Payment status' })
    status: string;

    @ApiProperty({ description: 'Amount in smallest currency unit' })
    amount: number;

    @ApiProperty({ description: 'Currency code' })
    currency: string;

    @ApiPropertyOptional({ description: 'Charge ID' })
    chargeId?: string;

    @ApiPropertyOptional({ description: 'Metadata from payment' })
    metadata?: Record<string, string>;
}

/**
 * Supported Stripe webhook event types
 */
export enum StripeWebhookEventType {
    PAYMENT_INTENT_SUCCEEDED = 'payment_intent.succeeded',
    PAYMENT_INTENT_FAILED = 'payment_intent.payment_failed',
    CHECKOUT_SESSION_COMPLETED = 'checkout.session.completed',
    CHECKOUT_SESSION_EXPIRED = 'checkout.session.expired',
    CHARGE_REFUNDED = 'charge.refunded',
}

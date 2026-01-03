import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  Index,
  BeforeInsert,
  BeforeUpdate,
} from 'typeorm';
import {
  IsNotEmpty,
  IsNumber,
  IsDate,
  IsEnum,
  IsOptional,
  MaxLength,
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
  Validate,
  registerDecorator,
  ValidationOptions,
} from 'class-validator';
import { Bill } from './bill.entity';
import { Employee } from './employee.entity';
import { Customer } from './customer.entity';

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method Enum
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payment method enum
 * Defines accepted payment methods for both online and offline payments
 */
export enum PaymentMethod {
  // Online payments (Stripe)
  STRIPE_CARD = 'STRIPE_CARD',           // Online card payment via Stripe
  STRIPE_WALLET = 'STRIPE_WALLET',       // Apple Pay, Google Pay via Stripe

  // Offline payments (Office/Cashier)
  CASH = 'CASH',                         // Cash payment at office
  CARD_TERMINAL = 'CARD_TERMINAL',       // Physical card terminal at office
  BANK_TRANSFER = 'BANK_TRANSFER',       // Bank transfer
  CHEQUE = 'CHEQUE',                     // Cheque payment

  // Legacy (keeping for backward compatibility)
  CARD = 'CARD',                         // Generic card (deprecated, use STRIPE_CARD or CARD_TERMINAL)
  ONLINE = 'ONLINE',                     // Generic online (deprecated, use STRIPE_CARD/STRIPE_WALLET)
  MOBILE_MONEY = 'MOBILE_MONEY',         // Mobile money payments
}

/**
 * Payment methods that require a transaction reference
 */
export const PAYMENT_METHODS_REQUIRING_REF: PaymentMethod[] = [
  PaymentMethod.STRIPE_CARD,
  PaymentMethod.STRIPE_WALLET,
  PaymentMethod.ONLINE,
  PaymentMethod.BANK_TRANSFER,
  PaymentMethod.MOBILE_MONEY,
  PaymentMethod.CARD_TERMINAL,
];

/**
 * Payment methods that are Stripe-based
 */
export const STRIPE_PAYMENT_METHODS: PaymentMethod[] = [
  PaymentMethod.STRIPE_CARD,
  PaymentMethod.STRIPE_WALLET,
];

// ─────────────────────────────────────────────────────────────────────────────
// Payment Channel Enum
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payment channel enum
 * Defines where the payment was initiated/received
 */
export enum PaymentChannel {
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',   // Self-service online payment
  CASHIER_PORTAL = 'CASHIER_PORTAL',     // Office counter payment
  MOBILE_APP = 'MOBILE_APP',             // Mobile app payment (future)

  // Legacy (keeping for backward compatibility)
  OFFICE = 'OFFICE',                     // Office (deprecated, use CASHIER_PORTAL)
  WEBSITE = 'WEBSITE',                   // Website (deprecated, use CUSTOMER_PORTAL)
  BANK = 'BANK',                         // Direct bank payment
  ATM = 'ATM',                           // ATM payment
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Status Enum
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payment status enum
 * Tracks the lifecycle of a payment, especially for async Stripe payments
 */
export enum PaymentStatus {
  PENDING = 'PENDING',       // Payment initiated but not yet confirmed (Stripe webhook pending)
  COMPLETED = 'COMPLETED',   // Payment successfully processed
  FAILED = 'FAILED',         // Payment failed (card declined, etc.)
  REFUNDED = 'REFUNDED',     // Payment has been refunded
  CANCELLED = 'CANCELLED',   // Payment was cancelled before completion
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom Validators
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Custom validator: Ensures payment amount is greater than 0
 */
@ValidatorConstraint({ name: 'isPositiveAmount', async: false })
export class IsPositiveAmountConstraint implements ValidatorConstraintInterface {
  validate(value: number): boolean {
    return typeof value === 'number' && value > 0;
  }

  defaultMessage(): string {
    return 'Payment amount must be greater than 0';
  }
}

/**
 * Custom validator: Ensures payment date is not in the future
 */
@ValidatorConstraint({ name: 'isNotFutureDate', async: false })
export class IsNotFutureDateConstraint implements ValidatorConstraintInterface {
  validate(value: Date): boolean {
    if (!(value instanceof Date) || isNaN(value.getTime())) {
      return false;
    }
    const now = new Date();
    return value <= now;
  }

  defaultMessage(): string {
    return 'Payment date cannot be in the future';
  }
}

/**
 * Custom validator: Ensures transaction_ref is provided for electronic payments
 */
@ValidatorConstraint({ name: 'transactionRefRequired', async: false })
export class TransactionRefRequiredConstraint implements ValidatorConstraintInterface {
  validate(_value: string | null, args: ValidationArguments): boolean {
    const payment = args.object as Payment;
    const requiresRef = PAYMENT_METHODS_REQUIRING_REF.includes(payment.paymentMethod);

    // For completed payments with methods that require ref
    if (requiresRef && payment.paymentStatus === PaymentStatus.COMPLETED) {
      return payment.transactionRef !== null && payment.transactionRef.trim().length > 0;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const payment = args.object as Payment;
    return `Transaction reference is required for completed ${payment.paymentMethod} payments`;
  }
}

/**
 * Custom validator: Ensures Stripe payment intent ID is provided for Stripe payments
 */
@ValidatorConstraint({ name: 'stripePaymentIntentRequired', async: false })
export class StripePaymentIntentRequiredConstraint implements ValidatorConstraintInterface {
  validate(_value: string | null, args: ValidationArguments): boolean {
    const payment = args.object as Payment;
    const isStripePayment = STRIPE_PAYMENT_METHODS.includes(payment.paymentMethod);

    if (isStripePayment) {
      return payment.stripePaymentIntentId !== null && payment.stripePaymentIntentId.trim().length > 0;
    }
    return true;
  }

  defaultMessage(args: ValidationArguments): string {
    const payment = args.object as Payment;
    return `Stripe Payment Intent ID is required for ${payment.paymentMethod} payments`;
  }
}

/**
 * Decorator for transaction reference validation
 */
function RequiresTransactionRef(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'requiresTransactionRef',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: TransactionRefRequiredConstraint,
    });
  };
}

/**
 * Decorator for Stripe payment intent validation
 */
function RequiresStripePaymentIntent(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string) {
    registerDecorator({
      name: 'requiresStripePaymentIntent',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: StripePaymentIntentRequiredConstraint,
    });
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Entity
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Payment entity mapping to the Payment table in SQL Server
 * Supports both online (Stripe) and offline (Cashier) payments
 *
 * @remarks
 * - Maps to existing table (synchronize: false recommended)
 * - Uses snake_case for columns, camelCase for properties
 * - Supports partial payments to bills
 * - Integrates with Stripe for online payments
 */
@Entity({ name: 'Payment', synchronize: false })
@Index('IX_Payment_bill', ['billId'])
@Index('IX_Payment_date', ['paymentDate'])
@Index('IX_Payment_customer', ['customerId'])
@Index('IX_Payment_transaction_ref', ['transactionRef'])
@Index('IX_Payment_status', ['paymentStatus'])
@Index('IX_Payment_stripe_intent', ['stripePaymentIntentId'], { unique: true, where: 'stripe_payment_intent_id IS NOT NULL' })
@Index('IX_Payment_customer_date', ['customerId', 'paymentDate'])
export class Payment {
  // ─────────────────────────────────────────────────────────────────────────────
  // Primary Key
  // ─────────────────────────────────────────────────────────────────────────────

  @PrimaryGeneratedColumn({ name: 'payment_id', type: 'bigint' })
  paymentId: number;

  // ─────────────────────────────────────────────────────────────────────────────
  // Foreign Keys
  // ─────────────────────────────────────────────────────────────────────────────

  @IsNotEmpty()
  @Column({ name: 'bill_id', type: 'bigint' })
  billId: number;

  @IsOptional()
  @Column({ name: 'customer_id', type: 'bigint', nullable: true })
  customerId: number | null;

  @IsOptional()
  @Column({ name: 'employee_id', type: 'bigint', nullable: true })
  employeeId: number | null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Core Payment Fields
  // ─────────────────────────────────────────────────────────────────────────────

  @IsNotEmpty()
  @IsDate()
  @Validate(IsNotFutureDateConstraint)
  @Column({ name: 'payment_date', type: 'datetime2', precision: 0 })
  paymentDate: Date;

  @IsNotEmpty()
  @IsNumber()
  @Validate(IsPositiveAmountConstraint)
  @Column({ name: 'payment_amount', type: 'decimal', precision: 12, scale: 2 })
  paymentAmount: number;

  @IsNotEmpty()
  @IsEnum(PaymentMethod)
  @Column({ name: 'payment_method', type: 'varchar', length: 30 })
  paymentMethod: PaymentMethod;

  @IsNotEmpty()
  @IsEnum(PaymentChannel)
  @Column({ name: 'payment_channel', type: 'varchar', length: 30 })
  paymentChannel: PaymentChannel;

  @IsNotEmpty()
  @IsEnum(PaymentStatus)
  @Column({ name: 'payment_status', type: 'varchar', length: 20, default: PaymentStatus.COMPLETED })
  paymentStatus: PaymentStatus;

  @IsOptional()
  @MaxLength(120)
  @RequiresTransactionRef()
  @Column({ name: 'transaction_ref', type: 'varchar', length: 120, nullable: true })
  transactionRef: string | null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Stripe-Specific Fields
  // ─────────────────────────────────────────────────────────────────────────────

  @IsOptional()
  @MaxLength(120)
  @RequiresStripePaymentIntent()
  @Column({ name: 'stripe_payment_intent_id', type: 'varchar', length: 120, nullable: true })
  stripePaymentIntentId: string | null;

  @IsOptional()
  @MaxLength(120)
  @Column({ name: 'stripe_charge_id', type: 'varchar', length: 120, nullable: true })
  stripeChargeId: string | null;

  @IsOptional()
  @MaxLength(120)
  @Column({ name: 'stripe_customer_id', type: 'varchar', length: 120, nullable: true })
  stripeCustomerId: string | null;

  @IsOptional()
  @Column({ name: 'metadata', type: 'nvarchar', length: 'max', nullable: true })
  metadata: string | null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Relations
  // ─────────────────────────────────────────────────────────────────────────────

  @ManyToOne(() => Bill, (bill) => bill.payments)
  @JoinColumn({ name: 'bill_id' })
  bill: Bill;

  @ManyToOne(() => Customer, { nullable: true })
  @JoinColumn({ name: 'customer_id' })
  customer: Customer | null;

  @ManyToOne(() => Employee, { nullable: true })
  @JoinColumn({ name: 'employee_id' })
  employee: Employee | null;

  // ─────────────────────────────────────────────────────────────────────────────
  // Computed Properties
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Generate formatted receipt number
   * Format: RCP-YYYY-NNNNN (e.g., RCP-2025-00123)
   */
  get receiptNumber(): string {
    if (!this.paymentId || !this.paymentDate) {
      return '';
    }
    const year = new Date(this.paymentDate).getFullYear();
    const paddedId = String(this.paymentId).padStart(5, '0');
    return `RCP-${year}-${paddedId}`;
  }

  /**
   * Get parsed metadata as object
   */
  get parsedMetadata(): Record<string, any> | null {
    if (!this.metadata) return null;
    try {
      return JSON.parse(this.metadata);
    } catch {
      return null;
    }
  }

  // ─────────────────────────────────────────────────────────────────────────────
  // Helper Methods
  // ─────────────────────────────────────────────────────────────────────────────

  /**
   * Check if this payment method requires a transaction reference
   */
  requiresTransactionRef(): boolean {
    return PAYMENT_METHODS_REQUIRING_REF.includes(this.paymentMethod);
  }

  /**
   * Check if this is a Stripe payment
   */
  isStripePayment(): boolean {
    return STRIPE_PAYMENT_METHODS.includes(this.paymentMethod);
  }

  /**
   * Check if this is an online (self-service) payment
   */
  isOnlinePayment(): boolean {
    return this.paymentChannel === PaymentChannel.CUSTOMER_PORTAL ||
      this.paymentChannel === PaymentChannel.MOBILE_APP ||
      this.paymentChannel === PaymentChannel.WEBSITE;
  }

  /**
   * Check if this is a cashier/office payment
   */
  isCashierPayment(): boolean {
    return this.paymentChannel === PaymentChannel.CASHIER_PORTAL ||
      this.paymentChannel === PaymentChannel.OFFICE;
  }

  /**
   * Check if the payment is pending (awaiting confirmation)
   */
  isPending(): boolean {
    return this.paymentStatus === PaymentStatus.PENDING;
  }

  /**
   * Check if the payment is completed
   */
  isCompleted(): boolean {
    return this.paymentStatus === PaymentStatus.COMPLETED;
  }

  /**
   * Check if the payment can be refunded
   */
  isRefundable(): boolean {
    return this.paymentStatus === PaymentStatus.COMPLETED;
  }

  /**
   * Get a display-friendly payment method name
   */
  getPaymentMethodDisplay(): string {
    const displayMap: Record<PaymentMethod, string> = {
      [PaymentMethod.STRIPE_CARD]: 'Card (Online)',
      [PaymentMethod.STRIPE_WALLET]: 'Digital Wallet',
      [PaymentMethod.CASH]: 'Cash',
      [PaymentMethod.CARD_TERMINAL]: 'Card (Terminal)',
      [PaymentMethod.BANK_TRANSFER]: 'Bank Transfer',
      [PaymentMethod.CHEQUE]: 'Cheque',
      [PaymentMethod.CARD]: 'Card',
      [PaymentMethod.ONLINE]: 'Online Payment',
      [PaymentMethod.MOBILE_MONEY]: 'Mobile Money',
    };
    return displayMap[this.paymentMethod] || this.paymentMethod;
  }

  /**
   * Get a display-friendly payment channel name
   */
  getPaymentChannelDisplay(): string {
    const displayMap: Record<PaymentChannel, string> = {
      [PaymentChannel.CUSTOMER_PORTAL]: 'Customer Portal',
      [PaymentChannel.CASHIER_PORTAL]: 'Office Counter',
      [PaymentChannel.MOBILE_APP]: 'Mobile App',
      [PaymentChannel.OFFICE]: 'Office',
      [PaymentChannel.WEBSITE]: 'Website',
      [PaymentChannel.BANK]: 'Bank',
      [PaymentChannel.ATM]: 'ATM',
    };
    return displayMap[this.paymentChannel] || this.paymentChannel;
  }

  /**
   * Get a display-friendly payment status name
   */
  getPaymentStatusDisplay(): string {
    const displayMap: Record<PaymentStatus, string> = {
      [PaymentStatus.PENDING]: 'Pending',
      [PaymentStatus.COMPLETED]: 'Completed',
      [PaymentStatus.FAILED]: 'Failed',
      [PaymentStatus.REFUNDED]: 'Refunded',
      [PaymentStatus.CANCELLED]: 'Cancelled',
    };
    return displayMap[this.paymentStatus] || this.paymentStatus;
  }

  /**
   * Set metadata from object
   */
  setMetadata(data: Record<string, any>): void {
    this.metadata = JSON.stringify(data);
  }

  /**
   * Update metadata by merging with existing
   */
  updateMetadata(data: Record<string, any>): void {
    const existing = this.parsedMetadata || {};
    this.metadata = JSON.stringify({ ...existing, ...data });
  }
}

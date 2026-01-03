// Payment Types for Frontend
// Supports both online (Stripe) and offline (Cashier) payments

// ─────────────────────────────────────────────────────────────────────────────
// Payment Method Enum
// ─────────────────────────────────────────────────────────────────────────────

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
    CARD = 'CARD',                         // Generic card
    ONLINE = 'ONLINE',                     // Generic online
    MOBILE_MONEY = 'MOBILE_MONEY',         // Mobile money payments
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Channel Enum
// ─────────────────────────────────────────────────────────────────────────────

export enum PaymentChannel {
    CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',   // Self-service online payment
    CASHIER_PORTAL = 'CASHIER_PORTAL',     // Office counter payment
    MOBILE_APP = 'MOBILE_APP',             // Mobile app payment

    // Legacy (keeping for backward compatibility)
    OFFICE = 'OFFICE',                     // Office
    WEBSITE = 'WEBSITE',                   // Website
    BANK = 'BANK',                         // Direct bank payment
    ATM = 'ATM',                           // ATM payment
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Status Enum
// ─────────────────────────────────────────────────────────────────────────────

export enum PaymentStatus {
    PENDING = 'PENDING',       // Payment initiated but not yet confirmed
    COMPLETED = 'COMPLETED',   // Payment successfully processed
    FAILED = 'FAILED',         // Payment failed
    REFUNDED = 'REFUNDED',     // Payment has been refunded
    CANCELLED = 'CANCELLED',   // Payment was cancelled
}

// ─────────────────────────────────────────────────────────────────────────────
// Payment Interface
// ─────────────────────────────────────────────────────────────────────────────

export interface Payment {
    paymentId: number;
    billId: number;
    customerId: number | null;
    employeeId: number | null;
    paymentDate: string;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    paymentChannel: PaymentChannel;
    paymentStatus: PaymentStatus;
    transactionRef: string | null;
    notes: string | null;

    // Stripe fields
    stripePaymentIntentId: string | null;
    stripeChargeId: string | null;
    stripeCustomerId: string | null;
    metadata: string | null;

    // Computed/joined fields
    billNumber: string;
    customerName: string;
    customerEmail: string | null;
    billAmount: number;
    billOutstanding: number;
    newOutstanding: number;
    receiptNumber: string;
    recordedByName: string | null;
    billDetails: {
        period: string;
        utilityType: string;
        meterSerialNo: string;
    };

    // Status indicators
    isVoided?: boolean;
    isRefunded?: boolean;
    isOverpayment?: boolean;
}

// ─────────────────────────────────────────────────────────────────────────────
// Supporting Interfaces
// ─────────────────────────────────────────────────────────────────────────────

export interface PaymentSummary {
    totalPayments: number;
    totalAmount: number;
    byMethod: Array<{ category: string; count: number; amount: number }>;
    byChannel: Array<{ category: string; count: number; amount: number }>;
    period: { start: string; end: string };
}

export interface PaymentFilters {
    search?: string;
    paymentMethod?: PaymentMethod[];
    paymentChannel?: PaymentChannel[];
    paymentStatus?: PaymentStatus[];
    startDate?: string;
    endDate?: string;
    minAmount?: number;
    maxAmount?: number;
    employeeId?: number;
    customerId?: number;
    billId?: number;
    transactionRef?: string;
    page?: number;
    limit?: number;
    sortBy?: string;
    order?: 'ASC' | 'DESC';
}

export interface PaginatedPaymentResponse {
    success: boolean;
    payments: Payment[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface OverpaymentRecord {
    paymentId: number;
    billId: number;
    customerId: number | null;
    customerName: string;
    billAmount: number;
    totalPaid: number;
    overpaymentAmount: number;
    paymentDate: string;
}

export interface DailyCollectionReport {
    date: string;
    cashierName: string;
    cashierId: number;
    openingBalance: number;
    totalCollected: number;
    byMethod: Array<{ category: string; count: number; amount: number }>;
    paymentsList: Payment[];
    closingBalance: number;
    totalTransactions: number;
    cashCollected: number;
    nonCashCollected: number;
}

// ─────────────────────────────────────────────────────────────────────────────
// Stripe-Specific Types
// ─────────────────────────────────────────────────────────────────────────────

export interface CreateStripePaymentIntent {
    billId: number;
    amount: number;
    customerId?: number;
    customerEmail?: string;
    returnUrl?: string;
}

export interface StripePaymentIntentResponse {
    clientSecret: string;
    paymentIntentId: string;
    amount: number;
    currency: string;
}

export interface StripeWebhookPayload {
    type: string;
    data: {
        object: {
            id: string;
            amount: number;
            status: string;
            metadata: Record<string, string>;
        };
    };
}

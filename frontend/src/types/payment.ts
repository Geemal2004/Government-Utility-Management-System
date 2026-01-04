/**
 * Payment-related TypeScript types
 */

// Payment Method Enum
export enum PaymentMethod {
  STRIPE_CARD = 'STRIPE_CARD',
  STRIPE_WALLET = 'STRIPE_WALLET',
  CASH = 'CASH',
  CARD_TERMINAL = 'CARD_TERMINAL',
  BANK_TRANSFER = 'BANK_TRANSFER',
  CHEQUE = 'CHEQUE',
  CARD = 'CARD',
  ONLINE = 'ONLINE',
  MOBILE_MONEY = 'MOBILE_MONEY',
}

// Payment Channel Enum
export enum PaymentChannel {
  CUSTOMER_PORTAL = 'CUSTOMER_PORTAL',
  CASHIER_PORTAL = 'CASHIER_PORTAL',
  MOBILE_APP = 'MOBILE_APP',
  OFFICE = 'OFFICE',
  WEBSITE = 'WEBSITE',
  BANK = 'BANK',
  ATM = 'ATM',
}

// Payment Status Enum
export enum PaymentStatus {
  PENDING = 'PENDING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
  CANCELLED = 'CANCELLED',
}

// Payment Entity
export interface Payment {
  paymentId: number;
  billId: number;
  customerId: number | null;
  employeeId: number | null;
  paymentDate: Date | string;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentChannel: PaymentChannel;
  paymentStatus: PaymentStatus;
  transactionRef: string | null;
  stripePaymentIntentId: string | null;
  stripeChargeId: string | null;
  stripeCustomerId: string | null;
  metadata: string | null;
  receiptNumber?: string;
  
  // Relations
  bill?: {
    billId: number;
    billDate: Date | string;
    totalAmount: number;
    dueDate: Date | string;
    meter?: {
      meterId: number;
      meterSerialNo: string;
      utilityType?: {
        utilityTypeId: number;
        typeName: string;
      };
    };
  };
  customer?: {
    customerId: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    email: string | null;
    phoneNumber: string | null;
  };
  employee?: {
    employeeId: number;
    firstName: string;
    lastName: string;
    username: string;
  };
}

// Payment Filter DTO
export interface PaymentFilterDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  billId?: number;
  customerId?: number;
  employeeId?: number;
  paymentMethod?: PaymentMethod;
  paymentChannel?: PaymentChannel;
  paymentStatus?: PaymentStatus;
  startDate?: Date | string;
  endDate?: Date | string;
  minAmount?: number;
  maxAmount?: number;
  transactionRef?: string;
}

// Create Payment DTO
export interface CreatePaymentDto {
  billId: number;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentChannel: PaymentChannel;
  paymentDate?: Date | string;
  transactionRef?: string;
  notes?: string;
}

// Create Cashier Payment DTO
export interface CreateCashierPaymentDto {
  billId: number;
  paymentAmount: number;
  paymentMethod: PaymentMethod;
  paymentDate?: Date | string;
  transactionRef?: string;
  receiptNumber?: string;
  notes?: string;
}

// Update Payment DTO
export interface UpdatePaymentDto {
  transactionRef?: string;
  paymentDate?: Date | string;
  notes?: string;
}

// Payment Summary DTO
export interface PaymentSummaryDto {
  totalPayments: number;
  totalAmount: number;
  byMethod: Array<{ category: string; count: number; amount: number }>;
  byChannel: Array<{ category: string; count: number; amount: number }>;
  byStatus: Array<{ category: string; count: number; amount: number }>;
  stripeSuccessRate: number;
  failedCount: number;
  refundedAmount: number;
  period: {
    start: Date | string;
    end: Date | string;
  };
}

// Pagination Meta
export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// API Response wrapper
export interface PaymentResponse {
  payments: Payment[];
  total: number;
}

// Checkout Session DTO
export interface CreateCheckoutSessionDto {
  billIds: number[];
  successUrl: string;
  cancelUrl: string;
}

// Checkout Session Response
export interface CheckoutSessionResponseDto {
  sessionId: string;
  sessionUrl: string;
  expiresAt: Date | string;
  totalAmount: number;
  currency: string;
}

// Payment Intent Response
export interface PaymentIntentResponseDto {
  paymentIntentId: string;
  clientSecret: string;
  amount: number;
  currency: string;
  status: string;
  publicKey: string;
  billIds: number[];
}

// Refund DTO
export interface RefundDto {
  refundAmount: number;
  refundReason: string;
  refundMethod: string;
}

// Daily Collection Report
export interface DailyCollectionReportDto {
  date: Date | string;
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

// Customer Bills Response
export interface CustomerBillsResponseDto {
  customerId: number;
  customerName: string;
  totalOutstanding: number;
  billCount: number;
  overdueBillCount: number;
  bills: CustomerBillPaymentDto[];
}

// Customer Bill for Payment Selection
export interface CustomerBillPaymentDto {
  billId: number;
  billDate: Date | string;
  dueDate: Date | string;
  meterSerialNo: string;
  utilityType: string;
  totalAmount: number;
  totalPaid: number;
  outstanding: number;
  isOverdue: boolean;
  daysOverdue: number;
}

import { getCustomerToken } from '../auth/customerAuth';

// Base API configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

// Generic API client
const api = {
    get: async (endpoint: string, options?: RequestInit) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'GET',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        // Handle blob responses
        if (options?.headers && 'responseType' in options && options.responseType === 'blob') {
            return response.blob();
        }

        return response.json();
    },

    post: async (endpoint: string, data: any, options?: RequestInit) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'POST',
            body: JSON.stringify(data),
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    },

    put: async (endpoint: string, data: any, options?: RequestInit) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'PUT',
            body: JSON.stringify(data),
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    },

    delete: async (endpoint: string, options?: RequestInit) => {
        const response = await fetch(`${API_BASE_URL}${endpoint}`, {
            method: 'DELETE',
            ...options,
            headers: {
                'Content-Type': 'application/json',
                ...options?.headers,
            },
        });

        if (!response.ok) {
            throw new Error(`API Error: ${response.statusText}`);
        }

        return response.json();
    },
};

// DTOs (Type Definitions)
export interface CreateCheckoutSessionDto {
    billIds: number[];
    successUrl: string;
    cancelUrl: string;
}

export interface CreatePaymentIntentDto {
    billIds: number[];
}

export interface CreateCashierPaymentDto {
    customerId: number;
    billIds: number[];
    paymentAmount: number;
    paymentMethod: 'CASH' | 'CARD_TERMINAL' | 'BANK_TRANSFER' | 'CHEQUE';
    transactionRef?: string;
    notes?: string;
}

export interface RefundDto {
    refundAmount: number;
    refundReason: string;
    refundMethod: 'ORIGINAL' | 'CASH' | 'BANK_TRANSFER';
    bankDetails?: {
        accountNumber: string;
        accountName: string;
        bankName: string;
        branchName: string;
    };
}

export interface PaymentHistoryParams {
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
}

export interface DailyCollectionsParams {
    date?: string;
    employeeId?: number;
}

// Helper to get employee token
const getEmployeeToken = () => {
    return localStorage.getItem('token') || '';
};

// Customer Payment APIs
export const customerPaymentApi = {
    /**
     * Get all bills for the authenticated customer
     */
    getMyBills: async () => {
        return api.get('/payments/customer/my-bills', {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },

    /**
     * Create a Stripe checkout session for online payment
     */
    createCheckoutSession: async (data: CreateCheckoutSessionDto) => {
        return api.post('/payments/online/checkout', data, {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },

    /**
     * Create a Stripe payment intent for custom payment flow
     */
    createPaymentIntent: async (billIds: number[]) => {
        return api.post('/payments/online/payment-intent', { billIds }, {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },

    /**
     * Get payment history for the authenticated customer
     */
    getPaymentHistory: async (params?: PaymentHistoryParams) => {
        const query = params ? new URLSearchParams(params as any).toString() : '';
        return api.get(`/payments/customer/history${query ? `?${query}` : ''}`, {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },

    /**
     * Get pending Stripe payments
     */
    getPendingPayments: async () => {
        return api.get('/payments/customer/pending-stripe', {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },

    /**
     * Verify a payment after Stripe redirect
     */
    verifyPayment: async (data: { sessionId?: string; paymentIntentId?: string }) => {
        return api.post('/payments/customer/verify-payment', data, {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },

    /**
     * Download payment receipt as PDF
     */
    downloadReceipt: async (paymentId: number) => {
        return api.get(`/payments/customer/${paymentId}/receipt`, {
            headers: {
                Authorization: `Bearer ${getCustomerToken()}`,
            },
            responseType: 'blob',
        } as any);
    },

    /**
     * Get customer profile information
     */
    getProfile: async () => {
        return api.get('/customers/me', {
            headers: { Authorization: `Bearer ${getCustomerToken()}` },
        });
    },
};

// Cashier Payment APIs
export const cashierPaymentApi = {
    /**
     * Search for customers by name, ID, phone, or email
     */
    searchCustomer: async (search: string) => {
        return api.get(`/payments/cashier/search-customer?search=${encodeURIComponent(search)}`, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Get unpaid bills for a specific customer
     */
    getCustomerUnpaidBills: async (customerId: number) => {
        return api.get(`/payments/cashier/customer/${customerId}/unpaid-bills`, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Record a cashier payment
     */
    recordPayment: async (data: CreateCashierPaymentDto) => {
        return api.post('/payments/cashier/record-payment', data, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Get daily collections report
     */
    getDailyCollections: async (params?: DailyCollectionsParams) => {
        const queryParams = new URLSearchParams();
        if (params?.date) queryParams.append('date', params.date);
        if (params?.employeeId) queryParams.append('employeeId', params.employeeId.toString());

        const query = queryParams.toString();
        return api.get(`/payments/cashier/daily-collections${query ? `?${query}` : ''}`, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Print receipt for a payment
     */
    printReceipt: async (paymentId: number) => {
        return api.get(`/payments/cashier/receipt/${paymentId}/print`, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
            responseType: 'blob',
        } as any);
    },

    /**
     * Process a refund
     */
    refund: async (paymentId: number, data: RefundDto) => {
        return api.post(`/payments/cashier/${paymentId}/refund`, data, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Submit cash reconciliation
     */
    submitReconciliation: async (data: {
        date: string;
        actualCashCount: number;
        variance: number;
        reason?: string;
    }) => {
        return api.post('/payments/cashier/reconcile', data, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },
};

// General Payment APIs (used by both customer and cashier)
export const paymentApi = {
    /**
     * Get payment details by ID
     */
    getPaymentById: async (paymentId: number, isCustomer: boolean = false) => {
        const token = isCustomer ? getCustomerToken() : getEmployeeToken();
        return api.get(`/payments/${paymentId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
    },

    /**
     * Get payment summary statistics
     */
    getPaymentSummary: async (startDate?: string, endDate?: string) => {
        const params = new URLSearchParams();
        if (startDate) params.append('startDate', startDate);
        if (endDate) params.append('endDate', endDate);

        const query = params.toString();
        return api.get(`/payments/summary${query ? `?${query}` : ''}`, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Search payments by transaction reference
     */
    searchByTransactionRef: async (transactionRef: string) => {
        return api.get(`/payments/search?transactionRef=${encodeURIComponent(transactionRef)}`, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Email receipt to customer
     */
    emailReceipt: async (paymentId: number, email: string) => {
        return api.post('/payments/email-receipt', { paymentId, email }, {
            headers: { Authorization: `Bearer ${getEmployeeToken()}` },
        });
    },

    /**
     * Verify receipt authenticity via QR code
     */
    verifyReceipt: async (receiptNumber: string, amount: number, date: string) => {
        return api.post('/payments/verify-receipt', { receiptNumber, amount, date });
    },
};

// Export all APIs
export default {
    customer: customerPaymentApi,
    cashier: cashierPaymentApi,
    payment: paymentApi,
};

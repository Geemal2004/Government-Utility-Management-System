/**
 * Payroll-related type definitions
 */

export enum PayrollRunStatus {
    DRAFT = 'DRAFT',
    PROCESSING = 'PROCESSING',
    COMPLETED = 'COMPLETED',
    CANCELLED = 'CANCELLED',
}

export interface PayrollRunDto {
    runId: number;
    month: string; // YYYY-MM format
    year: number;
    description?: string;
    periodStart: string;
    periodEnd: string;
    status: PayrollRunStatus;
    totalEmployees: number;
    totalGross: number;
    totalDeductions: number;
    totalNet: number;
    createdBy: number;
    createdByName?: string;
    approvedBy?: number;
    approvedByName?: string;
    runDate: string;
    createdAt: string;
    approvedAt?: string;
    cancelledAt?: string;
    cancellationReason?: string;
}

export interface PayrollSummaryDto {
    month: string;
    year: number;
    totalEmployeesPaid: number;
    totalGross: number;
    totalDeductions: number;
    netPayout: number;
    earningsBreakdown?: Array<{ type: string; total: number }>;
    deductionsBreakdown?: Array<{ type: string; total: number }>;
}

export interface PayrollRunFilters {
    status?: PayrollRunStatus;
    month?: number;
    year?: number;
    page: number;
    limit: number;
}

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
}

export const STATUS_COLORS: Record<PayrollRunStatus, { bg: string; text: string; icon?: string }> = {
    DRAFT: { bg: 'bg-gray-100', text: 'text-gray-700' },
    PROCESSING: { bg: 'bg-blue-100', text: 'text-blue-700' },
    COMPLETED: { bg: 'bg-green-100', text: 'text-green-700' },
    CANCELLED: { bg: 'bg-red-100', text: 'text-red-700' },
};

export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

export function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency: 'USD',
        minimumFractionDigits: 2,
    }).format(amount);
}

export function getMonthName(monthStr: string | number): string {
    if (typeof monthStr === 'number') {
        return MONTH_NAMES[monthStr - 1] || '';
    }
    // Handle YYYY-MM format
    const parts = monthStr.split('-');
    if (parts.length === 2) {
        const monthNum = parseInt(parts[1], 10);
        return MONTH_NAMES[monthNum - 1] || '';
    }
    return '';
}

export function getCurrentPeriod(): { month: number; year: number; monthName: string } {
    const now = new Date();
    const month = now.getMonth() + 1;
    const year = now.getFullYear();
    return {
        month,
        year,
        monthName: MONTH_NAMES[month - 1],
    };
}

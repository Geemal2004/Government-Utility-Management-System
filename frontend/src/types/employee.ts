/**
 * Employee-related type definitions
 */

export interface EmployeeResponseDto {
    employeeId: number;
    employeeNo: string;
    firstName: string;
    middleName?: string | null;
    lastName: string;
    fullName: string;
    email: string;
    phone?: string | null;
    username: string;
    role: EmployeeRole;
    designation?: string | null;
    departmentId?: number | null;
    departmentName?: string | null;
    lastLoginAt?: string | null;
    createdAt?: string;
    updatedAt?: string;
}

export type EmployeeRole =
    | 'ADMIN'
    | 'MANAGER'
    | 'CASHIER'
    | 'METER_READER'
    | 'FIELD_OFFICER'
    | 'ADMINISTRATIVE_STAFF';

export interface Paginated<T> {
    data: T[];
    total: number;
    page: number;
    limit: number;
    totalPages?: number;
}

export interface EmployeeStatsDto {
    total: number;
    byDepartment: Array<{
        departmentId: number;
        departmentName: string;
        count: number;
    }>;
    byRole: Array<{
        role: string;
        count: number;
    }>;
}

export interface EmployeeFilters {
    search?: string;
    departmentId?: number;
    role?: EmployeeRole[];
    page: number;
    limit: number;
    sortBy?: string;
    sortOrder?: 'ASC' | 'DESC';
}

export const ROLE_COLORS: Record<EmployeeRole, { bg: string; text: string; border: string }> = {
    ADMIN: { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-200' },
    MANAGER: { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' },
    CASHIER: { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-200' },
    METER_READER: { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-200' },
    FIELD_OFFICER: { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-200' },
    ADMINISTRATIVE_STAFF: { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' },
};

export const ROLE_LABELS: Record<EmployeeRole, string> = {
    ADMIN: 'Admin',
    MANAGER: 'Manager',
    CASHIER: 'Cashier',
    METER_READER: 'Meter Reader',
    FIELD_OFFICER: 'Field Officer',
    ADMINISTRATIVE_STAFF: 'Admin Staff',
};

export const ALL_ROLES: EmployeeRole[] = [
    'ADMIN',
    'MANAGER',
    'CASHIER',
    'METER_READER',
    'FIELD_OFFICER',
    'ADMINISTRATIVE_STAFF',
];

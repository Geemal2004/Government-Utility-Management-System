/**
 * Extended employee type definitions for profile page
 */

import { EmployeeResponseDto, EmployeeRole } from './employee';

export interface PayslipDto {
    payslipId: number;
    employeeId: number;
    month: string; // YYYY-MM format
    periodStart: string;
    periodEnd: string;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: 'DRAFT' | 'PENDING' | 'APPROVED' | 'PAID';
    paidAt?: string;
    createdAt: string;
    deductions?: Array<{
        type: string;
        amount: number;
        description?: string;
    }>;
}

export interface EmployeeDetailDto extends EmployeeResponseDto {
    // Extended relations
    department?: {
        departmentId: number;
        name: string;
        utilityTypeId?: number;
    };

    // Role-specific data
    managerDetails?: {
        managementLevel: 'SENIOR' | 'MIDDLE' | 'JUNIOR';
        reportAccessLevel: 'ALL' | 'DEPARTMENT' | 'TEAM';
        teamSize?: number;
    };

    fieldOfficerDetails?: {
        serviceAreaType: string;
        shiftType: 'MORNING' | 'AFTERNOON' | 'NIGHT' | 'ROTATING';
        certificationLevel?: string;
        geographicArea: string;
    };

    meterReaderDetails?: {
        deviceId?: string;
        assignedRouteCode?: string;
    };

    cashierDetails?: {
        canOverrideCharges: boolean;
        canApproveRefunds: boolean;
    };

    adminStaffDetails?: {
        canRegisterConnections: boolean;
        canManageTariffs: boolean;
    };

    // Statistics
    stats?: {
        totalPayslips: number;
        reportsCreated?: number;
        lastPasswordChange?: string;
    };

    // Timestamps
    lastLoginAt?: string;
    passwordChangedAt?: string;
    createdAt?: string;
    updatedAt?: string;
}

export type ProfileTab = 'overview' | 'employment' | 'payroll' | 'attendance' | 'documents' | 'activity';

export interface TabItem {
    id: ProfileTab;
    label: string;
    disabled?: boolean;
}

export const PROFILE_TABS: TabItem[] = [
    { id: 'overview', label: 'Overview' },
    { id: 'employment', label: 'Employment Details' },
    { id: 'payroll', label: 'Payroll History' },
    { id: 'attendance', label: 'Attendance', disabled: true },
    { id: 'documents', label: 'Documents', disabled: true },
    { id: 'activity', label: 'Activity Log' },
];

export interface UserPermissions {
    canEdit: boolean;
    canEditRole: boolean;
    canChangePassword: boolean;
    canResetPassword: boolean;
    canDeactivate: boolean;
    canViewPayroll: boolean;
    isSelf: boolean;
    isAdmin: boolean;
}

export function calculatePermissions(
    currentUserId: number,
    currentUserRole: string,
    targetEmployeeId: number
): UserPermissions {
    const isSelf = currentUserId === targetEmployeeId;
    const isAdmin = currentUserRole === 'ADMIN';
    const isManager = currentUserRole === 'MANAGER';

    return {
        canEdit: isAdmin || (isManager && !isAdmin) || isSelf,
        canEditRole: isAdmin,
        canChangePassword: isSelf || isAdmin,
        canResetPassword: isAdmin,
        canDeactivate: isAdmin && !isSelf,
        canViewPayroll: isSelf || isAdmin || isManager,
        isSelf,
        isAdmin,
    };
}

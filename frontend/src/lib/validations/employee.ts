import { z } from 'zod';
import { EmployeeRole } from '@/types/employee';

// Phone number validation
const phoneRegex = /^\+?[\d\s-]{10,15}$/;

// Employee number format
const employeeNoRegex = /^EMP-\d{4,}$/;

// Password strength checker
export function getPasswordStrength(password: string): {
    score: number;
    label: 'weak' | 'medium' | 'strong';
    color: string;
} {
    let score = 0;

    if (password.length >= 8) score += 1;
    if (password.length >= 12) score += 1;
    if (/[a-z]/.test(password)) score += 1;
    if (/[A-Z]/.test(password)) score += 1;
    if (/[0-9]/.test(password)) score += 1;
    if (/[^a-zA-Z0-9]/.test(password)) score += 1;

    if (score <= 2) {
        return { score: 33, label: 'weak', color: 'bg-red-500' };
    } else if (score <= 4) {
        return { score: 66, label: 'medium', color: 'bg-yellow-500' };
    } else {
        return { score: 100, label: 'strong', color: 'bg-green-500' };
    }
}

// Base schema for all employees
export const createEmployeeSchema = z.object({
    // Section 1: Personal Information
    firstName: z
        .string()
        .min(1, 'First name is required')
        .max(50, 'First name must be less than 50 characters'),
    middleName: z.string().max(50).optional().nullable(),
    lastName: z
        .string()
        .min(1, 'Last name is required')
        .max(50, 'Last name must be less than 50 characters'),
    email: z
        .string()
        .min(1, 'Email is required')
        .email('Invalid email address'),
    phoneNumbers: z
        .array(
            z.object({
                number: z.string().regex(phoneRegex, 'Invalid phone number format'),
                type: z.enum(['MOBILE', 'WORK', 'HOME']).default('MOBILE'),
            })
        )
        .min(1, 'At least one phone number is required'),

    // Section 2: Employment Details
    employeeNo: z
        .string()
        .min(1, 'Employee number is required')
        .regex(employeeNoRegex, 'Format must be EMP-XXXX'),
    designation: z
        .string()
        .min(1, 'Designation is required')
        .max(100, 'Designation must be less than 100 characters'),
    departmentId: z
        .number({ required_error: 'Department is required' })
        .positive('Please select a department'),
    role: z.enum([
        'ADMIN',
        'MANAGER',
        'CASHIER',
        'METER_READER',
        'FIELD_OFFICER',
        'ADMINISTRATIVE_STAFF',
    ] as const),

    // Section 3: Login Credentials
    username: z
        .string()
        .min(4, 'Username must be at least 4 characters')
        .max(30, 'Username must be less than 30 characters')
        .regex(/^[a-zA-Z0-9_]+$/, 'Username can only contain letters, numbers, and underscores'),
    password: z
        .string()
        .min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(1, 'Please confirm your password'),

    // Section 4: Specialized Role Details (all optional, validated based on role)
    managementLevel: z.enum(['SENIOR', 'MIDDLE', 'JUNIOR']).optional(),
    reportAccessLevel: z.enum(['ALL', 'DEPARTMENT', 'TEAM']).optional(),
    serviceAreaType: z.string().optional(),
    shiftType: z.enum(['MORNING', 'AFTERNOON', 'NIGHT', 'ROTATING']).optional(),
    certificationLevel: z.string().optional(),
    geographicArea: z.string().optional(),
    deviceId: z.string().optional(),
    assignedRouteCode: z.string().optional(),
    canOverrideCharges: z.boolean().optional(),
    canApproveRefunds: z.boolean().optional(),
    canRegisterConnections: z.boolean().optional(),
    canManageTariffs: z.boolean().optional(),
}).refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
}).refine((data) => {
    // Validate MANAGER fields
    if (data.role === 'MANAGER') {
        return !!data.managementLevel && !!data.reportAccessLevel;
    }
    return true;
}, {
    message: 'Management level and report access are required for managers',
    path: ['managementLevel'],
}).refine((data) => {
    // Validate FIELD_OFFICER fields
    if (data.role === 'FIELD_OFFICER') {
        return !!data.serviceAreaType && !!data.shiftType && !!data.geographicArea;
    }
    return true;
}, {
    message: 'Service area, shift type, and geographic area are required for field officers',
    path: ['serviceAreaType'],
});

export type CreateEmployeeFormData = z.infer<typeof createEmployeeSchema>;

// Default form values
export const defaultFormValues: Partial<CreateEmployeeFormData> = {
    firstName: '',
    middleName: '',
    lastName: '',
    email: '',
    phoneNumbers: [{ number: '', type: 'MOBILE' }],
    employeeNo: '',
    designation: '',
    departmentId: undefined,
    role: undefined,
    username: '',
    password: '',
    confirmPassword: '',
    canOverrideCharges: false,
    canApproveRefunds: false,
    canRegisterConnections: false,
    canManageTariffs: false,
};

// Generate employee number
export function generateEmployeeNo(): string {
    const randomNum = Math.floor(1000 + Math.random() * 9000);
    return `EMP-${randomNum}`;
}

// Generate username suggestion from name
export function generateUsername(firstName: string, lastName: string): string {
    const first = firstName.toLowerCase().replace(/[^a-z]/g, '');
    const last = lastName.toLowerCase().replace(/[^a-z]/g, '');

    if (!first && !last) return '';

    if (first && last) {
        return `${first.charAt(0)}${last}`.slice(0, 20);
    }

    return (first || last).slice(0, 20);
}

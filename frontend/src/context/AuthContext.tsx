'use client';

import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Employee role type
export type EmployeeRole =
    | 'ADMIN'
    | 'MANAGER'
    | 'CASHIER'
    | 'METER_READER'
    | 'FIELD_OFFICER'
    | 'ADMINISTRATIVE_STAFF';

// User info from JWT
export interface AuthUser {
    employeeId: number;
    username: string;
    email: string;
    role: EmployeeRole;
    firstName: string;
    lastName: string;
    fullName: string;
}

// Auth context state
interface AuthContextType {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (token: string) => Promise<void>;
    logout: () => void;
    hasRole: (...roles: EmployeeRole[]) => boolean;
    isAdmin: boolean;
    isManager: boolean;
    canAccessPayroll: boolean;
    canAccessReports: boolean;
    getDashboardPath: () => string;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Parse JWT token
function parseJWT(token: string): any {
    try {
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(
            atob(base64)
                .split('')
                .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
                .join('')
        );
        return JSON.parse(jsonPayload);
    } catch {
        return null;
    }
}

// Dashboard routes by role
const ROLE_DASHBOARDS: Record<EmployeeRole, string> = {
    ADMIN: '/dashboard',
    MANAGER: '/dashboard',
    CASHIER: '/dashboard/cashier',
    METER_READER: '/dashboard/meter-reader',
    FIELD_OFFICER: '/dashboard/field-officer',
    ADMINISTRATIVE_STAFF: '/dashboard/admin-staff',
};

interface AuthProviderProps {
    children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Check for existing token on mount
    useEffect(() => {
        const token = localStorage.getItem('accessToken');
        if (token) {
            const payload = parseJWT(token);
            if (payload && payload.exp * 1000 > Date.now()) {
                // Fetch user profile
                fetchProfile(token);
            } else {
                localStorage.removeItem('accessToken');
                setIsLoading(false);
            }
        } else {
            setIsLoading(false);
        }
    }, []);

    const fetchProfile = async (token: string) => {
        try {
            const response = await fetch('/api/v1/employees/me', {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (response.ok) {
                const data = await response.json();
                setUser({
                    employeeId: data.employeeId,
                    username: data.username,
                    email: data.email,
                    role: data.role as EmployeeRole,
                    firstName: data.firstName,
                    lastName: data.lastName,
                    fullName: data.fullName,
                });
            } else {
                localStorage.removeItem('accessToken');
            }
        } catch (error) {
            console.error('Failed to fetch profile:', error);
            localStorage.removeItem('accessToken');
        } finally {
            setIsLoading(false);
        }
    };

    const login = async (token: string) => {
        localStorage.setItem('accessToken', token);
        await fetchProfile(token);
    };

    const logout = () => {
        localStorage.removeItem('accessToken');
        setUser(null);
        window.location.href = '/login';
    };

    const hasRole = (...roles: EmployeeRole[]) => {
        return user ? roles.includes(user.role) : false;
    };

    const getDashboardPath = () => {
        if (!user) return '/login';
        return ROLE_DASHBOARDS[user.role] || '/dashboard';
    };

    const value: AuthContextType = {
        user,
        isLoading,
        isAuthenticated: !!user,
        login,
        logout,
        hasRole,
        isAdmin: user?.role === 'ADMIN',
        isManager: user?.role === 'MANAGER',
        canAccessPayroll: hasRole('ADMIN', 'MANAGER'),
        canAccessReports: hasRole('ADMIN', 'MANAGER'),
        getDashboardPath,
    };

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}

// HOC for role-protected routes
export function withRoleGuard<P extends object>(
    WrappedComponent: React.ComponentType<P>,
    allowedRoles: EmployeeRole[]
) {
    return function RoleGuardedComponent(props: P) {
        const { user, isLoading, hasRole, getDashboardPath } = useAuth();

        if (isLoading) {
            return (
                <div className="min-h-screen flex items-center justify-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            );
        }

        if (!user) {
            window.location.href = '/login';
            return null;
        }

        if (!hasRole(...allowedRoles)) {
            window.location.href = getDashboardPath();
            return null;
        }

        return <WrappedComponent {...props} />;
    };
}

// Permission config for each role
export const ROLE_PERMISSIONS: Record<EmployeeRole, {
    canManageEmployees: boolean;
    canManagePayroll: boolean;
    canViewReports: boolean;
    canCollectPayments: boolean;
    canSubmitReadings: boolean;
    canManageWorkOrders: boolean;
    canRegisterCustomers: boolean;
}> = {
    ADMIN: {
        canManageEmployees: true,
        canManagePayroll: true,
        canViewReports: true,
        canCollectPayments: true,
        canSubmitReadings: true,
        canManageWorkOrders: true,
        canRegisterCustomers: true,
    },
    MANAGER: {
        canManageEmployees: true,
        canManagePayroll: true,
        canViewReports: true,
        canCollectPayments: false,
        canSubmitReadings: false,
        canManageWorkOrders: true,
        canRegisterCustomers: false,
    },
    CASHIER: {
        canManageEmployees: false,
        canManagePayroll: false,
        canViewReports: false,
        canCollectPayments: true,
        canSubmitReadings: false,
        canManageWorkOrders: false,
        canRegisterCustomers: false,
    },
    METER_READER: {
        canManageEmployees: false,
        canManagePayroll: false,
        canViewReports: false,
        canCollectPayments: false,
        canSubmitReadings: true,
        canManageWorkOrders: false,
        canRegisterCustomers: false,
    },
    FIELD_OFFICER: {
        canManageEmployees: false,
        canManagePayroll: false,
        canViewReports: false,
        canCollectPayments: false,
        canSubmitReadings: false,
        canManageWorkOrders: true,
        canRegisterCustomers: false,
    },
    ADMINISTRATIVE_STAFF: {
        canManageEmployees: false,
        canManagePayroll: false,
        canViewReports: false,
        canCollectPayments: false,
        canSubmitReadings: false,
        canManageWorkOrders: false,
        canRegisterCustomers: true,
    },
};

// Hook to get permissions for current user
export function usePermissions() {
    const { user } = useAuth();
    if (!user) return null;
    return ROLE_PERMISSIONS[user.role];
}

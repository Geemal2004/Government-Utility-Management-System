'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    Edit,
    Key,
    RefreshCw,
    UserCog,
    UserX,
    UserCheck,
    MoreVertical,
    Mail,
    Phone,
    Briefcase,
    Building2,
    Calendar,
    Clock,
    Shield,
    Download,
    Eye,
    AlertCircle,
} from 'lucide-react';
import { Avatar, RoleBadge, StatusBadge } from '@/components/employees/EmployeeBadges';
import { ProfileCard, InfoRow, Tabs, ConfirmModal } from '@/components/employees/ProfileComponents';
import { EditProfileModal, ChangePasswordModal, AssignRoleModal } from '@/components/employees/ProfileModals';
import {
    EmployeeDetailDto,
    PayslipDto,
    ProfileTab,
    PROFILE_TABS,
    UserPermissions,
    calculatePermissions,
    calculateYearsOfService,
} from '@/types/employee-profile';
import { ROLE_LABELS } from '@/types/employee';

// Get auth token and user info
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

function getCurrentUser(): { employeeId: number; role: string } | null {
    if (typeof window === 'undefined') return null;
    const userData = localStorage.getItem('user');
    if (userData) {
        try {
            return JSON.parse(userData);
        } catch {
            return null;
        }
    }
    return { employeeId: 1, role: 'ADMIN' }; // Fallback for demo
}

export default function EmployeeProfilePage() {
    const params = useParams();
    const router = useRouter();
    const employeeId = parseInt(params.id as string);

    // State
    const [employee, setEmployee] = useState<EmployeeDetailDto | null>(null);
    const [payslips, setPayslips] = useState<PayslipDto[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [activeTab, setActiveTab] = useState<ProfileTab>('overview');

    // Modal states
    const [showEditModal, setShowEditModal] = useState(false);
    const [showPasswordModal, setShowPasswordModal] = useState(false);
    const [showRoleModal, setShowRoleModal] = useState(false);
    const [showDeactivateModal, setShowDeactivateModal] = useState(false);
    const [showActionMenu, setShowActionMenu] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);

    // Current user and permissions
    const currentUser = getCurrentUser();
    const permissions = useMemo<UserPermissions>(() => {
        if (!currentUser) {
            return {
                canEdit: false,
                canEditRole: false,
                canChangePassword: false,
                canResetPassword: false,
                canDeactivate: false,
                canViewPayroll: false,
                isSelf: false,
                isAdmin: false,
            };
        }
        return calculatePermissions(currentUser.employeeId, currentUser.role, employeeId);
    }, [currentUser, employeeId]);

    // Fetch employee data
    const fetchEmployee = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/employees/${employeeId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Employee not found');
                }
                throw new Error('Failed to fetch employee');
            }

            const result = await response.json();
            setEmployee(result.data || result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [employeeId]);

    // Fetch payslips
    const fetchPayslips = useCallback(async () => {
        if (!permissions.canViewPayroll) return;

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/employees/${employeeId}/payslips?limit=20`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setPayslips(result.data || result);
            }
        } catch (err) {
            console.error('Failed to fetch payslips:', err);
        }
    }, [employeeId, permissions.canViewPayroll]);

    useEffect(() => {
        fetchEmployee();
    }, [fetchEmployee]);

    useEffect(() => {
        if (activeTab === 'payroll') {
            fetchPayslips();
        }
    }, [activeTab, fetchPayslips]);

    // Action handlers
    const handleEditProfile = async (data: any) => {
        const token = getAuthToken();
        const response = await fetch(`/api/v1/employees/${employeeId}`, {
            method: 'PUT',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to update profile');
        }

        fetchEmployee();
    };

    const handleChangePassword = async (data: any) => {
        const token = getAuthToken();
        const response = await fetch(`/api/v1/employees/${employeeId}/password`, {
            method: 'PATCH',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to change password');
        }
    };

    const handleResetPassword = async () => {
        setIsProcessing(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/employees/${employeeId}/reset-password`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to reset password');
            }

            const result = await response.json();
            alert(`Temporary password: ${result.temporaryPassword}`);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Failed to reset password');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleAssignRole = async (data: any) => {
        const token = getAuthToken();
        const response = await fetch(`/api/v1/employees/${employeeId}/assign-role`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data),
        });

        if (!response.ok) {
            const error = await response.json();
            throw new Error(error.message || 'Failed to assign role');
        }

        fetchEmployee();
    };

    const handleDeactivate = async () => {
        setIsProcessing(true);
        try {
            const token = getAuthToken();
            const endpoint = employee?.isActive ? 'deactivate' : 'reactivate';
            const response = await fetch(`/api/v1/employees/${employeeId}/${endpoint}`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: endpoint === 'deactivate' ? JSON.stringify({ reason: 'Admin action' }) : undefined,
            });

            if (!response.ok) {
                throw new Error(`Failed to ${endpoint} employee`);
            }

            fetchEmployee();
            setShowDeactivateModal(false);
        } catch (err) {
            alert(err instanceof Error ? err.message : 'Action failed');
        } finally {
            setIsProcessing(false);
        }
    };

    // Loading state
    if (isLoading) {
        return <ProfileSkeleton />;
    }

    // Error state
    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 max-w-md w-full text-center">
                    <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                    <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <div className="flex gap-3 justify-center">
                        <button
                            onClick={() => router.push('/dashboard/employees')}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                        >
                            Back to List
                        </button>
                        <button
                            onClick={fetchEmployee}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (!employee) return null;

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    {/* Back button */}
                    <button
                        onClick={() => router.push('/dashboard/employees')}
                        className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Back to Employees
                    </button>

                    {/* Profile header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Avatar
                                firstName={employee.firstName}
                                lastName={employee.lastName}
                                size="lg"
                            />
                            <div>
                                <div className="flex items-center gap-3">
                                    <h1 className="text-2xl font-bold text-gray-900">
                                        {employee.fullName}
                                    </h1>
                                    <StatusBadge isActive={employee.isActive} />
                                </div>
                                <p className="text-gray-500">{employee.designation || 'No designation'}</p>
                                <p className="text-sm text-gray-400">{employee.employeeNo}</p>
                            </div>
                        </div>

                        {/* Actions */}
                        <div className="flex flex-wrap items-center gap-2">
                            {permissions.canEdit && (
                                <button
                                    onClick={() => setShowEditModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Edit className="w-4 h-4" />
                                    Edit Profile
                                </button>
                            )}
                            {permissions.canChangePassword && (
                                <button
                                    onClick={() => setShowPasswordModal(true)}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                                >
                                    <Key className="w-4 h-4" />
                                    {permissions.isSelf ? 'Change Password' : 'Reset Password'}
                                </button>
                            )}
                            {permissions.isAdmin && (
                                <div className="relative">
                                    <button
                                        onClick={() => setShowActionMenu(!showActionMenu)}
                                        className="p-2 text-gray-500 hover:bg-gray-100 rounded-lg"
                                    >
                                        <MoreVertical className="w-5 h-5" />
                                    </button>

                                    {showActionMenu && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setShowActionMenu(false)}
                                            />
                                            <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                                                <button
                                                    onClick={() => {
                                                        setShowRoleModal(true);
                                                        setShowActionMenu(false);
                                                    }}
                                                    className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                >
                                                    <UserCog className="w-4 h-4" />
                                                    Assign Role
                                                </button>
                                                {!permissions.isSelf && (
                                                    <button
                                                        onClick={() => {
                                                            setShowDeactivateModal(true);
                                                            setShowActionMenu(false);
                                                        }}
                                                        className={`w-full flex items-center gap-2 px-4 py-2 text-sm ${employee.isActive
                                                                ? 'text-red-600 hover:bg-red-50'
                                                                : 'text-green-600 hover:bg-green-50'
                                                            }`}
                                                    >
                                                        {employee.isActive ? (
                                                            <>
                                                                <UserX className="w-4 h-4" />
                                                                Deactivate
                                                            </>
                                                        ) : (
                                                            <>
                                                                <UserCheck className="w-4 h-4" />
                                                                Reactivate
                                                            </>
                                                        )}
                                                    </button>
                                                )}
                                            </div>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Tabs */}
                <div className="max-w-6xl mx-auto px-4">
                    <Tabs
                        tabs={PROFILE_TABS}
                        activeTab={activeTab}
                        onChange={(tab) => setActiveTab(tab as ProfileTab)}
                    />
                </div>
            </div>

            {/* Content */}
            <div className="max-w-6xl mx-auto px-4 py-8">
                {activeTab === 'overview' && (
                    <OverviewTab employee={employee} permissions={permissions} />
                )}
                {activeTab === 'employment' && (
                    <EmploymentTab employee={employee} />
                )}
                {activeTab === 'payroll' && (
                    <PayrollTab payslips={payslips} canView={permissions.canViewPayroll} />
                )}
                {activeTab === 'activity' && (
                    <ActivityTab employeeId={employeeId} />
                )}
            </div>

            {/* Modals */}
            <EditProfileModal
                isOpen={showEditModal}
                onClose={() => setShowEditModal(false)}
                employee={employee}
                onSave={handleEditProfile}
            />

            <ChangePasswordModal
                isOpen={showPasswordModal}
                onClose={() => setShowPasswordModal(false)}
                isSelf={permissions.isSelf}
                onSave={handleChangePassword}
            />

            {permissions.isAdmin && (
                <AssignRoleModal
                    isOpen={showRoleModal}
                    onClose={() => setShowRoleModal(false)}
                    currentRole={employee.role}
                    onSave={handleAssignRole}
                />
            )}

            <ConfirmModal
                isOpen={showDeactivateModal}
                onClose={() => setShowDeactivateModal(false)}
                onConfirm={handleDeactivate}
                title={employee.isActive ? 'Deactivate Employee' : 'Reactivate Employee'}
                message={
                    employee.isActive
                        ? `Are you sure you want to deactivate ${employee.fullName}? They will lose access to the system.`
                        : `Are you sure you want to reactivate ${employee.fullName}?`
                }
                confirmText={employee.isActive ? 'Deactivate' : 'Reactivate'}
                variant={employee.isActive ? 'danger' : 'info'}
                isLoading={isProcessing}
            />
        </div>
    );
}

// Overview Tab
function OverviewTab({ employee, permissions }: { employee: EmployeeDetailDto; permissions: UserPermissions }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Personal Information */}
            <ProfileCard title="Personal Information">
                <div className="space-y-1">
                    <InfoRow label="Full Name" value={employee.fullName} />
                    <InfoRow
                        label="Email"
                        value={
                            <a href={`mailto:${employee.email}`} className="text-blue-600 hover:underline">
                                {employee.email}
                            </a>
                        }
                    />
                    <InfoRow label="Phone" value={employee.phone || 'Not provided'} />
                    <InfoRow
                        label="Status"
                        value={<StatusBadge isActive={employee.isActive} />}
                    />
                </div>
            </ProfileCard>

            {/* Employment Information */}
            <ProfileCard title="Employment Information">
                <div className="space-y-1">
                    <InfoRow label="Employee No" value={employee.employeeNo} />
                    <InfoRow label="Designation" value={employee.designation} />
                    <InfoRow label="Department" value={employee.departmentName || employee.department?.name} />
                    <InfoRow label="Role" value={<RoleBadge role={employee.role} size="sm" />} />
                    <InfoRow
                        label="Joined Date"
                        value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                    />
                    <InfoRow
                        label="Years of Service"
                        value={calculateYearsOfService(employee.hireDate)}
                    />
                </div>
            </ProfileCard>

            {/* Role-specific card */}
            {employee.role === 'MANAGER' && employee.managerDetails && (
                <ProfileCard title="Manager Details">
                    <div className="space-y-1">
                        <InfoRow label="Management Level" value={employee.managerDetails.managementLevel} />
                        <InfoRow label="Report Access" value={employee.managerDetails.reportAccessLevel} />
                        <InfoRow label="Team Size" value={employee.managerDetails.teamSize || '-'} />
                    </div>
                </ProfileCard>
            )}

            {employee.role === 'FIELD_OFFICER' && employee.fieldOfficerDetails && (
                <ProfileCard title="Field Officer Details">
                    <div className="space-y-1">
                        <InfoRow label="Service Area" value={employee.fieldOfficerDetails.serviceAreaType} />
                        <InfoRow label="Shift Type" value={employee.fieldOfficerDetails.shiftType} />
                        <InfoRow label="Geographic Area" value={employee.fieldOfficerDetails.geographicArea} />
                        <InfoRow label="Certification" value={employee.fieldOfficerDetails.certificationLevel} />
                    </div>
                </ProfileCard>
            )}

            {employee.role === 'CASHIER' && employee.cashierDetails && (
                <ProfileCard title="Cashier Permissions">
                    <div className="space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Can Override Charges</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${employee.cashierDetails.canOverrideCharges
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                {employee.cashierDetails.canOverrideCharges ? 'Yes' : 'No'}
                            </span>
                        </div>
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-600">Can Approve Refunds</span>
                            <span className={`px-2 py-1 rounded text-xs font-medium ${employee.cashierDetails.canApproveRefunds
                                    ? 'bg-green-100 text-green-700'
                                    : 'bg-gray-100 text-gray-500'
                                }`}>
                                {employee.cashierDetails.canApproveRefunds ? 'Yes' : 'No'}
                            </span>
                        </div>
                    </div>
                </ProfileCard>
            )}

            {/* Quick Stats */}
            <ProfileCard title="Quick Statistics">
                <div className="grid grid-cols-2 gap-4">
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-2xl font-bold text-gray-900">
                            {employee.stats?.totalPayslips || 0}
                        </p>
                        <p className="text-sm text-gray-500">Total Payslips</p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg text-center">
                        <p className="text-sm font-medium text-gray-900">
                            {employee.lastLoginAt
                                ? new Date(employee.lastLoginAt).toLocaleDateString()
                                : 'Never'}
                        </p>
                        <p className="text-sm text-gray-500">Last Login</p>
                    </div>
                </div>
            </ProfileCard>
        </div>
    );
}

// Employment Tab
function EmploymentTab({ employee }: { employee: EmployeeDetailDto }) {
    return (
        <div className="space-y-6">
            <ProfileCard title="Employment Details">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-1">
                    <InfoRow label="Employee Number" value={employee.employeeNo} />
                    <InfoRow label="Username" value={employee.username} />
                    <InfoRow label="Designation" value={employee.designation} />
                    <InfoRow label="Department" value={employee.departmentName} />
                    <InfoRow label="Base Role" value={<RoleBadge role={employee.role} />} />
                    <InfoRow label="Account Status" value={<StatusBadge isActive={employee.isActive} />} />
                    <InfoRow
                        label="Join Date"
                        value={employee.hireDate ? new Date(employee.hireDate).toLocaleDateString() : '-'}
                    />
                    <InfoRow
                        label="Last Login"
                        value={employee.lastLoginAt ? new Date(employee.lastLoginAt).toLocaleString() : 'Never'}
                    />
                    <InfoRow
                        label="Password Changed"
                        value={employee.passwordChangedAt ? new Date(employee.passwordChangedAt).toLocaleDateString() : '-'}
                    />
                    <InfoRow
                        label="Created At"
                        value={employee.createdAt ? new Date(employee.createdAt).toLocaleDateString() : '-'}
                    />
                </div>
            </ProfileCard>
        </div>
    );
}

// Payroll Tab
function PayrollTab({ payslips, canView }: { payslips: PayslipDto[]; canView: boolean }) {
    if (!canView) {
        return (
            <div className="text-center py-12">
                <Shield className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">You don't have permission to view payroll information.</p>
            </div>
        );
    }

    if (payslips.length === 0) {
        return (
            <div className="text-center py-12">
                <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <p className="text-gray-500">No payroll records found.</p>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Month</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Gross</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Deductions</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Net</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Status</th>
                        <th className="px-6 py-3 text-left text-sm font-semibold text-gray-600">Actions</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                    {payslips.map((payslip) => (
                        <tr key={payslip.payslipId} className="hover:bg-gray-50">
                            <td className="px-6 py-4 text-sm text-gray-900">{payslip.month}</td>
                            <td className="px-6 py-4 text-sm text-gray-900">
                                ${payslip.grossSalary.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm text-red-600">
                                -${payslip.totalDeductions.toLocaleString()}
                            </td>
                            <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                ${payslip.netSalary.toLocaleString()}
                            </td>
                            <td className="px-6 py-4">
                                <span className={`px-2 py-1 rounded-full text-xs font-medium ${payslip.status === 'PAID'
                                        ? 'bg-green-100 text-green-700'
                                        : payslip.status === 'APPROVED'
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'bg-yellow-100 text-yellow-700'
                                    }`}>
                                    {payslip.status}
                                </span>
                            </td>
                            <td className="px-6 py-4">
                                <div className="flex items-center gap-2">
                                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                        <Eye className="w-4 h-4" />
                                    </button>
                                    <button className="p-1.5 text-gray-500 hover:bg-gray-100 rounded">
                                        <Download className="w-4 h-4" />
                                    </button>
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

// Activity Tab
function ActivityTab({ employeeId }: { employeeId: number }) {
    return (
        <div className="text-center py-12">
            <Clock className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Activity log coming soon.</p>
        </div>
    );
}

// Skeleton loader
function ProfileSkeleton() {
    return (
        <div className="min-h-screen bg-gray-50">
            <div className="bg-white border-b border-gray-200">
                <div className="max-w-6xl mx-auto px-4 py-6">
                    <div className="w-32 h-4 bg-gray-200 rounded animate-pulse mb-4" />
                    <div className="flex items-center gap-4">
                        <div className="w-16 h-16 bg-gray-200 rounded-full animate-pulse" />
                        <div className="space-y-2">
                            <div className="w-48 h-6 bg-gray-200 rounded animate-pulse" />
                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                        </div>
                    </div>
                </div>
                <div className="max-w-6xl mx-auto px-4 py-4">
                    <div className="flex gap-4">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="w-24 h-8 bg-gray-200 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                            <div className="w-32 h-5 bg-gray-200 rounded animate-pulse mb-4" />
                            <div className="space-y-3">
                                {[1, 2, 3, 4].map((j) => (
                                    <div key={j} className="w-full h-4 bg-gray-200 rounded animate-pulse" />
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

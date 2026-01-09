'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
    Plus,
    Download,
    Users,
    RefreshCw,
    AlertCircle,
    UserX,
} from 'lucide-react';
import {
    EmployeeResponseDto,
    EmployeeStatsDto,
    EmployeeFilters,
    Paginated,
    EmployeeRole,
} from '@/types/employee';
import { EmployeeStatsCards } from '@/components/employees/EmployeeStats';
import { EmployeeFiltersPanel } from '@/components/employees/EmployeeFilters';
import { EmployeeTable, Pagination } from '@/components/employees/EmployeeTable';

// Department type for filters
interface Department {
    departmentId: number;
    name: string;
}

// Get auth token (adjust based on your auth setup)
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

// Current user role (adjust based on your auth context)
function useCurrentUserRole(): string {
    // This should come from your auth context
    // For now, returning a default
    return 'ADMIN';
}

export default function EmployeesPage() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentUserRole = useCurrentUserRole();

    // State
    const [employees, setEmployees] = useState<EmployeeResponseDto[]>([]);
    const [stats, setStats] = useState<EmployeeStatsDto | null>(null);
    const [departments, setDepartments] = useState<Department[]>([]);
    const [total, setTotal] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [isStatsLoading, setIsStatsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedIds, setSelectedIds] = useState<number[]>([]);

    // Filters from URL
    const filters: EmployeeFilters = useMemo(() => {
        const roleParam = searchParams.get('role');
        return {
            search: searchParams.get('search') || undefined,
            departmentId: searchParams.get('departmentId')
                ? parseInt(searchParams.get('departmentId')!)
                : undefined,
            role: roleParam ? (roleParam.split(',') as EmployeeRole[]) : undefined,
            isActive: searchParams.has('isActive')
                ? searchParams.get('isActive') === 'true'
                : undefined,
            page: parseInt(searchParams.get('page') || '1'),
            limit: parseInt(searchParams.get('limit') || '10'),
            sortBy: searchParams.get('sortBy') || 'employeeNo',
            sortOrder: (searchParams.get('sortOrder') as 'ASC' | 'DESC') || 'ASC',
        };
    }, [searchParams]);

    // Update URL with filters
    const updateFilters = useCallback(
        (newFilters: Partial<EmployeeFilters>) => {
            const params = new URLSearchParams(searchParams.toString());

            Object.entries({ ...filters, ...newFilters }).forEach(([key, value]) => {
                if (value === undefined || value === null || value === '') {
                    params.delete(key);
                } else if (Array.isArray(value)) {
                    if (value.length > 0) {
                        params.set(key, value.join(','));
                    } else {
                        params.delete(key);
                    }
                } else {
                    params.set(key, String(value));
                }
            });

            router.push(`/dashboard/employees?${params.toString()}`, { scroll: false });
        },
        [filters, router, searchParams]
    );

    // Fetch employees
    const fetchEmployees = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const params = new URLSearchParams();

            if (filters.search) params.set('search', filters.search);
            if (filters.departmentId) params.set('departmentId', String(filters.departmentId));
            if (filters.role && filters.role.length > 0) {
                filters.role.forEach((r) => params.append('role', r));
            }
            if (filters.isActive !== undefined) params.set('isActive', String(filters.isActive));
            params.set('page', String(filters.page));
            params.set('limit', String(filters.limit));
            if (filters.sortBy) params.set('sortBy', filters.sortBy);
            if (filters.sortOrder) params.set('sortOrder', filters.sortOrder);

            const response = await fetch(`/api/v1/employees?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch employees');
            }

            const result = await response.json();
            const data: Paginated<EmployeeResponseDto> = result.data || result;

            setEmployees(data.data);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [filters]);

    // Fetch statistics
    const fetchStats = useCallback(async () => {
        setIsStatsLoading(true);

        try {
            const token = getAuthToken();
            const response = await fetch('/api/v1/employees/statistics', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch statistics');
            }

            const result = await response.json();
            setStats(result.data || result);
        } catch (err) {
            console.error('Failed to fetch stats:', err);
        } finally {
            setIsStatsLoading(false);
        }
    }, []);

    // Fetch departments for filter
    const fetchDepartments = useCallback(async () => {
        try {
            const token = getAuthToken();
            const response = await fetch('/api/v1/departments', {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (response.ok) {
                const result = await response.json();
                setDepartments(result.data || result);
            }
        } catch (err) {
            console.error('Failed to fetch departments:', err);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchEmployees();
    }, [fetchEmployees]);

    useEffect(() => {
        fetchStats();
        fetchDepartments();
    }, [fetchStats, fetchDepartments]);

    // Handle sorting
    const handleSort = useCallback(
        (column: string) => {
            const newOrder =
                filters.sortBy === column && filters.sortOrder === 'ASC' ? 'DESC' : 'ASC';
            updateFilters({ sortBy: column, sortOrder: newOrder, page: 1 });
        },
        [filters.sortBy, filters.sortOrder, updateFilters]
    );

    // Handle row action
    const handleAction = useCallback(
        (action: string, employee: EmployeeResponseDto) => {
            switch (action) {
                case 'view':
                    router.push(`/dashboard/employees/${employee.employeeId}`);
                    break;
                case 'edit':
                    router.push(`/dashboard/employees/${employee.employeeId}/edit`);
                    break;
                case 'changePassword':
                    // Open modal or navigate
                    router.push(`/dashboard/employees/${employee.employeeId}/change-password`);
                    break;
                case 'assignRole':
                    router.push(`/dashboard/employees/${employee.employeeId}/assign-role`);
                    break;
                case 'deactivate':
                case 'reactivate':
                    // Handle with confirmation modal
                    if (confirm(`Are you sure you want to ${action} ${employee.fullName}?`)) {
                        handleStatusChange(employee.employeeId, action);
                    }
                    break;
            }
        },
        [router]
    );

    // Handle status change (deactivate/reactivate)
    const handleStatusChange = async (employeeId: number, action: string) => {
        try {
            const token = getAuthToken();
            const endpoint =
                action === 'deactivate'
                    ? `/api/v1/employees/${employeeId}/deactivate`
                    : `/api/v1/employees/${employeeId}/reactivate`;

            const response = await fetch(endpoint, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
                body: action === 'deactivate' ? JSON.stringify({ reason: 'Admin action' }) : undefined,
            });

            if (response.ok) {
                fetchEmployees();
                fetchStats();
            }
        } catch (err) {
            console.error('Failed to update status:', err);
        }
    };

    // Handle bulk export
    const handleExport = useCallback(async () => {
        try {
            const token = getAuthToken();
            const params = new URLSearchParams();

            if (selectedIds.length > 0) {
                selectedIds.forEach((id) => params.append('ids', String(id)));
            }

            const response = await fetch(`/api/v1/employees/export?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `employees_${new Date().toISOString().split('T')[0]}.csv`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        } catch (err) {
            console.error('Failed to export:', err);
        }
    }, [selectedIds]);

    // Handle bulk deactivate
    const handleBulkDeactivate = useCallback(async () => {
        if (selectedIds.length === 0) return;

        if (!confirm(`Are you sure you want to deactivate ${selectedIds.length} employee(s)?`)) {
            return;
        }

        try {
            const token = getAuthToken();
            await Promise.all(
                selectedIds.map((id) =>
                    fetch(`/api/v1/employees/${id}/deactivate`, {
                        method: 'POST',
                        headers: {
                            Authorization: `Bearer ${token}`,
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ reason: 'Bulk deactivation' }),
                    })
                )
            );

            setSelectedIds([]);
            fetchEmployees();
            fetchStats();
        } catch (err) {
            console.error('Failed to bulk deactivate:', err);
        }
    }, [selectedIds, fetchEmployees, fetchStats]);

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Employee Management
                        </h1>
                        <p className="text-gray-500 mt-1">
                            Manage your organization&apos;s workforce
                        </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-3">
                        <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                            {total} Employees
                        </span>
                        <button
                            onClick={handleExport}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <Download className="w-4 h-4" />
                            Export CSV
                        </button>
                        <button
                            onClick={() => router.push('/dashboard/employees/new')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <Plus className="w-4 h-4" />
                            Add Employee
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <EmployeeStatsCards stats={stats} isLoading={isStatsLoading} />

                {/* Filters */}
                <EmployeeFiltersPanel
                    filters={filters}
                    onFiltersChange={updateFilters}
                    departments={departments}
                    isLoading={isLoading}
                />

                {/* Bulk Actions Toolbar */}
                {selectedIds.length > 0 && (
                    <div className="flex items-center gap-4 p-4 bg-blue-50 border border-blue-200 rounded-xl">
                        <span className="text-sm font-medium text-blue-700">
                            {selectedIds.length} employee(s) selected
                        </span>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={handleExport}
                                className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-blue-700 bg-white border border-blue-300 rounded-lg hover:bg-blue-50"
                            >
                                <Download className="w-4 h-4" />
                                Export Selected
                            </button>
                            {currentUserRole === 'ADMIN' && (
                                <button
                                    onClick={handleBulkDeactivate}
                                    className="flex items-center gap-1 px-3 py-1.5 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                                >
                                    <UserX className="w-4 h-4" />
                                    Deactivate Selected
                                </button>
                            )}
                        </div>
                        <button
                            onClick={() => setSelectedIds([])}
                            className="ml-auto text-sm text-blue-600 hover:text-blue-800"
                        >
                            Clear Selection
                        </button>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex items-center justify-between p-4 bg-red-50 border border-red-200 rounded-xl">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500" />
                            <span className="text-red-700">{error}</span>
                        </div>
                        <button
                            onClick={fetchEmployees}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-lg hover:bg-red-50"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && employees.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <Users className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No employees found
                        </h3>
                        <p className="text-gray-500 mb-6">
                            {filters.search || filters.departmentId || filters.role
                                ? 'Try adjusting your filters'
                                : 'Get started by adding your first employee'}
                        </p>
                        <button
                            onClick={() => router.push('/dashboard/employees/new')}
                            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                        >
                            <Plus className="w-4 h-4" />
                            Add Employee
                        </button>
                    </div>
                )}

                {/* Table */}
                {(isLoading || employees.length > 0) && (
                    <EmployeeTable
                        employees={employees}
                        isLoading={isLoading}
                        sortBy={filters.sortBy || 'employeeNo'}
                        sortOrder={filters.sortOrder || 'ASC'}
                        onSort={handleSort}
                        selectedIds={selectedIds}
                        onSelectionChange={setSelectedIds}
                        currentUserRole={currentUserRole}
                        onAction={handleAction}
                    />
                )}

                {/* Pagination */}
                {!isLoading && employees.length > 0 && (
                    <Pagination
                        page={filters.page}
                        limit={filters.limit}
                        total={total}
                        onPageChange={(page) => updateFilters({ page })}
                        onLimitChange={(limit) => updateFilters({ limit, page: 1 })}
                    />
                )}
            </div>
        </div>
    );
}

'use client';

import { useMemo, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    ChevronUp,
    ChevronDown,
    MoreVertical,
    Eye,
    Edit,
    Key,
    UserCog,
    UserX,
    UserCheck,
} from 'lucide-react';
import { EmployeeResponseDto, EmployeeRole } from '@/types/employee';
import { Avatar, RoleBadge } from './EmployeeBadges';

interface EmployeeTableProps {
    employees: EmployeeResponseDto[];
    isLoading: boolean;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSort: (column: string) => void;
    selectedIds: number[];
    onSelectionChange: (ids: number[]) => void;
    currentUserRole: string;
    onAction: (action: string, employee: EmployeeResponseDto) => void;
}

export function EmployeeTable({
    employees,
    isLoading,
    sortBy,
    sortOrder,
    onSort,
    selectedIds,
    onSelectionChange,
    currentUserRole,
    onAction,
}: EmployeeTableProps) {
    const router = useRouter();
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const isAdmin = currentUserRole === 'ADMIN';

    const handleSelectAll = useCallback(() => {
        if (selectedIds.length === employees.length) {
            onSelectionChange([]);
        } else {
            onSelectionChange(employees.map((e) => e.employeeId));
        }
    }, [employees, selectedIds, onSelectionChange]);

    const handleSelectOne = useCallback(
        (id: number) => {
            if (selectedIds.includes(id)) {
                onSelectionChange(selectedIds.filter((i) => i !== id));
            } else {
                onSelectionChange([...selectedIds, id]);
            }
        },
        [selectedIds, onSelectionChange]
    );

    const SortHeader = ({
        column,
        label,
        sortable = true,
    }: {
        column: string;
        label: string;
        sortable?: boolean;
    }) => {
        if (!sortable) {
            return <span className="font-semibold text-gray-600">{label}</span>;
        }

        const isActive = sortBy === column;
        return (
            <button
                onClick={() => onSort(column)}
                className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900 transition-colors"
            >
                {label}
                {isActive && (
                    sortOrder === 'ASC' ? (
                        <ChevronUp className="w-4 h-4" />
                    ) : (
                        <ChevronDown className="w-4 h-4" />
                    )
                )}
            </button>
        );
    };

    const ActionMenu = ({ employee }: { employee: EmployeeResponseDto }) => {
        const isOpen = openMenuId === employee.employeeId;

        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isOpen ? null : employee.employeeId);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                        />
                        {/* Menu */}
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            <button
                                onClick={() => {
                                    onAction('view', employee);
                                    setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Eye className="w-4 h-4" />
                                View Profile
                            </button>
                            <button
                                onClick={() => {
                                    onAction('edit', employee);
                                    setOpenMenuId(null);
                                }}
                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                <Edit className="w-4 h-4" />
                                Edit Details
                            </button>
                            {isAdmin && (
                                <>
                                    <hr className="my-1 border-gray-100" />
                                    <button
                                        onClick={() => {
                                            onAction('changePassword', employee);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <Key className="w-4 h-4" />
                                        Change Password
                                    </button>
                                    <button
                                        onClick={() => {
                                            onAction('assignRole', employee);
                                            setOpenMenuId(null);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                    >
                                        <UserCog className="w-4 h-4" />
                                        Assign Role
                                    </button>
                                </>
                            )}
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (isLoading) {
        return <TableSkeleton />;
    }

    if (employees.length === 0) {
        return null; // Parent handles empty state
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="w-12 px-4 py-3">
                                <input
                                    type="checkbox"
                                    checked={selectedIds.length === employees.length && employees.length > 0}
                                    onChange={handleSelectAll}
                                    className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                />
                            </th>
                            <th className="px-4 py-3 text-left text-sm">
                                <SortHeader column="employeeNo" label="Employee" />
                            </th>
                            <th className="px-4 py-3 text-left text-sm">
                                <SortHeader column="designation" label="Designation" sortable={false} />
                            </th>
                            <th className="px-4 py-3 text-left text-sm">
                                <SortHeader column="departmentName" label="Department" />
                            </th>
                            <th className="px-4 py-3 text-left text-sm">
                                <SortHeader column="role" label="Role" />
                            </th>
                            <th className="px-4 py-3 text-left text-sm">
                                <span className="font-semibold text-gray-600">Contact</span>
                            </th>
                            <th className="w-16 px-4 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {employees.map((employee) => (
                            <tr
                                key={employee.employeeId}
                                className={`hover:bg-gray-50 transition-colors ${selectedIds.includes(employee.employeeId) ? 'bg-blue-50' : ''
                                    }`}
                            >
                                <td className="px-4 py-3">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.includes(employee.employeeId)}
                                        onChange={() => handleSelectOne(employee.employeeId)}
                                        className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                    />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        <Avatar
                                            firstName={employee.firstName}
                                            lastName={employee.lastName}
                                            size="md"
                                        />
                                        <div>
                                            <div className="font-medium text-gray-900">{employee.fullName}</div>
                                            <div className="text-sm text-gray-500">{employee.employeeNo}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {employee.designation || '-'}
                                </td>
                                <td className="px-4 py-3 text-sm text-gray-600">
                                    {employee.departmentName || '-'}
                                </td>
                                <td className="px-4 py-3">
                                    <RoleBadge role={employee.role} size="sm" />
                                </td>
                                <td className="px-4 py-3">
                                    <div className="text-sm">
                                        <div className="text-gray-900">{employee.email}</div>
                                        <div className="text-gray-500">{employee.phone || '-'}</div>
                                    </div>
                                </td>
                                <td className="px-4 py-3">
                                    <ActionMenu employee={employee} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

function TableSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="w-12 px-4 py-3">
                                <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-4 py-3">
                                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-4 py-3">
                                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-4 py-3">
                                <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-4 py-3">
                                <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="px-4 py-3">
                                <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                            <th className="w-16 px-4 py-3" />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[...Array(5)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-4 py-4">
                                    <div className="w-4 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-gray-200 rounded-full animate-pulse" />
                                        <div className="space-y-2">
                                            <div className="w-32 h-4 bg-gray-200 rounded animate-pulse" />
                                            <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                                        </div>
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="w-16 h-6 bg-gray-200 rounded-full animate-pulse" />
                                </td>
                                <td className="px-4 py-4">
                                    <div className="space-y-2">
                                        <div className="w-36 h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-24 h-3 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </td>
                                <td className="px-4 py-4">
                                    <div className="w-8 h-8 bg-gray-200 rounded animate-pulse" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

// Pagination component
interface PaginationProps {
    page: number;
    limit: number;
    total: number;
    onPageChange: (page: number) => void;
    onLimitChange: (limit: number) => void;
}

export function Pagination({
    page,
    limit,
    total,
    onPageChange,
    onLimitChange,
}: PaginationProps) {
    const totalPages = Math.ceil(total / limit);
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);

    const pageNumbers = useMemo(() => {
        const pages: (number | string)[] = [];
        const showPages = 5;

        if (totalPages <= showPages) {
            for (let i = 1; i <= totalPages; i++) pages.push(i);
        } else {
            if (page <= 3) {
                for (let i = 1; i <= 4; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            } else if (page >= totalPages - 2) {
                pages.push(1);
                pages.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) pages.push(i);
            } else {
                pages.push(1);
                pages.push('...');
                for (let i = page - 1; i <= page + 1; i++) pages.push(i);
                pages.push('...');
                pages.push(totalPages);
            }
        }

        return pages;
    }, [page, totalPages]);

    if (total === 0) return null;

    return (
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-4 py-3 bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center gap-4">
                <span className="text-sm text-gray-600">
                    Showing <span className="font-medium">{start}</span>–
                    <span className="font-medium">{end}</span> of{' '}
                    <span className="font-medium">{total}</span> employees
                </span>
                <select
                    value={limit}
                    onChange={(e) => onLimitChange(parseInt(e.target.value))}
                    className="px-2 py-1 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                >
                    <option value={10}>10 / page</option>
                    <option value={25}>25 / page</option>
                    <option value={50}>50 / page</option>
                </select>
            </div>

            <div className="flex items-center gap-1">
                <button
                    onClick={() => onPageChange(page - 1)}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Prev
                </button>
                {pageNumbers.map((p, i) =>
                    typeof p === 'number' ? (
                        <button
                            key={i}
                            onClick={() => onPageChange(p)}
                            className={`w-8 h-8 text-sm font-medium rounded-lg ${p === page
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-600 hover:bg-gray-100'
                                }`}
                        >
                            {p}
                        </button>
                    ) : (
                        <span key={i} className="px-2 text-gray-400">
                            {p}
                        </span>
                    )
                )}
                <button
                    onClick={() => onPageChange(page + 1)}
                    disabled={page >= totalPages}
                    className="px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    Next
                </button>
            </div>
        </div>
    );
}

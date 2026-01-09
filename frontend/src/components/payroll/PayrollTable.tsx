'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    MoreVertical,
    Eye,
    Play,
    CheckCircle,
    XCircle,
    Download,
    FileText,
    ChevronUp,
    ChevronDown,
} from 'lucide-react';
import { PayrollRunDto, PayrollRunStatus, formatCurrency, getMonthName } from '@/types/payroll';
import { PayrollStatusBadge } from './PayrollComponents';

interface PayrollTableProps {
    runs: PayrollRunDto[];
    isLoading: boolean;
    sortBy: string;
    sortOrder: 'ASC' | 'DESC';
    onSort: (column: string) => void;
    currentUserRole: string;
    onAction: (action: string, run: PayrollRunDto) => void;
}

export function PayrollTable({
    runs,
    isLoading,
    sortBy,
    sortOrder,
    onSort,
    currentUserRole,
    onAction,
}: PayrollTableProps) {
    const router = useRouter();
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);

    const isAdmin = currentUserRole === 'ADMIN';
    const isManager = currentUserRole === 'MANAGER';
    const canProcess = isAdmin || isManager;

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

    const ActionMenu = ({ run }: { run: PayrollRunDto }) => {
        const isOpen = openMenuId === run.runId;

        const getActions = () => {
            const actions: Array<{
                key: string;
                label: string;
                icon: React.ReactNode;
                className?: string;
                show: boolean;
            }> = [
                    {
                        key: 'view',
                        label: 'View Details',
                        icon: <Eye className="w-4 h-4" />,
                        show: true,
                    },
                    {
                        key: 'process',
                        label: 'Process Payroll',
                        icon: <Play className="w-4 h-4" />,
                        show: run.status === PayrollRunStatus.DRAFT && canProcess,
                    },
                    {
                        key: 'approve',
                        label: 'Approve',
                        icon: <CheckCircle className="w-4 h-4" />,
                        className: 'text-green-600 hover:bg-green-50',
                        show: run.status === PayrollRunStatus.PROCESSING && isAdmin,
                    },
                    {
                        key: 'cancel',
                        label: 'Cancel Run',
                        icon: <XCircle className="w-4 h-4" />,
                        className: 'text-red-600 hover:bg-red-50',
                        show: run.status === PayrollRunStatus.PROCESSING && isAdmin,
                    },
                    {
                        key: 'export',
                        label: 'Export CSV',
                        icon: <Download className="w-4 h-4" />,
                        show: run.status === PayrollRunStatus.COMPLETED,
                    },
                    {
                        key: 'report',
                        label: 'Download Report',
                        icon: <FileText className="w-4 h-4" />,
                        show: run.status === PayrollRunStatus.COMPLETED,
                    },
                ];

            return actions.filter((a) => a.show);
        };

        const actions = getActions();

        return (
            <div className="relative">
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        setOpenMenuId(isOpen ? null : run.runId);
                    }}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                >
                    <MoreVertical className="w-4 h-4 text-gray-500" />
                </button>

                {isOpen && (
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 top-full mt-1 z-20 w-48 bg-white rounded-lg shadow-lg border border-gray-200 py-1">
                            {actions.map((action) => (
                                <button
                                    key={action.key}
                                    onClick={() => {
                                        onAction(action.key, run);
                                        setOpenMenuId(null);
                                    }}
                                    className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-gray-50 ${action.className || 'text-gray-700'
                                        }`}
                                >
                                    {action.icon}
                                    {action.label}
                                </button>
                            ))}
                        </div>
                    </>
                )}
            </div>
        );
    };

    if (isLoading) {
        return <TableSkeleton />;
    }

    if (runs.length === 0) {
        return null; // Parent handles empty state
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead>
                        <tr className="bg-gray-50 border-b border-gray-200">
                            <th className="px-6 py-3 text-left text-sm">
                                <SortHeader column="month" label="Period" />
                            </th>
                            <th className="px-6 py-3 text-left text-sm">
                                <SortHeader column="runDate" label="Run Date" />
                            </th>
                            <th className="px-6 py-3 text-left text-sm">
                                <SortHeader column="status" label="Status" />
                            </th>
                            <th className="px-6 py-3 text-left text-sm">
                                <span className="font-semibold text-gray-600">Employees</span>
                            </th>
                            <th className="px-6 py-3 text-left text-sm">
                                <SortHeader column="totalGross" label="Total Gross" />
                            </th>
                            <th className="px-6 py-3 text-left text-sm">
                                <SortHeader column="totalNet" label="Total Net" />
                            </th>
                            <th className="px-6 py-3 text-left text-sm">
                                <span className="font-semibold text-gray-600">Created By</span>
                            </th>
                            <th className="w-16 px-6 py-3"></th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {runs.map((run) => (
                            <tr
                                key={run.runId}
                                className="hover:bg-gray-50 transition-colors cursor-pointer"
                                onClick={() => router.push(`/dashboard/payroll/runs/${run.runId}`)}
                            >
                                <td className="px-6 py-4">
                                    <div>
                                        <div className="font-medium text-gray-900">
                                            {getMonthName(run.month)} {run.year}
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {run.periodStart} → {run.periodEnd}
                                        </div>
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {new Date(run.runDate || run.createdAt).toLocaleDateString()}
                                </td>
                                <td className="px-6 py-4">
                                    <PayrollStatusBadge status={run.status} size="sm" />
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {run.totalEmployees}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-900">
                                    {formatCurrency(run.totalGross)}
                                </td>
                                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                                    {formatCurrency(run.totalNet)}
                                </td>
                                <td className="px-6 py-4 text-sm text-gray-600">
                                    {run.createdByName || `Employee #${run.createdBy}`}
                                </td>
                                <td className="px-6 py-4" onClick={(e) => e.stopPropagation()}>
                                    <ActionMenu run={run} />
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
                            {['Period', 'Run Date', 'Status', 'Employees', 'Total Gross', 'Total Net', 'Created By', ''].map((h, i) => (
                                <th key={i} className="px-6 py-3">
                                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                        {[...Array(5)].map((_, i) => (
                            <tr key={i}>
                                <td className="px-6 py-4">
                                    <div className="space-y-1">
                                        <div className="w-28 h-4 bg-gray-200 rounded animate-pulse" />
                                        <div className="w-20 h-3 bg-gray-200 rounded animate-pulse" />
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 h-6 bg-gray-200 rounded-full animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-12 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
                                    <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                                <td className="px-6 py-4">
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

export function PayrollPagination({
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
                    <span className="font-medium">{total}</span> runs
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

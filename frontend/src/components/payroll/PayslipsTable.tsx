'use client';

import { useState, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
    Search,
    ChevronUp,
    ChevronDown,
    MoreVertical,
    Eye,
    Download,
    Edit,
    X,
} from 'lucide-react';
import { formatCurrency } from '@/types/payroll';
import { Modal } from '@/components/employees/ProfileComponents';

export interface PayslipDto {
    payslipId: number;
    employeeId: number;
    employeeNo: string;
    employeeName: string;
    departmentName?: string;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    components?: Array<{
        name: string;
        type: 'EARNING' | 'DEDUCTION';
        amount: number;
    }>;
}

interface PayslipsTableProps {
    payslips: PayslipDto[];
    isLoading: boolean;
    isDraft: boolean;
    onDownload: (payslipId: number) => void;
    onEdit?: (payslip: PayslipDto) => void;
}

export function PayslipsTable({
    payslips,
    isLoading,
    isDraft,
    onDownload,
    onEdit,
}: PayslipsTableProps) {
    const router = useRouter();
    const [search, setSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState('');
    const [sortBy, setSortBy] = useState('employeeNo');
    const [sortOrder, setSortOrder] = useState<'ASC' | 'DESC'>('ASC');
    const [openMenuId, setOpenMenuId] = useState<number | null>(null);
    const [selectedPayslip, setSelectedPayslip] = useState<PayslipDto | null>(null);

    // Get unique departments
    const departments = useMemo(() => {
        const depts = new Set(payslips.map((p) => p.departmentName).filter(Boolean));
        return Array.from(depts).sort();
    }, [payslips]);

    // Filter and sort payslips
    const filteredPayslips = useMemo(() => {
        let result = [...payslips];

        // Search filter
        if (search) {
            const searchLower = search.toLowerCase();
            result = result.filter(
                (p) =>
                    p.employeeNo.toLowerCase().includes(searchLower) ||
                    p.employeeName.toLowerCase().includes(searchLower)
            );
        }

        // Department filter
        if (departmentFilter) {
            result = result.filter((p) => p.departmentName === departmentFilter);
        }

        // Sort
        result.sort((a, b) => {
            let aVal: any = a[sortBy as keyof PayslipDto];
            let bVal: any = b[sortBy as keyof PayslipDto];

            if (typeof aVal === 'string') {
                aVal = aVal.toLowerCase();
                bVal = bVal?.toLowerCase() || '';
            }

            if (aVal < bVal) return sortOrder === 'ASC' ? -1 : 1;
            if (aVal > bVal) return sortOrder === 'ASC' ? 1 : -1;
            return 0;
        });

        return result;
    }, [payslips, search, departmentFilter, sortBy, sortOrder]);

    const handleSort = (column: string) => {
        if (sortBy === column) {
            setSortOrder((prev) => (prev === 'ASC' ? 'DESC' : 'ASC'));
        } else {
            setSortBy(column);
            setSortOrder('ASC');
        }
    };

    const SortHeader = ({ column, label }: { column: string; label: string }) => {
        const isActive = sortBy === column;
        return (
            <button
                onClick={() => handleSort(column)}
                className="flex items-center gap-1 font-semibold text-gray-600 hover:text-gray-900"
            >
                {label}
                {isActive && (sortOrder === 'ASC' ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />)}
            </button>
        );
    };

    if (isLoading) {
        return <TableSkeleton />;
    }

    return (
        <div className="space-y-4">
            {/* Filters */}
            <div className="flex flex-wrap gap-4">
                <div className="relative flex-1 min-w-[200px]">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search by name or employee no..."
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-sm"
                    />
                </div>
                <select
                    value={departmentFilter}
                    onChange={(e) => setDepartmentFilter(e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-lg text-sm min-w-[150px]"
                >
                    <option value="">All Departments</option>
                    {departments.map((dept) => (
                        <option key={dept} value={dept}>{dept}</option>
                    ))}
                </select>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-200">
                                <th className="px-4 py-3 text-left text-sm">
                                    <SortHeader column="employeeNo" label="Employee No" />
                                </th>
                                <th className="px-4 py-3 text-left text-sm">
                                    <SortHeader column="employeeName" label="Employee Name" />
                                </th>
                                <th className="px-4 py-3 text-left text-sm">
                                    <SortHeader column="departmentName" label="Department" />
                                </th>
                                <th className="px-4 py-3 text-right text-sm">
                                    <SortHeader column="grossSalary" label="Gross" />
                                </th>
                                <th className="px-4 py-3 text-right text-sm">
                                    <SortHeader column="totalDeductions" label="Deductions" />
                                </th>
                                <th className="px-4 py-3 text-right text-sm">
                                    <SortHeader column="netSalary" label="Net Pay" />
                                </th>
                                <th className="px-4 py-3 text-left text-sm">Status</th>
                                <th className="w-16 px-4 py-3"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredPayslips.length === 0 ? (
                                <tr>
                                    <td colSpan={8} className="px-4 py-12 text-center text-gray-500">
                                        No payslips found
                                    </td>
                                </tr>
                            ) : (
                                filteredPayslips.map((payslip) => (
                                    <tr key={payslip.payslipId} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                            {payslip.employeeNo}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-900">
                                            {payslip.employeeName}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {payslip.departmentName || '-'}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-gray-900">
                                            {formatCurrency(payslip.grossSalary)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right text-red-600">
                                            -{formatCurrency(payslip.totalDeductions)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-right font-semibold text-gray-900">
                                            {formatCurrency(payslip.netSalary)}
                                        </td>
                                        <td className="px-4 py-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${payslip.status === 'PAID' ? 'bg-green-100 text-green-700' :
                                                    payslip.status === 'APPROVED' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-700'
                                                }`}>
                                                {payslip.status}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="relative">
                                                <button
                                                    onClick={() => setOpenMenuId(openMenuId === payslip.payslipId ? null : payslip.payslipId)}
                                                    className="p-1.5 rounded hover:bg-gray-100"
                                                >
                                                    <MoreVertical className="w-4 h-4 text-gray-500" />
                                                </button>
                                                {openMenuId === payslip.payslipId && (
                                                    <>
                                                        <div className="fixed inset-0 z-10" onClick={() => setOpenMenuId(null)} />
                                                        <div className="absolute right-0 top-full mt-1 z-20 w-40 bg-white rounded-lg shadow-lg border py-1">
                                                            <button
                                                                onClick={() => {
                                                                    setSelectedPayslip(payslip);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                                View Details
                                                            </button>
                                                            <button
                                                                onClick={() => {
                                                                    onDownload(payslip.payslipId);
                                                                    setOpenMenuId(null);
                                                                }}
                                                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                            >
                                                                <Download className="w-4 h-4" />
                                                                Download PDF
                                                            </button>
                                                            {isDraft && onEdit && (
                                                                <button
                                                                    onClick={() => {
                                                                        onEdit(payslip);
                                                                        setOpenMenuId(null);
                                                                    }}
                                                                    className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
                                                                >
                                                                    <Edit className="w-4 h-4" />
                                                                    Edit
                                                                </button>
                                                            )}
                                                        </div>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Payslip Detail Modal */}
            <PayslipDetailModal
                payslip={selectedPayslip}
                onClose={() => setSelectedPayslip(null)}
                onDownload={onDownload}
            />
        </div>
    );
}

function PayslipDetailModal({
    payslip,
    onClose,
    onDownload,
}: {
    payslip: PayslipDto | null;
    onClose: () => void;
    onDownload: (id: number) => void;
}) {
    if (!payslip) return null;

    const earnings = payslip.components?.filter((c) => c.type === 'EARNING') || [];
    const deductions = payslip.components?.filter((c) => c.type === 'DEDUCTION') || [];

    return (
        <Modal isOpen={!!payslip} onClose={onClose} title="Payslip Details" size="md">
            <div className="p-6 space-y-6">
                {/* Header */}
                <div className="flex justify-between items-start">
                    <div>
                        <h3 className="font-semibold text-gray-900">{payslip.employeeName}</h3>
                        <p className="text-sm text-gray-500">{payslip.employeeNo}</p>
                        <p className="text-sm text-gray-500">{payslip.departmentName}</p>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${payslip.status === 'PAID' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-700'
                        }`}>
                        {payslip.status}
                    </span>
                </div>

                {/* Earnings */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-2">Earnings</h4>
                    <div className="bg-green-50 rounded-lg p-3 space-y-2">
                        {earnings.length > 0 ? (
                            earnings.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{item.name}</span>
                                    <span className="font-medium text-green-700">{formatCurrency(item.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Gross Salary</span>
                                <span className="font-medium text-green-700">{formatCurrency(payslip.grossSalary)}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-green-200 flex justify-between">
                            <span className="font-medium text-gray-900">Total Earnings</span>
                            <span className="font-bold text-green-700">{formatCurrency(payslip.grossSalary)}</span>
                        </div>
                    </div>
                </div>

                {/* Deductions */}
                <div>
                    <h4 className="font-medium text-gray-900 mb-2">Deductions</h4>
                    <div className="bg-red-50 rounded-lg p-3 space-y-2">
                        {deductions.length > 0 ? (
                            deductions.map((item, i) => (
                                <div key={i} className="flex justify-between text-sm">
                                    <span className="text-gray-700">{item.name}</span>
                                    <span className="font-medium text-red-700">-{formatCurrency(item.amount)}</span>
                                </div>
                            ))
                        ) : (
                            <div className="flex justify-between text-sm">
                                <span className="text-gray-700">Total Deductions</span>
                                <span className="font-medium text-red-700">-{formatCurrency(payslip.totalDeductions)}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-red-200 flex justify-between">
                            <span className="font-medium text-gray-900">Total Deductions</span>
                            <span className="font-bold text-red-700">-{formatCurrency(payslip.totalDeductions)}</span>
                        </div>
                    </div>
                </div>

                {/* Net Pay */}
                <div className="bg-blue-600 rounded-lg p-4 text-white">
                    <div className="flex justify-between items-center">
                        <span className="font-medium">Net Pay</span>
                        <span className="text-2xl font-bold">{formatCurrency(payslip.netSalary)}</span>
                    </div>
                </div>

                {/* Actions */}
                <div className="flex gap-3">
                    <button
                        onClick={onClose}
                        className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                    >
                        Close
                    </button>
                    <button
                        onClick={() => onDownload(payslip.payslipId)}
                        className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Download className="w-4 h-4" />
                        Download PDF
                    </button>
                </div>
            </div>
        </Modal>
    );
}

function TableSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <table className="w-full">
                <thead>
                    <tr className="bg-gray-50 border-b border-gray-200">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
                            <th key={i} className="px-4 py-3">
                                <div className="w-20 h-4 bg-gray-200 rounded animate-pulse" />
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {[...Array(5)].map((_, i) => (
                        <tr key={i} className="border-b border-gray-100">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map((j) => (
                                <td key={j} className="px-4 py-4">
                                    <div className="w-16 h-4 bg-gray-200 rounded animate-pulse" />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

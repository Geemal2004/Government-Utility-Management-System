'use client';

import { Loader2, Check, X, Clock } from 'lucide-react';
import { PayrollRunStatus, STATUS_COLORS } from '@/types/payroll';

interface PayrollStatusBadgeProps {
    status: PayrollRunStatus;
    size?: 'sm' | 'md';
}

export function PayrollStatusBadge({ status, size = 'md' }: PayrollStatusBadgeProps) {
    const colors = STATUS_COLORS[status] || STATUS_COLORS.DRAFT;

    const sizeClasses = size === 'sm'
        ? 'px-2 py-0.5 text-xs'
        : 'px-2.5 py-1 text-sm';

    const getIcon = () => {
        switch (status) {
            case PayrollRunStatus.PROCESSING:
                return <Loader2 className="w-3 h-3 animate-spin" />;
            case PayrollRunStatus.COMPLETED:
                return <Check className="w-3 h-3" />;
            case PayrollRunStatus.CANCELLED:
                return <X className="w-3 h-3" />;
            case PayrollRunStatus.DRAFT:
                return <Clock className="w-3 h-3" />;
            default:
                return null;
        }
    };

    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-medium ${colors.bg} ${colors.text} ${sizeClasses}`}
        >
            {getIcon()}
            {status}
        </span>
    );
}

// Statistics Card
interface StatCardProps {
    title: string;
    value: string | number;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
    trend?: { value: number; isPositive: boolean };
    isLoading?: boolean;
}

export function StatCard({ title, value, subtitle, icon, iconBg, trend, isLoading }: StatCardProps) {
    if (isLoading) {
        return (
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                    <div className="space-y-2">
                        <div className="w-24 h-4 bg-gray-200 rounded animate-pulse" />
                        <div className="w-32 h-7 bg-gray-200 rounded animate-pulse" />
                    </div>
                    <div className="w-12 h-12 bg-gray-200 rounded-xl animate-pulse" />
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm font-medium text-gray-500">{title}</p>
                    <p className="text-2xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-1">{subtitle}</p>
                    )}
                    {trend && (
                        <p className={`text-sm mt-1 ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.isPositive ? '↑' : '↓'} {Math.abs(trend.value)}% from last month
                        </p>
                    )}
                </div>
                <div className={`w-12 h-12 ${iconBg} rounded-xl flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Current Month Highlight Card
interface CurrentMonthCardProps {
    run: {
        runId: number;
        month: string;
        year: number;
        status: PayrollRunStatus;
        totalEmployees: number;
        totalGross: number;
        totalNet: number;
    } | null;
    periodTitle: string;
    onProcess?: () => void;
    onViewDetails?: () => void;
    onCreate?: () => void;
    canProcess: boolean;
    isLoading?: boolean;
}

export function CurrentMonthCard({
    run,
    periodTitle,
    onProcess,
    onViewDetails,
    onCreate,
    canProcess,
    isLoading,
}: CurrentMonthCardProps) {
    if (isLoading) {
        return (
            <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
                <div className="space-y-4">
                    <div className="w-48 h-6 bg-white/20 rounded animate-pulse" />
                    <div className="grid grid-cols-3 gap-4">
                        {[1, 2, 3].map((i) => (
                            <div key={i} className="w-full h-16 bg-white/20 rounded animate-pulse" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!run) {
        return (
            <div className="bg-gradient-to-r from-gray-600 to-gray-700 rounded-2xl p-6 text-white">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h3 className="text-xl font-bold">{periodTitle}</h3>
                        <p className="text-white/70 mt-1">No payroll run for this month</p>
                    </div>
                    <button
                        onClick={onCreate}
                        className="px-6 py-2.5 bg-white text-gray-900 font-medium rounded-lg hover:bg-gray-100 transition-colors"
                    >
                        Create Payroll Run
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-2xl p-6 text-white">
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4 mb-6">
                <div>
                    <div className="flex items-center gap-3">
                        <h3 className="text-xl font-bold">{periodTitle}</h3>
                        <PayrollStatusBadge status={run.status} size="sm" />
                    </div>
                    <p className="text-white/70 mt-1">Current payroll period</p>
                </div>
                <div className="flex gap-2">
                    {run.status === PayrollRunStatus.DRAFT && canProcess && (
                        <button
                            onClick={onProcess}
                            className="px-4 py-2 bg-white text-blue-600 font-medium rounded-lg hover:bg-blue-50 transition-colors"
                        >
                            Process Payroll
                        </button>
                    )}
                    <button
                        onClick={onViewDetails}
                        className="px-4 py-2 bg-white/20 text-white font-medium rounded-lg hover:bg-white/30 transition-colors"
                    >
                        View Details
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-white/70 text-sm">Employees</p>
                    <p className="text-2xl font-bold mt-1">{run.totalEmployees}</p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-white/70 text-sm">Total Gross</p>
                    <p className="text-2xl font-bold mt-1">
                        ${run.totalGross.toLocaleString()}
                    </p>
                </div>
                <div className="bg-white/10 rounded-xl p-4">
                    <p className="text-white/70 text-sm">Total Net</p>
                    <p className="text-2xl font-bold mt-1">
                        ${run.totalNet.toLocaleString()}
                    </p>
                </div>
            </div>
        </div>
    );
}

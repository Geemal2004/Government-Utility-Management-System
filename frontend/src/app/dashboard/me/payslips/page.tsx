'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
    FileText,
    Download,
    Eye,
    Calendar,
    DollarSign,
    TrendingUp,
    Award,
    Loader2,
    AlertCircle,
    RefreshCw,
} from 'lucide-react';
import { formatCurrency, getMonthName, MONTH_NAMES } from '@/types/payroll';
import { PayslipModal } from '@/components/payroll/PayslipView';

// Types
interface Payslip {
    payslipId: number;
    month: string;
    periodStart: string;
    periodEnd: string;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    paidAt?: string;
}

// Get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export default function MyPayslipsPage() {
    const [payslips, setPayslips] = useState<Payslip[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [selectedYear, setSelectedYear] = useState<number | 'all'>('all');
    const [selectedPayslipId, setSelectedPayslipId] = useState<number | null>(null);

    // Current date info
    const currentDate = useMemo(() => new Date(), []);
    const currentYear = currentDate.getFullYear();
    const currentMonth = MONTH_NAMES[currentDate.getMonth()];

    // Year options
    const yearOptions = useMemo(() => {
        const years: number[] = [];
        for (let year = currentYear; year >= currentYear - 5; year--) {
            years.push(year);
        }
        return years;
    }, [currentYear]);

    // Fetch payslips
    const fetchPayslips = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const params = new URLSearchParams();
            if (selectedYear !== 'all') {
                params.set('year', String(selectedYear));
            }
            params.set('limit', '50');

            const response = await fetch(`/api/v1/payroll/me/payslips?${params.toString()}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                throw new Error('Failed to fetch payslips');
            }

            const result = await response.json();
            setPayslips(result.data || result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [selectedYear]);

    useEffect(() => {
        fetchPayslips();
    }, [fetchPayslips]);

    // Filter payslips by year
    const filteredPayslips = useMemo(() => {
        if (selectedYear === 'all') return payslips;
        return payslips.filter((p) => {
            const year = parseInt(p.month.split('-')[0]);
            return year === selectedYear;
        });
    }, [payslips, selectedYear]);

    // Calculate statistics
    const stats = useMemo(() => {
        const thisYearPayslips = payslips.filter((p) => {
            const year = parseInt(p.month.split('-')[0]);
            return year === currentYear;
        });

        const totalThisYear = thisYearPayslips.reduce((sum, p) => sum + p.netSalary, 0);
        const avgMonthly = thisYearPayslips.length > 0 ? totalThisYear / thisYearPayslips.length : 0;

        // Find highest month
        let highest = { month: '', amount: 0 };
        payslips.forEach((p) => {
            if (p.netSalary > highest.amount) {
                highest = {
                    month: `${getMonthName(p.month)} ${p.month.split('-')[0]}`,
                    amount: p.netSalary,
                };
            }
        });

        return {
            totalThisYear,
            avgMonthly,
            highestMonth: highest.month,
            highestAmount: highest.amount,
        };
    }, [payslips, currentYear]);

    // Handle download
    const handleDownload = async (payslipId: number) => {
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/payroll/payslips/${payslipId}/download`, {
                headers: { Authorization: `Bearer ${token}` },
            });

            if (!response.ok) throw new Error('Download failed');

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${payslipId}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download payslip');
        }
    };

    // Format month display
    const formatMonth = (month: string) => {
        const [year, monthNum] = month.split('-');
        return `${MONTH_NAMES[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-6 lg:p-8">
            <div className="max-w-6xl mx-auto space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">My Payslips</h1>
                        <p className="text-gray-500">
                            {currentMonth} {currentYear}
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <select
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value === 'all' ? 'all' : parseInt(e.target.value))}
                            className="px-4 py-2 border border-gray-300 rounded-lg text-sm bg-white focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="all">All Years</option>
                            {yearOptions.map((year) => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Statistics */}
                {!isLoading && !error && payslips.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <StatCard
                            title="This Year Total"
                            value={formatCurrency(stats.totalThisYear)}
                            icon={<DollarSign className="w-5 h-5 text-green-600" />}
                            iconBg="bg-green-100"
                        />
                        <StatCard
                            title="Average Monthly"
                            value={formatCurrency(stats.avgMonthly)}
                            icon={<TrendingUp className="w-5 h-5 text-blue-600" />}
                            iconBg="bg-blue-100"
                        />
                        <StatCard
                            title="Highest Month"
                            value={formatCurrency(stats.highestAmount)}
                            subtitle={stats.highestMonth}
                            icon={<Award className="w-5 h-5 text-purple-600" />}
                            iconBg="bg-purple-100"
                        />
                    </div>
                )}

                {/* Loading State */}
                {isLoading && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
                        <p className="text-gray-500">Loading payslips...</p>
                    </div>
                )}

                {/* Error State */}
                {error && (
                    <div className="flex flex-col items-center justify-center py-16">
                        <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
                        <p className="text-gray-900 font-medium mb-2">Error loading payslips</p>
                        <p className="text-gray-500 mb-4">{error}</p>
                        <button
                            onClick={fetchPayslips}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Retry
                        </button>
                    </div>
                )}

                {/* Empty State */}
                {!isLoading && !error && filteredPayslips.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-16 bg-white rounded-xl shadow-sm border border-gray-200">
                        <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                            <FileText className="w-8 h-8 text-gray-400" />
                        </div>
                        <h3 className="text-lg font-medium text-gray-900 mb-1">
                            No payslips available
                        </h3>
                        <p className="text-gray-500">
                            {selectedYear !== 'all'
                                ? `No payslips found for ${selectedYear}`
                                : 'Your payslips will appear here once processed'}
                        </p>
                    </div>
                )}

                {/* Payslips Grid */}
                {!isLoading && !error && filteredPayslips.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {filteredPayslips.map((payslip) => (
                            <PayslipCard
                                key={payslip.payslipId}
                                payslip={payslip}
                                onView={() => setSelectedPayslipId(payslip.payslipId)}
                                onDownload={() => handleDownload(payslip.payslipId)}
                            />
                        ))}
                    </div>
                )}

                {/* Payslip Modal */}
                {selectedPayslipId && (
                    <PayslipModal
                        payslipId={selectedPayslipId}
                        isOpen={!!selectedPayslipId}
                        onClose={() => setSelectedPayslipId(null)}
                    />
                )}
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({
    title,
    value,
    subtitle,
    icon,
    iconBg,
}: {
    title: string;
    value: string;
    subtitle?: string;
    icon: React.ReactNode;
    iconBg: string;
}) {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500">{title}</p>
                    <p className="text-xl font-bold text-gray-900 mt-1">{value}</p>
                    {subtitle && (
                        <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
                    )}
                </div>
                <div className={`w-10 h-10 ${iconBg} rounded-lg flex items-center justify-center`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

// Payslip Card Component
function PayslipCard({
    payslip,
    onView,
    onDownload,
}: {
    payslip: Payslip;
    onView: () => void;
    onDownload: () => void;
}) {
    const formatMonth = (month: string) => {
        const [year, monthNum] = month.split('-');
        return `${MONTH_NAMES[parseInt(monthNum) - 1]} ${year}`;
    };

    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
                <div>
                    <h3 className="font-semibold text-gray-900">{formatMonth(payslip.month)}</h3>
                    <p className="text-sm text-gray-500">
                        {payslip.paidAt ? (
                            <>Paid on {new Date(payslip.paidAt).toLocaleDateString()}</>
                        ) : (
                            <span className="text-yellow-600">Payment pending</span>
                        )}
                    </p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${payslip.status === 'PAID'
                        ? 'bg-green-100 text-green-700'
                        : payslip.status === 'APPROVED'
                            ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-700'
                    }`}>
                    {payslip.status}
                </span>
            </div>

            <div className="mb-4">
                <p className="text-sm text-gray-500">Net Pay</p>
                <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(payslip.netSalary)}
                </p>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={onView}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                    <Eye className="w-4 h-4" />
                    View Details
                </button>
                <button
                    onClick={onDownload}
                    className="flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                >
                    <Download className="w-4 h-4" />
                </button>
            </div>
        </div>
    );
}

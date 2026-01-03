'use client';

import { useEffect, useState } from 'react';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import {
    Calendar,
    Download,
    Eye,
    Filter,
    Printer,
    Search,
    CheckCircle,
    XCircle,
    Clock,
    RotateCcw,
    CreditCard,
    FileText,
    TrendingUp,
    Mail,
    X,
} from 'lucide-react';

interface PaymentHistory {
    paymentId: number;
    receiptNumber: string;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    paymentStatus: 'COMPLETED' | 'PENDING' | 'FAILED' | 'REFUNDED';
    cardLast4?: string;
    transactionRef: string;
    bills: {
        billNumber: string;
        amount: number;
    }[];
}

type ViewMode = 'timeline' | 'table';
type DateFilter = 'month' | '3months' | 'year' | 'custom';

function CustomerPaymentHistoryPage() {
    const [payments, setPayments] = useState<PaymentHistory[]>([]);
    const [filteredPayments, setFilteredPayments] = useState<PaymentHistory[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [viewMode, setViewMode] = useState<ViewMode>('timeline');
    const [dateFilter, setDateFilter] = useState<DateFilter>('3months');
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedPayment, setSelectedPayment] = useState<PaymentHistory | null>(null);
    const [showFilters, setShowFilters] = useState(false);

    useEffect(() => {
        fetchPaymentHistory();
    }, []);

    useEffect(() => {
        applyFilters();
    }, [payments, dateFilter, statusFilter, searchQuery]);

    const fetchPaymentHistory = async () => {
        setIsLoading(true);
        try {
            const response = await fetch('/api/v1/payments/customer/history', {
                headers: getCustomerAuthHeader(),
            });

            if (response.ok) {
                const data = await response.json();
                setPayments(data || []);
            }
        } catch (error) {
            console.error('Failed to fetch payment history:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const applyFilters = () => {
        let filtered = [...payments];

        // Date filter
        const now = new Date();
        const filterDate = new Date();

        switch (dateFilter) {
            case 'month':
                filterDate.setMonth(now.getMonth() - 1);
                break;
            case '3months':
                filterDate.setMonth(now.getMonth() - 3);
                break;
            case 'year':
                filterDate.setFullYear(now.getFullYear() - 1);
                break;
        }

        if (dateFilter !== 'custom') {
            filtered = filtered.filter(p => new Date(p.paymentDate) >= filterDate);
        }

        // Status filter
        if (statusFilter !== 'ALL') {
            filtered = filtered.filter(p => p.paymentStatus === statusFilter);
        }

        // Search
        if (searchQuery) {
            filtered = filtered.filter(
                p =>
                    p.receiptNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
                    p.bills.some(b => b.billNumber.toLowerCase().includes(searchQuery.toLowerCase()))
            );
        }

        setFilteredPayments(filtered);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(amount);
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        const badges = {
            COMPLETED: (
                <span className="px-3 py-1 bg-green-100 text-green-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> COMPLETED
                </span>
            ),
            PENDING: (
                <span className="px-3 py-1 bg-orange-100 text-orange-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <Clock className="w-3 h-3 animate-spin" /> PENDING
                </span>
            ),
            FAILED: (
                <span className="px-3 py-1 bg-red-100 text-red-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <XCircle className="w-3 h-3" /> FAILED
                </span>
            ),
            REFUNDED: (
                <span className="px-3 py-1 bg-gray-100 text-gray-800 text-xs font-semibold rounded-full flex items-center gap-1">
                    <RotateCcw className="w-3 h-3" /> REFUNDED
                </span>
            ),
        };

        return badges[status as keyof typeof badges] || badges.COMPLETED;
    };

    // Calculate statistics
    const totalPaid = payments
        .filter(p => p.paymentStatus === 'COMPLETED')
        .reduce((sum, p) => sum + p.amount, 0);

    const thisMonthPayments = payments.filter(p => {
        const paymentDate = new Date(p.paymentDate);
        const now = new Date();
        return (
            paymentDate.getMonth() === now.getMonth() &&
            paymentDate.getFullYear() === now.getFullYear() &&
            p.paymentStatus === 'COMPLETED'
        );
    });

    const thisMonthTotal = thisMonthPayments.reduce((sum, p) => sum + p.amount, 0);

    const lastPayment = payments.find(p => p.paymentStatus === 'COMPLETED');

    const exportToCSV = () => {
        const headers = ['Date', 'Receipt No', 'Amount', 'Method', 'Status', 'Bills'];
        const rows = filteredPayments.map(p => [
            formatDate(p.paymentDate),
            p.receiptNumber,
            p.amount,
            p.paymentMethod,
            p.paymentStatus,
            p.bills.map(b => b.billNumber).join('; '),
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `payment-history-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Header */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={exportToCSV}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                            <button
                                onClick={() => setShowFilters(!showFilters)}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Filter className="w-4 h-4" />
                                Filters
                            </button>
                        </div>
                    </div>

                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 p-4 rounded-lg">
                            <p className="text-sm text-blue-600 mb-1">Total Paid</p>
                            <p className="text-2xl font-bold text-blue-900">{formatCurrency(totalPaid)}</p>
                        </div>
                        <div className="bg-green-50 p-4 rounded-lg">
                            <p className="text-sm text-green-600 mb-1">This Month</p>
                            <p className="text-2xl font-bold text-green-900">{formatCurrency(thisMonthTotal)}</p>
                        </div>
                        <div className="bg-purple-50 p-4 rounded-lg">
                            <p className="text-sm text-purple-600 mb-1">Last Payment</p>
                            <p className="text-lg font-bold text-purple-900">
                                {lastPayment ? formatDate(lastPayment.paymentDate) : 'N/A'}
                            </p>
                        </div>
                        <div className="bg-orange-50 p-4 rounded-lg">
                            <p className="text-sm text-orange-600 mb-1">Total Payments</p>
                            <p className="text-2xl font-bold text-orange-900">{payments.length}</p>
                        </div>
                    </div>

                    {/* Filters */}
                    {showFilters && (
                        <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Date Range
                                    </label>
                                    <select
                                        value={dateFilter}
                                        onChange={e => setDateFilter(e.target.value as DateFilter)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="month">Last Month</option>
                                        <option value="3months">Last 3 Months</option>
                                        <option value="year">Last Year</option>
                                        <option value="custom">Custom Range</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Status
                                    </label>
                                    <select
                                        value={statusFilter}
                                        onChange={e => setStatusFilter(e.target.value)}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value="ALL">All</option>
                                        <option value="COMPLETED">Completed</option>
                                        <option value="PENDING">Pending</option>
                                        <option value="FAILED">Failed</option>
                                        <option value="REFUNDED">Refunded</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Search
                                    </label>
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Receipt or bill number..."
                                            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setViewMode('timeline')}
                        className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'timeline'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Timeline View
                    </button>
                    <button
                        onClick={() => setViewMode('table')}
                        className={`px-4 py-2 rounded-lg font-medium ${viewMode === 'table'
                                ? 'bg-blue-600 text-white'
                                : 'bg-white text-gray-700 border border-gray-300'
                            }`}
                    >
                        Table View
                    </button>
                </div>

                {/* Empty State */}
                {filteredPayments.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-xl">
                        <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">No Payments Yet</h3>
                        <p className="text-gray-600 mb-6">Start paying your bills to see your payment history</p>
                        <a
                            href="/customer/bills"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                            Pay Bills Now
                        </a>
                    </div>
                ) : viewMode === 'timeline' ? (
                    /* Timeline View */
                    <div className="space-y-6">
                        {filteredPayments.map(payment => (
                            <div key={payment.paymentId} className="relative">
                                {/* Timeline Dot */}
                                <div className="absolute left-0 top-0 w-4 h-4 bg-blue-600 rounded-full border-4 border-white shadow-lg"></div>

                                {/* Payment Card */}
                                <div className="ml-8 bg-white rounded-xl shadow-lg p-6 hover:shadow-xl transition-shadow">
                                    <div className="flex items-start justify-between mb-4">
                                        <div>
                                            <p className="text-sm text-gray-500 mb-1">
                                                {formatDateTime(payment.paymentDate)}
                                            </p>
                                            <h3 className="text-lg font-bold text-gray-900">
                                                {payment.receiptNumber}
                                            </h3>
                                        </div>
                                        {getStatusBadge(payment.paymentStatus)}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Amount</p>
                                            <p className="text-2xl font-bold text-gray-900">
                                                {formatCurrency(payment.amount)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600 mb-1">Payment Method</p>
                                            <p className="font-semibold text-gray-900">
                                                {payment.paymentMethod}
                                                {payment.cardLast4 && ` (****${payment.cardLast4})`}
                                            </p>
                                        </div>
                                    </div>

                                    {payment.bills.length > 0 && (
                                        <div className="mb-4">
                                            <p className="text-sm font-semibold text-gray-700 mb-2">
                                                Bills Paid:
                                            </p>
                                            <div className="space-y-1">
                                                {payment.bills.map((bill, index) => (
                                                    <div
                                                        key={index}
                                                        className="flex items-center justify-between text-sm"
                                                    >
                                                        <span className="text-gray-600">• {bill.billNumber}</span>
                                                        <span className="font-medium text-gray-900">
                                                            {formatCurrency(bill.amount)}
                                                        </span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}

                                    <div className="flex gap-2 pt-4 border-t border-gray-200">
                                        <button
                                            onClick={() => setSelectedPayment(payment)}
                                            className="flex items-center gap-2 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg font-medium"
                                        >
                                            <Eye className="w-4 h-4" />
                                            View Receipt
                                        </button>
                                        <button
                                            onClick={() => window.print()}
                                            className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:bg-gray-50 rounded-lg font-medium"
                                        >
                                            <Download className="w-4 h-4" />
                                            Download
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    /* Table View */
                    <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Date
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Receipt No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Bills
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Method
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Status
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {filteredPayments.map(payment => (
                                    <tr key={payment.paymentId} className="hover:bg-gray-50">
                                        <td className="px-4 py-4 text-sm text-gray-900">
                                            {formatDate(payment.paymentDate)}
                                        </td>
                                        <td className="px-4 py-4 font-medium text-gray-900">
                                            {payment.receiptNumber}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {payment.bills.length} bill(s)
                                        </td>
                                        <td className="px-4 py-4 font-semibold text-gray-900">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-4 py-4 text-sm text-gray-600">
                                            {payment.paymentMethod}
                                        </td>
                                        <td className="px-4 py-4">{getStatusBadge(payment.paymentStatus)}</td>
                                        <td className="px-4 py-4">
                                            <div className="flex gap-2">
                                                <button
                                                    onClick={() => setSelectedPayment(payment)}
                                                    className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => window.print()}
                                                    className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                >
                                                    <Printer className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Payment Details Modal */}
            {selectedPayment && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b px-6 py-4 flex items-center justify-between">
                            <h2 className="text-xl font-bold">Payment Details</h2>
                            <button
                                onClick={() => setSelectedPayment(null)}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-6">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Receipt Number</p>
                                    <p className="font-semibold">{selectedPayment.receiptNumber}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Date & Time</p>
                                    <p className="font-semibold">{formatDateTime(selectedPayment.paymentDate)}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Amount</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatCurrency(selectedPayment.amount)}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Status</p>
                                    {getStatusBadge(selectedPayment.paymentStatus)}
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Payment Method</p>
                                    <p className="font-semibold">{selectedPayment.paymentMethod}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Transaction ID</p>
                                    <p className="text-sm font-mono">{selectedPayment.transactionRef}</p>
                                </div>
                            </div>

                            <div>
                                <h3 className="font-semibold mb-2">Bills Paid</h3>
                                <div className="space-y-2">
                                    {selectedPayment.bills.map((bill, index) => (
                                        <div
                                            key={index}
                                            className="flex justify-between p-3 bg-gray-50 rounded-lg"
                                        >
                                            <span>{bill.billNumber}</span>
                                            <span className="font-semibold">{formatCurrency(bill.amount)}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <button
                                onClick={() => window.print()}
                                className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                            >
                                Download Receipt
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default withCustomerAuth(CustomerPaymentHistoryPage);

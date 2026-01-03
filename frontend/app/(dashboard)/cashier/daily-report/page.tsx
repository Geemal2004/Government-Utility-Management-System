'use client';

import { useEffect, useState } from 'react';
import { Calendar, Printer, Download, Search, TrendingUp } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';

interface DailyReportData {
    date: Date;
    cashierName: string;
    cashierId: number;
    openingBalance: number;
    totalCollected: number;
    cashCollected: number;
    nonCashCollected: number;
    totalTransactions: number;
    byMethod: {
        category: string;
        count: number;
        amount: number;
    }[];
    closingBalance: number;
    paymentsList: any[];
}

interface HourlyData {
    hour: string;
    amount: number;
}

export default function CashierDailyReportPage() {
    const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
    const [reportData, setReportData] = useState<DailyReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [actualCashCount, setActualCashCount] = useState('');
    const [varianceReason, setVarianceReason] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    const itemsPerPage = 50;

    useEffect(() => {
        fetchDailyReport();
    }, [selectedDate]);

    const fetchDailyReport = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/v1/payments/cashier/daily-collections?date=${selectedDate}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setReportData(data);
            }
        } catch (error) {
            console.error('Failed to fetch daily report:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleExportCSV = () => {
        if (!reportData) return;

        const headers = ['Time', 'Receipt No', 'Customer', 'Bill No', 'Amount', 'Method', 'Transaction Ref'];
        const rows = reportData.paymentsList.map(payment => [
            new Date(payment.paymentDate).toLocaleTimeString(),
            payment.receiptNumber,
            payment.customerName || 'N/A',
            payment.bills?.[0]?.billNumber || 'N/A',
            payment.amount,
            payment.paymentMethod,
            payment.transactionRef || '',
        ]);

        const csv = [headers, ...rows].map(row => row.join(',')).join('\n');
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `daily-report-${selectedDate}.csv`;
        a.click();
    };

    const handleSubmitReconciliation = async () => {
        const variance = Number(actualCashCount) - (reportData?.closingBalance || 0);

        if (Math.abs(variance) > 0.01 && !varianceReason.trim()) {
            alert('Please provide a reason for the variance');
            return;
        }

        try {
            const response = await fetch('/api/v1/payments/cashier/reconcile', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    date: selectedDate,
                    actualCashCount: Number(actualCashCount),
                    variance,
                    reason: varianceReason,
                }),
            });

            if (response.ok) {
                alert('Reconciliation submitted successfully');
                fetchDailyReport();
            }
        } catch (error) {
            console.error('Failed to submit reconciliation:', error);
            alert('Failed to submit reconciliation');
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(amount);
    };

    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    // Prepare hourly data for chart
    const hourlyData: HourlyData[] = reportData
        ? Array.from({ length: 10 }, (_, i) => {
            const hour = i + 8; // 8 AM to 5 PM
            const hourStr = `${hour}:00`;
            const hourPayments = reportData.paymentsList.filter(payment => {
                const paymentHour = new Date(payment.paymentDate).getHours();
                return paymentHour === hour;
            });
            const amount = hourPayments.reduce((sum, p) => sum + p.amount, 0);
            return { hour: hourStr, amount };
        })
        : [];

    // Filter and paginate transactions
    const filteredTransactions = reportData?.paymentsList.filter(payment =>
        payment.receiptNumber?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        payment.customerName?.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

    const paginatedTransactions = filteredTransactions.slice(
        (currentPage - 1) * itemsPerPage,
        currentPage * itemsPerPage
    );

    const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

    const averageTransaction =
        reportData && reportData.totalTransactions > 0
            ? reportData.totalCollected / reportData.totalTransactions
            : 0;

    const variance = actualCashCount
        ? Number(actualCashCount) - (reportData?.closingBalance || 0)
        : 0;

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
                {/* Report Header */}
                <div className="bg-white rounded-xl shadow-lg p-6 print:shadow-none">
                    <div className="flex items-center justify-between mb-6 print:mb-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
                                Daily Collections Report
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Cashier: <span className="font-semibold">{reportData?.cashierName || 'N/A'}</span>
                            </p>
                            <p className="text-sm text-gray-500">
                                Generated: {new Date().toLocaleString()}
                            </p>
                        </div>
                        <div className="flex gap-2 print:hidden">
                            <button
                                onClick={handlePrint}
                                className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
                            >
                                <Printer className="w-4 h-4" />
                                Print
                            </button>
                            <button
                                onClick={handleExportCSV}
                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                            >
                                <Download className="w-4 h-4" />
                                Export
                            </button>
                        </div>
                    </div>

                    {/* Date Selector */}
                    <div className="flex items-center gap-4 print:hidden">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <input
                            type="date"
                            value={selectedDate}
                            onChange={(e) => setSelectedDate(e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className="px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Summary Statistics - Row 1 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl p-6 text-white shadow-lg">
                        <p className="text-blue-100 text-sm mb-1">Total Collections</p>
                        <p className="text-4xl font-bold">{formatCurrency(reportData?.totalCollected || 0)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-green-500">
                        <p className="text-sm text-gray-600 mb-1">Transactions</p>
                        <p className="text-3xl font-bold text-gray-900">{reportData?.totalTransactions || 0}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600 mb-1">Average Transaction</p>
                        <p className="text-3xl font-bold text-gray-900">{formatCurrency(averageTransaction)}</p>
                    </div>
                    <div className="bg-white rounded-xl p-6 shadow-lg border-l-4 border-orange-500">
                        <p className="text-sm text-gray-600 mb-1">Opening Balance</p>
                        <p className="text-3xl font-bold text-gray-900">
                            {formatCurrency(reportData?.openingBalance || 0)}
                        </p>
                    </div>
                </div>

                {/* Summary Statistics - Row 2 */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="bg-white rounded-xl p-6 shadow-lg">
                        <p className="text-sm text-gray-600 mb-1">Cash Collections</p>
                        <p className="text-2xl font-bold text-green-600">
                            {formatCurrency(reportData?.cashCollected || 0)}
                        </p>
                    </div>
                    {reportData?.byMethod.map((method, index) => (
                        <div key={index} className="bg-white rounded-xl p-6 shadow-lg">
                            <p className="text-sm text-gray-600 mb-1">{method.category}</p>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(method.amount)}</p>
                            <p className="text-xs text-gray-500 mt-1">{method.count} transactions</p>
                        </div>
                    ))}
                </div>

                {/* Collections by Payment Method Table */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Collections by Payment Method</h2>
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Payment Method
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Count
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                    Amount
                                </th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {reportData?.byMethod.map((method, index) => (
                                <tr key={index}>
                                    <td className="px-4 py-3 font-medium text-gray-900">{method.category}</td>
                                    <td className="px-4 py-3 text-gray-600">{method.count}</td>
                                    <td className="px-4 py-3 font-semibold text-gray-900">
                                        {formatCurrency(method.amount)}
                                    </td>
                                </tr>
                            ))}
                            <tr className="bg-gray-50 font-bold">
                                <td className="px-4 py-3">TOTAL</td>
                                <td className="px-4 py-3">{reportData?.totalTransactions || 0}</td>
                                <td className="px-4 py-3 text-blue-600">
                                    {formatCurrency(reportData?.totalCollected || 0)}
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Hourly Collections Chart */}
                <div className="bg-white rounded-xl shadow-lg p-6 print:break-before-page">
                    <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
                        <TrendingUp className="w-5 h-5 text-blue-600" />
                        Hourly Collections
                    </h2>
                    <ResponsiveContainer width="100%" height={300}>
                        <BarChart data={hourlyData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis dataKey="hour" />
                            <YAxis />
                            <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                            <Legend />
                            <Bar dataKey="amount" fill="#3b82f6" name="Amount Collected" />
                        </BarChart>
                    </ResponsiveContainer>
                </div>

                {/* Detailed Transactions Table */}
                <div className="bg-white rounded-xl shadow-lg p-6 print:break-before-page">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-900">Detailed Transactions</h2>
                        <div className="flex items-center gap-2 print:hidden">
                            <Search className="w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search receipts or customers..."
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Time
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Receipt No
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Customer
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Amount
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Method
                                    </th>
                                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase">
                                        Transaction Ref
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y">
                                {paginatedTransactions.map((payment, index) => (
                                    <tr key={index} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {formatTime(payment.paymentDate)}
                                        </td>
                                        <td className="px-4 py-3 font-medium text-gray-900">
                                            {payment.receiptNumber}
                                        </td>
                                        <td className="px-4 py-3 text-gray-600">{payment.customerName || 'N/A'}</td>
                                        <td className="px-4 py-3 font-semibold text-gray-900">
                                            {formatCurrency(payment.amount)}
                                        </td>
                                        <td className="px-4 py-3 text-sm text-gray-600">{payment.paymentMethod}</td>
                                        <td className="px-4 py-3 text-sm text-gray-600">
                                            {payment.transactionRef || '-'}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="mt-4 flex items-center justify-between print:hidden">
                            <p className="text-sm text-gray-600">
                                Showing {((currentPage - 1) * itemsPerPage) + 1} to{' '}
                                {Math.min(currentPage * itemsPerPage, filteredTransactions.length)} of{' '}
                                {filteredTransactions.length} transactions
                            </p>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Previous
                                </button>
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className="px-4 py-2 border border-gray-300 rounded-lg disabled:opacity-50 hover:bg-gray-50"
                                >
                                    Next
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Cash Reconciliation */}
                <div className="bg-white rounded-xl shadow-lg p-6 print:break-before-page">
                    <h2 className="text-xl font-bold text-gray-900 mb-4">Cash Reconciliation</h2>
                    <div className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <p className="text-sm text-gray-600">Opening Balance:</p>
                                <p className="text-xl font-semibold text-gray-900">
                                    {formatCurrency(reportData?.openingBalance || 0)}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Cash Received Today:</p>
                                <p className="text-xl font-semibold text-green-600">
                                    +{formatCurrency(reportData?.cashCollected || 0)}
                                </p>
                            </div>
                        </div>

                        <div className="pt-4 border-t">
                            <p className="text-sm text-gray-600">Expected Closing Balance:</p>
                            <p className="text-2xl font-bold text-blue-600">
                                {formatCurrency(reportData?.closingBalance || 0)}
                            </p>
                        </div>

                        <div className="pt-4 border-t print:hidden">
                            <label className="block text-sm font-semibold text-gray-700 mb-2">
                                Actual Cash Count:
                            </label>
                            <input
                                type="number"
                                step="0.01"
                                value={actualCashCount}
                                onChange={(e) => setActualCashCount(e.target.value)}
                                placeholder="Enter actual cash counted"
                                className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {actualCashCount && (
                            <div className={`p-4 rounded-lg ${Math.abs(variance) < 0.01 ? 'bg-green-50' : 'bg-yellow-50'}`}>
                                <p className="text-sm text-gray-600">Variance:</p>
                                <p className={`text-2xl font-bold ${variance >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                                    {variance >= 0 ? '+' : ''}{formatCurrency(variance)}
                                </p>
                            </div>
                        )}

                        {Math.abs(variance) > 0.01 && (
                            <div className="print:hidden">
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Variance Reason:
                                </label>
                                <textarea
                                    value={varianceReason}
                                    onChange={(e) => setVarianceReason(e.target.value)}
                                    rows={3}
                                    placeholder="Explain the variance..."
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        )}

                        <button
                            onClick={handleSubmitReconciliation}
                            disabled={!actualCashCount}
                            className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg print:hidden"
                        >
                            Submit Reconciliation
                        </button>
                    </div>

                    {/* Signature Lines for Print */}
                    <div className="hidden print:block mt-12 pt-8 border-t space-y-8">
                        <div className="grid grid-cols-2 gap-8">
                            <div>
                                <div className="border-t border-black pt-2">
                                    <p className="text-sm">Cashier Signature</p>
                                    <p className="text-xs text-gray-600">{reportData?.cashierName}</p>
                                </div>
                            </div>
                            <div>
                                <div className="border-t border-black pt-2">
                                    <p className="text-sm">Manager Approval</p>
                                    <p className="text-xs text-gray-600">Name & Signature</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    @page {
                        margin: 1cm;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:block {
                        display: block !important;
                    }
                    .print\\:break-before-page {
                        break-before: page;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                }
            `}</style>
        </div>
    );
}

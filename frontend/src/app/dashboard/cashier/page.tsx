'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    CreditCard,
    Users,
    DollarSign,
    FileText,
    Search,
    Printer,
    Eye,
    Clock,
    AlertCircle,
    TrendingUp,
} from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import RecordPaymentModal from '@/components/RecordPaymentModal';

interface DailySummary {
    totalCollections: number;
    transactionCount: number;
    cashCollected: number;
    cardCollected: number;
    lastTransactionTime: string | null;
}

interface Transaction {
    paymentId: number;
    receiptNumber: string;
    paymentDate: string;
    customerName: string;
    amount: number;
    paymentMethod: string;
}

interface CashRegister {
    openingBalance: number;
    cashReceived: number;
    expected: number;
}

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#6366f1'];

export default function CashierDashboard() {
    const router = useRouter();
    const [dailySummary, setDailySummary] = useState<DailySummary>({
        totalCollections: 0,
        transactionCount: 0,
        cashCollected: 0,
        cardCollected: 0,
        lastTransactionTime: null,
    });
    const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
    const [cashRegister, setCashRegister] = useState<CashRegister>({
        openingBalance: 500,
        cashReceived: 0,
        expected: 500,
    });
    const [isLoading, setIsLoading] = useState(true);
    const [showRecordPayment, setShowRecordPayment] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [currentTime, setCurrentTime] = useState(new Date());

    // Auto-refresh every 30 seconds
    useEffect(() => {
        fetchDashboardData();
        const interval = setInterval(fetchDashboardData, 30000);
        return () => clearInterval(interval);
    }, []);

    // Update clock every second
    useEffect(() => {
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch daily collections
            const summaryRes = await fetch('/api/v1/payments/cashier/daily-collections', {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (summaryRes.ok) {
                const summaryData = await summaryRes.json();
                setDailySummary(summaryData);
                setCashRegister({
                    openingBalance: 500,
                    cashReceived: summaryData.cashCollected,
                    expected: 500 + summaryData.cashCollected,
                });
            }

            // Fetch recent transactions
            const transactionsRes = await fetch(
                '/api/v1/payments?limit=10&sortBy=createdAt&order=DESC',
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (transactionsRes.ok) {
                const transactionsData = await transactionsRes.json();
                setRecentTransactions(transactionsData.items || []);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
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

    const formatDateTime = (date: Date) => {
        return date.toLocaleString('en-US', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
        });
    };

    // Payment methods breakdown data
    const paymentMethodsData = [
        { name: 'Cash', value: dailySummary.cashCollected },
        { name: 'Card Terminal', value: dailySummary.cardCollected },
        { name: 'Cheque', value: 0 },
        { name: 'Other', value: dailySummary.totalCollections - dailySummary.cashCollected - dailySummary.cardCollected },
    ].filter(item => item.value > 0);

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchQuery.trim()) {
            router.push(`/customers?search=${searchQuery}`);
        }
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
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-6 text-white shadow-xl">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h1 className="text-3xl font-bold mb-2">Cashier Portal</h1>
                            <p className="text-blue-100">Welcome, Cashier</p>
                        </div>
                        <div className="text-right">
                            <p className="text-blue-100 text-sm mb-1">Current Time</p>
                            <p className="text-2xl font-bold">{formatDateTime(currentTime)}</p>
                        </div>
                    </div>
                </div>

                {/* Today's Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
                    <div className="md:col-span-2 bg-gradient-to-br from-green-500 to-green-600 rounded-xl p-6 text-white shadow-lg">
                        <div className="flex items-center gap-4 mb-2">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <DollarSign className="w-7 h-7" />
                            </div>
                            <div>
                                <p className="text-green-100 text-sm">Today's Collections</p>
                                <p className="text-4xl font-bold">{formatCurrency(dailySummary.totalCollections)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-blue-500">
                        <p className="text-sm text-gray-600 mb-1">Transactions</p>
                        <p className="text-3xl font-bold text-gray-900">{dailySummary.transactionCount}</p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-green-500">
                        <p className="text-sm text-gray-600 mb-1">Cash Collected</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(dailySummary.cashCollected)}
                        </p>
                    </div>

                    <div className="bg-white rounded-xl p-4 shadow-lg border-l-4 border-purple-500">
                        <p className="text-sm text-gray-600 mb-1">Card Terminal</p>
                        <p className="text-2xl font-bold text-gray-900">
                            {formatCurrency(dailySummary.cardCollected)}
                        </p>
                    </div>
                </div>

                {/* Quick Search */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <form onSubmit={handleSearch} className="flex gap-2">
                        <div className="flex-1 relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search customer by name, ID, or phone..."
                                className="w-full pl-10 pr-4 py-3 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                        >
                            Search
                        </button>
                    </form>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <button
                        onClick={() => setShowRecordPayment(true)}
                        className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                        <CreditCard className="w-8 h-8 mb-3 mx-auto" />
                        <h3 className="font-semibold text-lg">Record Payment</h3>
                        <p className="text-sm text-blue-100 mt-1">Process new payment</p>
                    </button>

                    <button
                        onClick={() => router.push('/customers')}
                        className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
                    >
                        <Users className="w-8 h-8 mb-3 mx-auto text-blue-600" />
                        <h3 className="font-semibold text-lg text-gray-900">Search Customer</h3>
                        <p className="text-sm text-gray-600 mt-1">Find customer details</p>
                    </button>

                    <button
                        onClick={() => router.push('/payments/daily-report')}
                        className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
                    >
                        <FileText className="w-8 h-8 mb-3 mx-auto text-blue-600" />
                        <h3 className="font-semibold text-lg text-gray-900">Daily Report</h3>
                        <p className="text-sm text-gray-600 mt-1">View collections</p>
                    </button>

                    <button
                        onClick={() => {/* Handle close register */ }}
                        className="bg-orange-600 hover:bg-orange-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all"
                    >
                        <Clock className="w-8 h-8 mb-3 mx-auto" />
                        <h3 className="font-semibold text-lg">Close Register</h3>
                        <p className="text-sm text-orange-100 mt-1">End shift</p>
                    </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Recent Transactions */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Recent Transactions</h2>
                            <span className="text-sm text-gray-500">Auto-refresh in 30s</span>
                        </div>

                        {recentTransactions.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No transactions yet today</p>
                            </div>
                        ) : (
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
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {recentTransactions.map((transaction) => (
                                            <tr key={transaction.paymentId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 text-sm text-gray-900">
                                                    {formatTime(transaction.paymentDate)}
                                                </td>
                                                <td className="px-4 py-3 font-medium text-gray-900">
                                                    {transaction.receiptNumber}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {transaction.customerName}
                                                </td>
                                                <td className="px-4 py-3 font-semibold text-gray-900">
                                                    {formatCurrency(transaction.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-600">
                                                    {transaction.paymentMethod}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex gap-2">
                                                        <button
                                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                                            title="View"
                                                        >
                                                            <Eye className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.print()}
                                                            className="p-2 text-gray-600 hover:bg-gray-50 rounded-lg"
                                                            title="Print"
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

                    {/* Cash Register Status & Payment Methods */}
                    <div className="space-y-6">
                        {/* Cash Register */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Cash Register</h2>
                            <div className="space-y-3">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Opening Balance:</span>
                                    <span className="font-semibold text-gray-900">
                                        {formatCurrency(cashRegister.openingBalance)}
                                    </span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Cash Received:</span>
                                    <span className="font-semibold text-green-600">
                                        +{formatCurrency(cashRegister.cashReceived)}
                                    </span>
                                </div>
                                <div className="flex justify-between pt-3 border-t border-gray-200">
                                    <span className="font-semibold text-gray-900">Expected:</span>
                                    <span className="font-bold text-xl text-blue-600">
                                        {formatCurrency(cashRegister.expected)}
                                    </span>
                                </div>
                            </div>
                            <button className="w-full mt-6 px-4 py-3 bg-orange-600 hover:bg-orange-700 text-white font-semibold rounded-lg transition-colors">
                                Close Register
                            </button>
                        </div>

                        {/* Payment Methods Breakdown */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h2 className="text-xl font-bold text-gray-900 mb-4">Payment Methods</h2>
                            {paymentMethodsData.length > 0 ? (
                                <ResponsiveContainer width="100%" height={200}>
                                    <PieChart>
                                        <Pie
                                            data={paymentMethodsData}
                                            cx="50%"
                                            cy="50%"
                                            labelLine={false}
                                            label={({ name, percent }) =>
                                                `${name}: ${((percent || 0) * 100).toFixed(0)}%`
                                            }
                                            outerRadius={80}
                                            fill="#8884d8"
                                            dataKey="value"
                                        >
                                            {paymentMethodsData.map((entry, index) => (
                                                <Cell
                                                    key={`cell-${index}`}
                                                    fill={COLORS[index % COLORS.length]}
                                                />
                                            ))}
                                        </Pie>
                                        <Tooltip formatter={(value) => formatCurrency(Number(value))} />
                                    </PieChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="text-center py-8">
                                    <TrendingUp className="w-12 h-12 text-gray-300 mx-auto mb-2" />
                                    <p className="text-sm text-gray-500">No data yet</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Pending Reconciliation Alert */}
                {false && ( // Replace with actual pending count check
                    <div className="bg-yellow-50 border-l-4 border-yellow-500 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-yellow-800">
                                    Pending Reconciliation
                                </h3>
                                <p className="text-sm text-yellow-700">
                                    You have 3 payments pending reconciliation.{' '}
                                    <a href="/payments/reconciliation" className="underline font-medium">
                                        View now
                                    </a>
                                </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Record Payment Modal */}
            {showRecordPayment && (
                <RecordPaymentModal
                    isOpen={showRecordPayment}
                    onClose={() => setShowRecordPayment(false)}
                    onSuccess={() => {
                        setShowRecordPayment(false);
                        fetchDashboardData();
                    }}
                />
            )}
        </div>
    );
}

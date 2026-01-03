'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerContext';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import {
    CreditCard,
    FileText,
    Clock,
    Download,
    AlertCircle,
    ChevronRight,
    TrendingUp,
    Home,
} from 'lucide-react';
import Link from 'next/link';

interface UnpaidBill {
    billId: number;
    billNumber: string;
    dueDate: string;
    amount: number;
    status: 'UNPAID' | 'OVERDUE';
    isOverdue: boolean;
}

interface RecentPayment {
    paymentId: number;
    paymentDate: string;
    amount: number;
    method: string;
    receiptNumber: string;
}

interface AccountSummary {
    totalOutstanding: number;
    unpaidBillCount: number;
    nextDueDate: string | null;
}

function CustomerDashboardPage() {
    const { customer } = useCustomerAuth();
    const [accountSummary, setAccountSummary] = useState<AccountSummary>({
        totalOutstanding: 0,
        unpaidBillCount: 0,
        nextDueDate: null,
    });
    const [unpaidBills, setUnpaidBills] = useState<UnpaidBill[]>([]);
    const [recentPayments, setRecentPayments] = useState<RecentPayment[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchDashboardData();
    }, []);

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            // Fetch unpaid bills
            const billsResponse = await fetch('/api/v1/payments/customer/my-bills', {
                headers: getCustomerAuthHeader(),
            });

            if (billsResponse.ok) {
                const billsData = await billsResponse.json();
                setUnpaidBills(billsData.bills?.slice(0, 5) || []);
                setAccountSummary({
                    totalOutstanding: billsData.totalOutstanding || 0,
                    unpaidBillCount: billsData.unpaidBillCount || 0,
                    nextDueDate: billsData.bills?.[0]?.dueDate || null,
                });
            }

            // Fetch recent payments
            const paymentsResponse = await fetch('/api/v1/payments/customer/history?limit=3', {
                headers: getCustomerAuthHeader(),
            });

            if (paymentsResponse.ok) {
                const paymentsData = await paymentsResponse.json();
                setRecentPayments(paymentsData || []);
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    const isOverdue = (dueDate: string) => {
        return new Date(dueDate) < new Date();
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
                {/* Welcome Header */}
                <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-2xl p-8 text-white shadow-xl">
                    <h1 className="text-3xl font-bold mb-2">
                        Welcome back, {customer?.firstName} {customer?.lastName}
                    </h1>
                    <p className="text-blue-100 mb-6">Customer ID: {customer?.customerId}</p>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <p className="text-blue-100 text-sm mb-1">Total Outstanding</p>
                            <p className="text-3xl font-bold">{formatCurrency(accountSummary.totalOutstanding)}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <p className="text-blue-100 text-sm mb-1">Unpaid Bills</p>
                            <p className="text-3xl font-bold">{accountSummary.unpaidBillCount}</p>
                        </div>
                        <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/20">
                            <p className="text-blue-100 text-sm mb-1">Next Due Date</p>
                            <p className="text-xl font-bold">
                                {accountSummary.nextDueDate
                                    ? formatDate(accountSummary.nextDueDate)
                                    : 'No bills due'}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Alerts */}
                {unpaidBills.some(bill => bill.isOverdue) && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <div>
                                <h3 className="font-semibold text-red-800">Overdue Bills</h3>
                                <p className="text-sm text-red-700">
                                    You have {unpaidBills.filter(b => b.isOverdue).length} overdue bill(s).
                                    Please pay as soon as possible to avoid service interruption.
                                </p>
                            </div>
                        </div>
                    </div>
                )}

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Link
                        href="/customer/pay-bills"
                        className="bg-blue-600 hover:bg-blue-700 text-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
                    >
                        <CreditCard className="w-8 h-8 mb-3" />
                        <h3 className="font-semibold text-lg">Pay Bills</h3>
                        <p className="text-sm text-blue-100 mt-1">Make a payment</p>
                    </Link>

                    <Link
                        href="/customer/bills"
                        className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
                    >
                        <FileText className="w-8 h-8 mb-3 text-blue-600" />
                        <h3 className="font-semibold text-lg text-gray-900">View All Bills</h3>
                        <p className="text-sm text-gray-600 mt-1">Bill history</p>
                    </Link>

                    <Link
                        href="/customer/payments"
                        className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
                    >
                        <Clock className="w-8 h-8 mb-3 text-blue-600" />
                        <h3 className="font-semibold text-lg text-gray-900">Payment History</h3>
                        <p className="text-sm text-gray-600 mt-1">View payments</p>
                    </Link>

                    <Link
                        href="/customer/receipts"
                        className="bg-white hover:bg-gray-50 p-6 rounded-xl shadow-lg hover:shadow-xl transition-all border border-gray-200"
                    >
                        <Download className="w-8 h-8 mb-3 text-blue-600" />
                        <h3 className="font-semibold text-lg text-gray-900">Download Receipts</h3>
                        <p className="text-sm text-gray-600 mt-1">Get receipts</p>
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Unpaid Bills Summary */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Unpaid Bills</h2>
                            <Link
                                href="/customer/bills"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {unpaidBills.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No unpaid bills</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {unpaidBills.map(bill => (
                                    <div
                                        key={bill.billId}
                                        className={`p-4 rounded-lg border-2 transition-all ${bill.isOverdue
                                                ? 'border-red-200 bg-red-50'
                                                : 'border-gray-200 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="flex items-center justify-between">
                                            <div className="flex-1">
                                                <div className="flex items-center gap-2 mb-1">
                                                    <h3 className="font-semibold text-gray-900">
                                                        {bill.billNumber}
                                                    </h3>
                                                    {bill.isOverdue && (
                                                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                                                            OVERDUE
                                                        </span>
                                                    )}
                                                </div>
                                                <p className="text-sm text-gray-600">
                                                    Due: {formatDate(bill.dueDate)}
                                                </p>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-xl font-bold text-gray-900">
                                                    {formatCurrency(bill.amount)}
                                                </p>
                                                <Link
                                                    href={`/customer/pay-bills?billId=${bill.billId}`}
                                                    className="mt-2 inline-block px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                >
                                                    Pay Now
                                                </Link>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Recent Payments */}
                    <div className="bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">Recent Payments</h2>
                            <Link
                                href="/customer/payments"
                                className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                            >
                                View All <ChevronRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {recentPayments.length === 0 ? (
                            <div className="text-center py-12">
                                <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No recent payments</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {recentPayments.map(payment => (
                                    <div
                                        key={payment.paymentId}
                                        className="p-4 rounded-lg border border-gray-200 hover:border-blue-200 transition-all"
                                    >
                                        <div className="flex items-center justify-between">
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {formatCurrency(payment.amount)}
                                                </p>
                                                <p className="text-sm text-gray-600">
                                                    {formatDate(payment.paymentDate)} • {payment.method}
                                                </p>
                                            </div>
                                            <Link
                                                href={`/customer/receipts/${payment.receiptNumber}`}
                                                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Download className="w-4 h-4" />
                                                Receipt
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Account Information */}
                <div className="bg-white rounded-xl shadow-lg p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                            <Home className="w-6 h-6 text-blue-600" />
                            Account Information
                        </h2>
                        <Link
                            href="/customer/account"
                            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                            Manage Account
                        </Link>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Email</p>
                            <p className="font-medium text-gray-900">{customer?.email}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-600 mb-1">Phone</p>
                            <p className="font-medium text-gray-900">{customer?.phoneNumber || 'Not provided'}</p>
                        </div>
                        <div className="p-4 bg-gray-50 rounded-lg md:col-span-2">
                            <p className="text-sm text-gray-600 mb-1">Address</p>
                            <p className="font-medium text-gray-900">{customer?.address || 'Not provided'}</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default withCustomerAuth(CustomerDashboardPage);

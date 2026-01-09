'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerContext';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import {
    CreditCard,
    ChevronLeft,
    ChevronRight,
    Download,
    CheckCircle,
    XCircle,
    Clock,
    Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Payment {
    paymentId: number;
    paymentDate: string;
    amount: number;
    paymentMethod: string;
    transactionReference: string;
    receiptNumber: string;
    status: string;
    billNumber?: string;
}

function PaymentHistoryPage() {
    const { customer } = useCustomerAuth();
    const [payments, setPayments] = useState<Payment[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchPayments();
    }, [currentPage]);

    const fetchPayments = async () => {
        setIsLoading(true);
        try {
            const API_BASE = 'http://localhost:3001/api/v1';
            const response = await fetch(
                `${API_BASE}/customer/payments/history?page=${currentPage}&limit=${itemsPerPage}`,
                {
                    headers: getCustomerAuthHeader(),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setPayments(data.data || data || []);
                const total = data.totalCount || data.length || 0;
                setTotalPages(Math.ceil(total / itemsPerPage) || 1);
            }
        } catch (error) {
            console.error('Failed to fetch payments:', error);
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
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    const getStatusBadge = (status: string) => {
        switch (status?.toUpperCase()) {
            case 'COMPLETED':
            case 'SUCCESS':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                        <CheckCircle className="w-4 h-4" />
                        Completed
                    </span>
                );
            case 'FAILED':
            case 'DECLINED':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                        <XCircle className="w-4 h-4" />
                        Failed
                    </span>
                );
            case 'PENDING':
            case 'PROCESSING':
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                        <Clock className="w-4 h-4" />
                        Pending
                    </span>
                );
            default:
                return (
                    <span className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                        {status || 'Unknown'}
                    </span>
                );
        }
    };

    const getPaymentMethodIcon = (method: string) => {
        return <CreditCard className="w-5 h-5 text-gray-500" />;
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
                <div>
                    <Link
                        href="/customer/dashboard"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Payment History</h1>
                    <p className="text-gray-600 mt-1">View all your past payments</p>
                </div>

                {/* Payments List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {payments.length === 0 ? (
                        <div className="text-center py-16">
                            <CreditCard className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Payments Found</h3>
                            <p className="text-gray-500">You haven't made any payments yet.</p>
                            <Link
                                href="/customer/pay-bills"
                                className="mt-4 inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                            >
                                Pay a Bill
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Receipt Number
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Bill
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Amount
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Method
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Status
                                            </th>
                                            <th className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                                                Actions
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {payments.map(payment => (
                                            <tr key={payment.paymentId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(payment.paymentDate)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">
                                                        {payment.receiptNumber || payment.transactionReference || '-'}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {payment.billNumber || '-'}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <p className="font-semibold text-gray-900">
                                                        {formatCurrency(payment.amount)}
                                                    </p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-2">
                                                        {getPaymentMethodIcon(payment.paymentMethod)}
                                                        <span className="text-sm text-gray-600 capitalize">
                                                            {payment.paymentMethod?.replace('_', ' ').toLowerCase() || 'Card'}
                                                        </span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(payment.status)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    {payment.receiptNumber && (
                                                        <Link
                                                            href={`/customer/receipts/${payment.receiptNumber}`}
                                                            className="inline-flex items-center gap-1 px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors text-sm font-medium"
                                                        >
                                                            <Download className="w-4 h-4" />
                                                            Receipt
                                                        </Link>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination */}
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between">
                                <p className="text-sm text-gray-600">
                                    Page {currentPage} of {totalPages}
                                </p>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                        disabled={currentPage === 1}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                        Previous
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                        disabled={currentPage === totalPages}
                                        className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                    >
                                        Next
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}

export default withCustomerAuth(PaymentHistoryPage);

'use client';

import { useEffect, useState } from 'react';
import { useCustomerAuth } from '@/contexts/CustomerContext';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import {
    FileText,
    Download,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    CheckCircle,
    Clock,
    Filter,
} from 'lucide-react';
import Link from 'next/link';

interface Bill {
    billId: number;
    billNumber: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    dueDate: string;
    totalAmount: number;
    amountPaid: number;
    amountDue: number;
    status: string;
    utilityType: string;
    connectionId: number;
}

function CustomerBillsPage() {
    const { customer } = useCustomerAuth();
    const [bills, setBills] = useState<Bill[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [statusFilter, setStatusFilter] = useState<string>('ALL');
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const itemsPerPage = 10;

    useEffect(() => {
        fetchBills();
    }, [currentPage, statusFilter]);

    const fetchBills = async () => {
        setIsLoading(true);
        try {
            const API_BASE = 'http://localhost:3001/api/v1';
            const statusParam = statusFilter !== 'ALL' ? `&status=${statusFilter}` : '';
            
            const response = await fetch(
                `${API_BASE}/customer/my-bills?page=${currentPage}&limit=${itemsPerPage}${statusParam}`,
                {
                    headers: getCustomerAuthHeader(),
                }
            );

            if (response.ok) {
                const data = await response.json();
                setBills(data.data?.bills || data.bills || []);
                const total = data.data?.totalCount || data.totalCount || 0;
                setTotalPages(Math.ceil(total / itemsPerPage) || 1);
            }
        } catch (error) {
            console.error('Failed to fetch bills:', error);
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

    const getStatusBadge = (status: string, dueDate: string) => {
        const isOverdue = new Date(dueDate) < new Date() && status !== 'PAID';
        
        if (status === 'PAID') {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                    <CheckCircle className="w-4 h-4" />
                    Paid
                </span>
            );
        }
        
        if (isOverdue) {
            return (
                <span className="inline-flex items-center gap-1 px-3 py-1 bg-red-100 text-red-800 text-sm font-medium rounded-full">
                    <AlertCircle className="w-4 h-4" />
                    Overdue
                </span>
            );
        }
        
        return (
            <span className="inline-flex items-center gap-1 px-3 py-1 bg-yellow-100 text-yellow-800 text-sm font-medium rounded-full">
                <Clock className="w-4 h-4" />
                Pending
            </span>
        );
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
                <div className="flex items-center justify-between">
                    <div>
                        <Link
                            href="/customer/dashboard"
                            className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-2"
                        >
                            <ChevronLeft className="w-4 h-4" />
                            Back to Dashboard
                        </Link>
                        <h1 className="text-3xl font-bold text-gray-900">My Bills</h1>
                        <p className="text-gray-600 mt-1">View and manage your utility bills</p>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl shadow-lg p-4">
                    <div className="flex items-center gap-4 flex-wrap">
                        <div className="flex items-center gap-2">
                            <Filter className="w-5 h-5 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Filter by Status:</span>
                        </div>
                        <div className="flex gap-2">
                            {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map(status => (
                                <button
                                    key={status}
                                    onClick={() => {
                                        setStatusFilter(status);
                                        setCurrentPage(1);
                                    }}
                                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                        statusFilter === status
                                            ? 'bg-blue-600 text-white'
                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                    }`}
                                >
                                    {status === 'ALL' ? 'All Bills' : status.charAt(0) + status.slice(1).toLowerCase()}
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bills List */}
                <div className="bg-white rounded-xl shadow-lg overflow-hidden">
                    {bills.length === 0 ? (
                        <div className="text-center py-16">
                            <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Bills Found</h3>
                            <p className="text-gray-500">
                                {statusFilter !== 'ALL'
                                    ? `No ${statusFilter.toLowerCase()} bills to display`
                                    : 'You have no bills at this time'}
                            </p>
                        </div>
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50 border-b border-gray-200">
                                        <tr>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Bill Number
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Billing Period
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Due Date
                                            </th>
                                            <th className="px-6 py-4 text-left text-sm font-semibold text-gray-900">
                                                Amount
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
                                        {bills.map(bill => (
                                            <tr key={bill.billId} className="hover:bg-gray-50">
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {bill.billNumber}
                                                        </p>
                                                        <p className="text-sm text-gray-500">
                                                            {bill.utilityType}
                                                        </p>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(bill.billingPeriodStart)} -{' '}
                                                    {formatDate(bill.billingPeriodEnd)}
                                                </td>
                                                <td className="px-6 py-4 text-sm text-gray-600">
                                                    {formatDate(bill.dueDate)}
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {formatCurrency(bill.totalAmount)}
                                                        </p>
                                                        {bill.amountPaid > 0 && bill.status !== 'PAID' && (
                                                            <p className="text-sm text-green-600">
                                                                Paid: {formatCurrency(bill.amountPaid)}
                                                            </p>
                                                        )}
                                                        {bill.amountDue > 0 && bill.status !== 'PAID' && (
                                                            <p className="text-sm text-red-600">
                                                                Due: {formatCurrency(bill.amountDue)}
                                                            </p>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    {getStatusBadge(bill.status, bill.dueDate)}
                                                </td>
                                                <td className="px-6 py-4 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <button
                                                            className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                            title="Download Bill"
                                                        >
                                                            <Download className="w-5 h-5" />
                                                        </button>
                                                        {bill.status !== 'PAID' && (
                                                            <Link
                                                                href={`/customer/pay-bills?billId=${bill.billId}`}
                                                                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium rounded-lg transition-colors"
                                                            >
                                                                Pay Now
                                                            </Link>
                                                        )}
                                                    </div>
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

export default withCustomerAuth(CustomerBillsPage);

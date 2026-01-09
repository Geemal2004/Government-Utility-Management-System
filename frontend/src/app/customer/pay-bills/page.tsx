'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { useCustomerAuth } from '@/contexts/CustomerContext';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import {
    CreditCard,
    ChevronLeft,
    AlertCircle,
    CheckCircle,
    Lock,
    Loader2,
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
    isOverdue?: boolean;
}

function PayBillsPage() {
    const { customer } = useCustomerAuth();
    const searchParams = useSearchParams();
    const preselectedBillId = searchParams.get('billId');
    
    const [unpaidBills, setUnpaidBills] = useState<Bill[]>([]);
    const [selectedBills, setSelectedBills] = useState<number[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [paymentSuccess, setPaymentSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        fetchUnpaidBills();
    }, []);

    useEffect(() => {
        if (preselectedBillId && unpaidBills.length > 0) {
            const billId = parseInt(preselectedBillId);
            if (unpaidBills.some(bill => bill.billId === billId)) {
                setSelectedBills([billId]);
            }
        }
    }, [preselectedBillId, unpaidBills]);

    const fetchUnpaidBills = async () => {
        setIsLoading(true);
        try {
            const API_BASE = 'http://localhost:3001/api/v1';
            const response = await fetch(`${API_BASE}/customer/my-bills?status=UNPAID`, {
                headers: getCustomerAuthHeader(),
            });

            if (response.ok) {
                const data = await response.json();
                const bills = data.data?.bills || data.bills || [];
                setUnpaidBills(bills.map((bill: Bill) => ({
                    ...bill,
                    isOverdue: new Date(bill.dueDate) < new Date(),
                })));
            }
        } catch (error) {
            console.error('Failed to fetch bills:', error);
            setError('Failed to load bills. Please try again.');
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

    const toggleBillSelection = (billId: number) => {
        setSelectedBills(prev =>
            prev.includes(billId)
                ? prev.filter(id => id !== billId)
                : [...prev, billId]
        );
    };

    const selectAll = () => {
        if (selectedBills.length === unpaidBills.length) {
            setSelectedBills([]);
        } else {
            setSelectedBills(unpaidBills.map(bill => bill.billId));
        }
    };

    const getSelectedTotal = () => {
        return unpaidBills
            .filter(bill => selectedBills.includes(bill.billId))
            .reduce((sum, bill) => sum + (bill.amountDue || bill.totalAmount), 0);
    };

    const handlePayment = async () => {
        if (selectedBills.length === 0) {
            setError('Please select at least one bill to pay');
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            const API_BASE = 'http://localhost:3001/api/v1';
            const response = await fetch(`${API_BASE}/customer/payments/checkout`, {
                method: 'POST',
                headers: {
                    ...getCustomerAuthHeader(),
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    billIds: selectedBills,
                }),
            });

            if (response.ok) {
                const data = await response.json();
                // If Stripe checkout URL is provided, redirect
                if (data.checkoutUrl || data.data?.checkoutUrl) {
                    window.location.href = data.checkoutUrl || data.data?.checkoutUrl;
                } else {
                    setPaymentSuccess(true);
                }
            } else {
                const errorData = await response.json();
                setError(errorData.message || 'Payment failed. Please try again.');
            }
        } catch (error) {
            console.error('Payment error:', error);
            setError('Payment processing failed. Please try again.');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (paymentSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
                <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-8 h-8 text-green-600" />
                    </div>
                    <h2 className="text-2xl font-bold text-gray-900 mb-2">Payment Successful!</h2>
                    <p className="text-gray-600 mb-6">
                        Your payment has been processed successfully. You will receive a confirmation email shortly.
                    </p>
                    <Link
                        href="/customer/dashboard"
                        className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                    >
                        Return to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto space-y-6">
                {/* Header */}
                <div>
                    <Link
                        href="/customer/dashboard"
                        className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1 mb-2"
                    >
                        <ChevronLeft className="w-4 h-4" />
                        Back to Dashboard
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900">Pay Bills</h1>
                    <p className="text-gray-600 mt-1">Select the bills you want to pay</p>
                </div>

                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-lg">
                        <div className="flex items-center gap-3">
                            <AlertCircle className="w-6 h-6 text-red-500 flex-shrink-0" />
                            <p className="text-red-700">{error}</p>
                        </div>
                    </div>
                )}

                {unpaidBills.length === 0 ? (
                    <div className="bg-white rounded-xl shadow-lg p-12 text-center">
                        <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                        <h2 className="text-2xl font-bold text-gray-900 mb-2">All Caught Up!</h2>
                        <p className="text-gray-600 mb-6">You have no unpaid bills at this time.</p>
                        <Link
                            href="/customer/dashboard"
                            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg transition-colors"
                        >
                            Return to Dashboard
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Bills Selection */}
                        <div className="lg:col-span-2 space-y-4">
                            <div className="bg-white rounded-xl shadow-lg p-4">
                                <div className="flex items-center justify-between pb-4 border-b border-gray-200">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Unpaid Bills ({unpaidBills.length})
                                    </h2>
                                    <button
                                        onClick={selectAll}
                                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                    >
                                        {selectedBills.length === unpaidBills.length
                                            ? 'Deselect All'
                                            : 'Select All'}
                                    </button>
                                </div>

                                <div className="divide-y divide-gray-100">
                                    {unpaidBills.map(bill => (
                                        <div
                                            key={bill.billId}
                                            onClick={() => toggleBillSelection(bill.billId)}
                                            className={`p-4 cursor-pointer transition-colors ${
                                                selectedBills.includes(bill.billId)
                                                    ? 'bg-blue-50'
                                                    : 'hover:bg-gray-50'
                                            }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <div
                                                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
                                                        selectedBills.includes(bill.billId)
                                                            ? 'bg-blue-600 border-blue-600'
                                                            : 'border-gray-300'
                                                    }`}
                                                >
                                                    {selectedBills.includes(bill.billId) && (
                                                        <CheckCircle className="w-4 h-4 text-white" />
                                                    )}
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <h3 className="font-semibold text-gray-900">
                                                            {bill.billNumber}
                                                        </h3>
                                                        {bill.isOverdue && (
                                                            <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs font-medium rounded">
                                                                OVERDUE
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-sm text-gray-600">
                                                        {bill.utilityType} • Due: {formatDate(bill.dueDate)}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-lg font-bold text-gray-900">
                                                        {formatCurrency(bill.amountDue || bill.totalAmount)}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* Payment Summary */}
                        <div className="lg:col-span-1">
                            <div className="bg-white rounded-xl shadow-lg p-6 sticky top-6">
                                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                                    Payment Summary
                                </h2>

                                <div className="space-y-3 mb-6">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Selected Bills</span>
                                        <span className="font-medium text-gray-900">
                                            {selectedBills.length}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Subtotal</span>
                                        <span className="font-medium text-gray-900">
                                            {formatCurrency(getSelectedTotal())}
                                        </span>
                                    </div>
                                    <div className="border-t border-gray-200 pt-3">
                                        <div className="flex justify-between">
                                            <span className="font-semibold text-gray-900">Total</span>
                                            <span className="text-xl font-bold text-blue-600">
                                                {formatCurrency(getSelectedTotal())}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handlePayment}
                                    disabled={selectedBills.length === 0 || isProcessing}
                                    className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
                                >
                                    {isProcessing ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Processing...
                                        </>
                                    ) : (
                                        <>
                                            <CreditCard className="w-5 h-5" />
                                            Pay {formatCurrency(getSelectedTotal())}
                                        </>
                                    )}
                                </button>

                                <div className="mt-4 flex items-center justify-center gap-2 text-sm text-gray-500">
                                    <Lock className="w-4 h-4" />
                                    Secure payment via Stripe
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default withCustomerAuth(PayBillsPage);

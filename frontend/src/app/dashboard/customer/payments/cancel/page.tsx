'use client';

import { useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { XCircle, ArrowLeft, CreditCard, Mail, AlertTriangle } from 'lucide-react';
import Link from 'next/link';

interface CancelledBill {
    billNumber: string;
    utilityType: string;
    amount: number;
}

function PaymentCancelPage() {
    const searchParams = useSearchParams();
    const [bills, setBills] = useState<CancelledBill[]>([]);

    useEffect(() => {
        // Try to get bill info from session storage if available
        const billInfo = sessionStorage.getItem('pendingPaymentBills');
        if (billInfo) {
            try {
                setBills(JSON.parse(billInfo));
            } catch (e) {
                console.error('Failed to parse bill info');
            }
        }
    }, []);

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(amount);
    };

    const totalAmount = bills.reduce((sum, bill) => sum + bill.amount, 0);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Cancel Header */}
                    <div className="bg-gradient-to-r from-orange-500 to-red-500 p-8 text-white text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4">
                            <XCircle className="w-16 h-16 text-orange-600" />
                        </div>
                        <h1 className="text-4xl font-bold mb-2">Payment Cancelled</h1>
                        <p className="text-orange-100 text-lg">
                            Your payment was not completed
                        </p>
                    </div>

                    {/* Content */}
                    <div className="p-8">
                        {/* Reassurance Message */}
                        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <AlertTriangle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-green-900 mb-1">
                                        No charges were made
                                    </h3>
                                    <p className="text-sm text-green-700">
                                        Your card has not been charged. You can safely try again or choose
                                        a different payment method.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Bills that were being paid */}
                        {bills.length > 0 && (
                            <div className="mb-6">
                                <h2 className="text-lg font-bold text-gray-900 mb-4">
                                    Bills You Were Paying
                                </h2>
                                <div className="space-y-2 mb-4">
                                    {bills.map((bill, index) => (
                                        <div
                                            key={index}
                                            className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-200"
                                        >
                                            <div>
                                                <p className="font-semibold text-gray-900">
                                                    {bill.billNumber}
                                                </p>
                                                <p className="text-sm text-gray-600">{bill.utilityType}</p>
                                            </div>
                                            <span className="font-semibold text-gray-900">
                                                {formatCurrency(bill.amount)}
                                            </span>
                                        </div>
                                    ))}
                                </div>
                                <div className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                                    <span className="font-semibold text-gray-900">Total Amount</span>
                                    <span className="text-xl font-bold text-blue-900">
                                        {formatCurrency(totalAmount)}
                                    </span>
                                </div>
                            </div>
                        )}

                        {/* Why payment might have been cancelled */}
                        <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Common reasons for cancellation:
                            </h3>
                            <ul className="text-sm text-gray-600 space-y-1 list-disc list-inside">
                                <li>You clicked the back button</li>
                                <li>Payment window was closed</li>
                                <li>Changed your mind about the payment</li>
                                <li>Payment session expired</li>
                            </ul>
                        </div>

                        {/* Action Buttons */}
                        <div className="space-y-3">
                            <Link
                                href={
                                    bills.length > 0
                                        ? `/customer/pay?bills=${bills.map((_, i) => i + 1).join(',')}`
                                        : '/customer/bills'
                                }
                                className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors shadow-lg"
                            >
                                <CreditCard className="w-5 h-5" />
                                Try Payment Again
                            </Link>

                            <Link
                                href="/customer/bills"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
                            >
                                <ArrowLeft className="w-5 h-5" />
                                Back to Bills
                            </Link>

                            <Link
                                href="/customer/support"
                                className="w-full flex items-center justify-center gap-2 px-6 py-3 text-gray-600 hover:text-gray-900 font-medium"
                            >
                                <Mail className="w-5 h-5" />
                                Contact Support
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Help Text */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Having trouble?{' '}
                        <Link href="/customer/support" className="text-blue-600 hover:underline font-medium">
                            We're here to help
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default withCustomerAuth(PaymentCancelPage);

'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import { CheckCircle, Download, Home, Receipt, FileText, Loader2 } from 'lucide-react';
import Link from 'next/link';
import confetti from 'canvas-confetti';

interface PaymentDetails {
    amount: number;
    date: string;
    receiptNumber: string;
    bills: {
        billNumber: string;
        utilityType: string;
        amount: number;
    }[];
}

function PaymentSuccessPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [sessionId, setSessionId] = useState('');
    const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const id = searchParams.get('session_id');
        if (id) {
            setSessionId(id);
            verifyPayment(id);
            // Trigger confetti
            fireConfetti();
        } else {
            setError('No payment session found');
            setIsLoading(false);
        }
    }, [searchParams]);

    const fireConfetti = () => {
        const duration = 3 * 1000;
        const animationEnd = Date.now() + duration;
        const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 0 };

        function randomInRange(min: number, max: number) {
            return Math.random() * (max - min) + min;
        }

        const interval: any = setInterval(function () {
            const timeLeft = animationEnd - Date.now();

            if (timeLeft <= 0) {
                return clearInterval(interval);
            }

            const particleCount = 50 * (timeLeft / duration);

            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
            });
            confetti({
                ...defaults,
                particleCount,
                origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
            });
        }, 250);
    };

    const verifyPayment = async (sessionId: string) => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/payments/customer/verify-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCustomerAuthHeader(),
                },
                body: JSON.stringify({ sessionId }),
            });

            if (!response.ok) {
                throw new Error('Failed to verify payment');
            }

            const data = await response.json();
            setPaymentDetails(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment verification failed');
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

    const formatDateTime = (dateString: string) => {
        return new Date(dateString).toLocaleString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto mb-4" />
                    <p className="text-gray-600">Verifying your payment...</p>
                </div>
            </div>
        );
    }

    if (error) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <FileText className="w-12 h-12 text-red-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">Verification Error</h1>
                    <p className="text-gray-600 mb-6">{error}</p>
                    <Link
                        href="/customer/dashboard"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                    >
                        <Home className="w-5 h-5" />
                        Back to Dashboard
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-blue-50 flex items-center justify-center p-4">
            <div className="max-w-2xl w-full">
                <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
                    {/* Success Header */}
                    <div className="bg-gradient-to-r from-green-500 to-green-600 p-8 text-white text-center">
                        <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                            <CheckCircle className="w-16 h-16 text-green-600" />
                        </div>
                        <h1 className="text-4xl font-bold mb-2">Payment Successful!</h1>
                        <p className="text-green-100 text-lg">
                            Your payment has been processed successfully
                        </p>
                    </div>

                    {/* Payment Details */}
                    <div className="p-8">
                        {/* Confirmation Message */}
                        <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-sm text-blue-800">
                                📧 A confirmation email has been sent to your registered email address.
                            </p>
                        </div>

                        {/* Payment Info */}
                        {paymentDetails && (
                            <>
                                <div className="mb-6 p-6 bg-gray-50 rounded-xl border border-gray-200">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                                        Payment Details
                                    </h2>
                                    <div className="space-y-3">
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Amount Paid:</span>
                                            <span className="font-bold text-green-600 text-xl">
                                                {formatCurrency(paymentDetails.amount)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Date & Time:</span>
                                            <span className="font-semibold text-gray-900">
                                                {formatDateTime(paymentDetails.date)}
                                            </span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-gray-600">Receipt No:</span>
                                            <span className="font-semibold text-gray-900">
                                                {paymentDetails.receiptNumber}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Bills Paid */}
                                <div className="mb-6">
                                    <h2 className="text-lg font-bold text-gray-900 mb-4">
                                        Bills Paid ({paymentDetails.bills.length})
                                    </h2>
                                    <div className="space-y-2">
                                        {paymentDetails.bills.map((bill, index) => (
                                            <div
                                                key={index}
                                                className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CheckCircle className="w-5 h-5 text-green-600" />
                                                    <div>
                                                        <p className="font-semibold text-gray-900">
                                                            {bill.billNumber}
                                                        </p>
                                                        <p className="text-sm text-gray-600">
                                                            {bill.utilityType}
                                                        </p>
                                                    </div>
                                                </div>
                                                <span className="font-semibold text-gray-900">
                                                    {formatCurrency(bill.amount)}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </>
                        )}

                        {/* Session ID */}
                        {sessionId && (
                            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                                <p className="text-xs text-gray-500 mb-1">Transaction ID</p>
                                <p className="text-sm font-mono text-gray-700 break-all">
                                    {sessionId}
                                </p>
                            </div>
                        )}

                        {/* Action Buttons */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Link
                                href={`/customer/receipts/${paymentDetails?.receiptNumber || ''}`}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                <Receipt className="w-5 h-5" />
                                View Receipt
                            </Link>

                            <button
                                onClick={() => window.print()}
                                className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white font-semibold rounded-lg transition-colors"
                            >
                                <Download className="w-5 h-5" />
                                Download PDF
                            </button>

                            <Link
                                href="/customer/payments"
                                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
                            >
                                <FileText className="w-5 h-5" />
                                Payment History
                            </Link>

                            <Link
                                href="/customer/dashboard"
                                className="flex items-center justify-center gap-2 px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg transition-colors"
                            >
                                <Home className="w-5 h-5" />
                                Dashboard
                            </Link>
                        </div>
                    </div>
                </div>

                {/* Support Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        Need help?{' '}
                        <Link href="/customer/support" className="text-blue-600 hover:underline font-medium">
                            Contact Support
                        </Link>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default withCustomerAuth(PaymentSuccessPage);

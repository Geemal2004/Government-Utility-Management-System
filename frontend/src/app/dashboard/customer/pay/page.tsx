'use client';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { withCustomerAuth } from '@/components/withCustomerAuth';
import { getCustomerAuthHeader } from '@/lib/auth/customerAuth';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, Shield, ArrowLeft, Loader2 } from 'lucide-react';

interface BillSummary {
    billId: number;
    billNumber: string;
    utilityType: string;
    billingPeriod: string;
    amount: number;
}

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!);

function CustomerPaymentPage() {
    const searchParams = useSearchParams();
    const router = useRouter();
    const [bills, setBills] = useState<BillSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isProcessing, setIsProcessing] = useState(false);
    const [error, setError] = useState('');

    const billIdsParam = searchParams.get('bills');
    const billIds = billIdsParam ? billIdsParam.split(',').map(Number) : [];

    useEffect(() => {
        if (billIds.length === 0) {
            router.push('/customer/bills');
            return;
        }

        fetchBillDetails();
    }, [billIdsParam]);

    const fetchBillDetails = async () => {
        setIsLoading(true);
        setError('');

        try {
            const response = await fetch('/api/v1/payments/customer/my-bills', {
                headers: getCustomerAuthHeader(),
            });

            if (!response.ok) {
                throw new Error('Failed to fetch bills');
            }

            const data = await response.json();

            // Filter to only selected bills
            const selectedBills = data.bills
                .filter((bill: any) => billIds.includes(bill.billId))
                .map((bill: any) => ({
                    billId: bill.billId,
                    billNumber: bill.billNumber,
                    utilityType: bill.utilityType,
                    billingPeriod: `${new Date(bill.billingPeriodStart).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}`,
                    amount: bill.outstandingAmount,
                }));

            setBills(selectedBills);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to load bill details');
        } finally {
            setIsLoading(false);
        }
    };

    const handleProceedToPayment = async () => {
        setIsProcessing(true);
        setError('');

        try {
            // Create Stripe Checkout Session
            const response = await fetch('/api/v1/payments/online/checkout', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    ...getCustomerAuthHeader(),
                },
                body: JSON.stringify({
                    billIds: billIds,
                    successUrl: `${window.location.origin}/customer/payments/success?session_id={CHECKOUT_SESSION_ID}`,
                    cancelUrl: `${window.location.origin}/customer/payments/cancel`,
                }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create checkout session');
            }

            const { sessionId } = await response.json();

            // Redirect to Stripe Checkout
            const stripe = await stripePromise;
            if (!stripe) {
                throw new Error('Stripe failed to load');
            }

            // Redirect to Stripe checkout
            const result = await (stripe as any).redirectToCheckout({ sessionId });

            if (result && result.error) {
                throw new Error(result.error.message);
            }
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Payment initiation failed');
            setIsProcessing(false);
        }
    };

    const calculateTotal = () => {
        return bills.reduce((sum, bill) => sum + bill.amount, 0);
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-LK', {
            style: 'currency',
            currency: 'LKR',
        }).format(amount);
    };

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    const total = calculateTotal();
    const processingFee = 0; // Can be calculated based on gateway
    const grandTotal = total + processingFee;

    return (
        <div className="min-h-screen bg-gray-50 p-4 md:p-8">
            <div className="max-w-3xl mx-auto">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back to Bills
                </button>

                {/* Payment Review Card */}
                <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
                    {/* Header */}
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 p-6 text-white">
                        <h1 className="text-2xl font-bold mb-2">Payment Summary</h1>
                        <p className="text-blue-100">Review your bills before payment</p>
                    </div>

                    {/* Error Message */}
                    {error && (
                        <div className="mx-6 mt-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                            <p className="text-sm text-red-600">{error}</p>
                        </div>
                    )}

                    {/* Bills List */}
                    <div className="p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-4">
                            Selected Bills ({bills.length})
                        </h2>

                        <div className="space-y-3 mb-6">
                            {bills.map((bill) => (
                                <div
                                    key={bill.billId}
                                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border border-gray-200"
                                >
                                    <div className="flex-1">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h3 className="font-semibold text-gray-900">
                                                {bill.billNumber}
                                            </h3>
                                            <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                                                {bill.utilityType}
                                            </span>
                                        </div>
                                        <p className="text-sm text-gray-600">{bill.billingPeriod}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-lg font-bold text-gray-900">
                                            {formatCurrency(bill.amount)}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Totals */}
                        <div className="border-t border-gray-200 pt-4 space-y-3">
                            <div className="flex items-center justify-between text-gray-600">
                                <span>Subtotal</span>
                                <span className="font-semibold">{formatCurrency(total)}</span>
                            </div>
                            <div className="flex items-center justify-between text-gray-600">
                                <span>Processing Fee</span>
                                <span className="font-semibold">{formatCurrency(processingFee)}</span>
                            </div>
                            <div className="flex items-center justify-between text-xl font-bold text-gray-900 pt-3 border-t border-gray-200">
                                <span>Total</span>
                                <span>{formatCurrency(grandTotal)}</span>
                            </div>
                        </div>

                        {/* Security Notice */}
                        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-start gap-3">
                                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-semibold text-blue-900 mb-1">
                                        Secure Payment
                                    </h3>
                                    <p className="text-sm text-blue-700">
                                        Your payment is processed securely through Stripe. We never store
                                        your card details.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Button */}
                        <button
                            onClick={handleProceedToPayment}
                            disabled={isProcessing}
                            className="w-full mt-6 bg-gradient-to-r from-blue-600 to-blue-700 text-white py-4 px-6 rounded-xl font-semibold hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform hover:scale-[1.02] active:scale-[0.98] shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                        >
                            {isProcessing ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Redirecting to secure payment...
                                </>
                            ) : (
                                <>
                                    <CreditCard className="w-5 h-5" />
                                    Proceed to Payment • {formatCurrency(grandTotal)}
                                </>
                            )}
                        </button>

                        {/* Payment Methods */}
                        <div className="mt-6 text-center">
                            <p className="text-xs text-gray-500 mb-3">Accepted payment methods</p>
                            <div className="flex items-center justify-center gap-4 flex-wrap">
                                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                    Visa
                                </div>
                                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                    Mastercard
                                </div>
                                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                    American Express
                                </div>
                                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                    Apple Pay
                                </div>
                                <div className="px-3 py-2 bg-gray-100 rounded text-xs font-medium text-gray-700">
                                    Google Pay
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Additional Info */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-gray-600">
                        By proceeding, you agree to our{' '}
                        <a href="/terms" className="text-blue-600 hover:underline">
                            Terms of Service
                        </a>{' '}
                        and{' '}
                        <a href="/privacy" className="text-blue-600 hover:underline">
                            Privacy Policy
                        </a>
                    </p>
                </div>
            </div>
        </div>
    );
}

export default withCustomerAuth(CustomerPaymentPage);

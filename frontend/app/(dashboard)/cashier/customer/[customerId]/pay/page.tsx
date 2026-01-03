'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import {
    User,
    FileText,
    DollarSign,
    CreditCard,
    Printer,
    CheckCircle,
    ArrowLeft,
    AlertTriangle,
} from 'lucide-react';

interface UnpaidBill {
    billId: number;
    billNumber: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    dueDate: string;
    meterNumber: string;
    utilityType: string;
    totalAmount: number;
    outstandingAmount: number;
    isOverdue: boolean;
    daysOverdue: number;
}

interface CustomerInfo {
    customerId: number;
    customerCode: string;
    firstName: string;
    lastName: string;
    totalOutstanding: number;
}

interface PaymentForm {
    paymentAmount: number;
    paymentMethod: 'CASH' | 'CARD_TERMINAL' | 'BANK_TRANSFER' | 'CHEQUE';
    transactionRef?: string;
    notes?: string;
}

export default function CashierRecordPaymentPage() {
    const params = useParams();
    const router = useRouter();
    const customerId = Number(params.customerId);

    const [customer, setCustomer] = useState<CustomerInfo | null>(null);
    const [bills, setBills] = useState<UnpaidBill[]>([]);
    const [selectedBillIds, setSelectedBillIds] = useState<Set<number>>(new Set());
    const [isLoading, setIsLoading] = useState(true);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showSuccess, setShowSuccess] = useState(false);
    const [receiptNumber, setReceiptNumber] = useState('');

    const {
        register,
        handleSubmit,
        watch,
        setValue,
        formState: { errors },
    } = useForm<PaymentForm>();

    const paymentAmount = watch('paymentAmount', 0);
    const paymentMethod = watch('paymentMethod');

    useEffect(() => {
        fetchCustomerBills();
    }, [customerId]);

    useEffect(() => {
        // Auto-fill payment amount when bills are selected
        const selectedTotal = calculateSelectedTotal();
        setValue('paymentAmount', selectedTotal);
    }, [selectedBillIds, bills]);

    const fetchCustomerBills = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(
                `/api/v1/payments/cashier/customer/${customerId}/unpaid-bills`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`,
                    },
                }
            );

            if (response.ok) {
                const data = await response.json();
                setCustomer(data.customer);
                setBills(data.bills || []);
            }
        } catch (error) {
            console.error('Failed to fetch customer bills:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const toggleBillSelection = (billId: number) => {
        const newSelection = new Set(selectedBillIds);
        if (newSelection.has(billId)) {
            newSelection.delete(billId);
        } else {
            newSelection.add(billId);
        }
        setSelectedBillIds(newSelection);
    };

    const selectAllUnpaid = () => {
        setSelectedBillIds(new Set(bills.map(b => b.billId)));
    };

    const clearSelection = () => {
        setSelectedBillIds(new Set());
    };

    const calculateSelectedTotal = () => {
        return bills
            .filter(bill => selectedBillIds.has(bill.billId))
            .reduce((sum, bill) => sum + bill.outstandingAmount, 0);
    };

    const calculateChange = () => {
        const selectedTotal = calculateSelectedTotal();
        return Math.max(0, paymentAmount - selectedTotal);
    };

    const calculateNewOutstanding = () => {
        const selectedTotal = calculateSelectedTotal();
        const totalOutstanding = customer?.totalOutstanding || 0;
        return Math.max(0, totalOutstanding - paymentAmount);
    };

    const onSubmit = async (data: PaymentForm, printReceipt: boolean = false) => {
        if (selectedBillIds.size === 0) {
            alert('Please select at least one bill');
            return;
        }

        const selectedTotal = calculateSelectedTotal();
        const overpayment = paymentAmount - selectedTotal;

        if (overpayment > 100) { // 100 LKR tolerance
            if (!confirm(`You are overpaying by ${formatCurrency(overpayment)}. Continue?`)) {
                return;
            }
        }

        setIsSubmitting(true);

        try {
            const response = await fetch('/api/v1/payments/cashier/record-payment', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    customerId,
                    billIds: Array.from(selectedBillIds),
                    paymentAmount: data.paymentAmount,
                    paymentMethod: data.paymentMethod,
                    transactionRef: data.transactionRef,
                    notes: data.notes,
                }),
            });

            if (!response.ok) {
                throw new Error('Payment recording failed');
            }

            const result = await response.json();
            setReceiptNumber(result.receiptNumber);
            setShowSuccess(true);

            if (printReceipt) {
                setTimeout(() => window.print(), 500);
            }
        } catch (error) {
            alert(`Failed to record payment: ${(error as Error).message}`);
        } finally {
            setIsSubmitting(false);
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

    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (showSuccess) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
                <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center">
                    <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <CheckCircle className="w-12 h-12 text-green-600" />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Payment Recorded!</h1>
                    <p className="text-gray-600 mb-6">Payment has been successfully recorded</p>

                    <div className="mb-6 p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600 mb-1">Receipt Number</p>
                        <p className="text-xl font-bold text-gray-900">{receiptNumber}</p>
                    </div>

                    <div className="space-y-3">
                        <button
                            onClick={() => window.print()}
                            className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg"
                        >
                            <Printer className="w-5 h-5" />
                            Print Receipt
                        </button>
                        <button
                            onClick={() => {
                                setShowSuccess(false);
                                setSelectedBillIds(new Set());
                                fetchCustomerBills();
                            }}
                            className="w-full px-6 py-3 border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold rounded-lg"
                        >
                            Record Another Payment
                        </button>
                        <button
                            onClick={() => router.push('/cashier/search-customer')}
                            className="w-full px-6 py-3 text-gray-600 hover:text-gray-900"
                        >
                            Return to Customer Search
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    const selectedTotal = calculateSelectedTotal();
    const changeToGive = calculateChange();
    const newOutstanding = calculateNewOutstanding();
    const requiresTransactionRef = paymentMethod && paymentMethod !== 'CASH';

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            <div className="max-w-7xl mx-auto space-y-6">
                {/* Back Button */}
                <button
                    onClick={() => router.back()}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="w-4 h-4" />
                    Back
                </button>

                {/* Customer Information Header */}
                {customer && (
                    <div className="bg-gradient-to-r from-blue-600 to-blue-800 rounded-xl p-6 text-white shadow-xl">
                        <div className="flex items-center gap-4 mb-4">
                            <div className="w-12 h-12 bg-white/20 rounded-lg flex items-center justify-center">
                                <User className="w-7 h-7" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold">
                                    {customer.firstName} {customer.lastName}
                                </h1>
                                <p className="text-blue-100">{customer.customerCode}</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <DollarSign className="w-5 h-5" />
                            <span className="text-blue-100">Total Outstanding:</span>
                            <span className="text-2xl font-bold">
                                {formatCurrency(customer.totalOutstanding)}
                            </span>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Unpaid Bills List */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-bold text-gray-900">
                                Unpaid Bills ({bills.length})
                            </h2>
                            <div className="flex gap-2">
                                <button
                                    onClick={selectAllUnpaid}
                                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                                >
                                    Select All
                                </button>
                                <span className="text-gray-400">|</span>
                                <button
                                    onClick={clearSelection}
                                    className="text-sm text-gray-600 hover:text-gray-700 font-medium"
                                >
                                    Clear
                                </button>
                            </div>
                        </div>

                        {bills.length === 0 ? (
                            <div className="text-center py-12">
                                <FileText className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <p className="text-gray-500">No unpaid bills</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {bills.map(bill => (
                                    <label
                                        key={bill.billId}
                                        className={`block p-4 rounded-lg border-2 cursor-pointer transition-all ${selectedBillIds.has(bill.billId)
                                                ? 'border-blue-500 bg-blue-50'
                                                : bill.isOverdue
                                                    ? 'border-red-200 bg-red-50'
                                                    : 'border-gray-200 hover:border-blue-200'
                                            }`}
                                    >
                                        <div className="flex items-start gap-4">
                                            <input
                                                type="checkbox"
                                                checked={selectedBillIds.has(bill.billId)}
                                                onChange={() => toggleBillSelection(bill.billId)}
                                                className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                                            />
                                            <div className="flex-1">
                                                <div className="flex items-start justify-between mb-2">
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">
                                                            {bill.billNumber}
                                                        </h3>
                                                        <p className="text-sm text-gray-600">
                                                            {formatDate(bill.billingPeriodStart)} -{' '}
                                                            {formatDate(bill.billingPeriodEnd)}
                                                        </p>
                                                    </div>
                                                    {bill.isOverdue && (
                                                        <span className="px-2 py-1 bg-red-500 text-white text-xs font-medium rounded">
                                                            {bill.daysOverdue} days overdue
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="grid grid-cols-2 gap-2 text-sm mb-2">
                                                    <div>
                                                        <span className="text-gray-600">Meter:</span>
                                                        <span className="ml-1 font-medium">
                                                            {bill.meterNumber}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Type:</span>
                                                        <span className="ml-1 font-medium">
                                                            {bill.utilityType}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Due:</span>
                                                        <span className="ml-1 font-medium">
                                                            {formatDate(bill.dueDate)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-600">Outstanding:</span>
                                                        <span className="ml-1 font-bold text-blue-600">
                                                            {formatCurrency(bill.outstandingAmount)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Payment Form */}
                    <div className="space-y-6">
                        {/* Selected Bills Summary */}
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            <h3 className="font-bold text-gray-900 mb-4">Selected Bills</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between">
                                    <span className="text-gray-600">Bills Selected:</span>
                                    <span className="font-semibold">{selectedBillIds.size}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-semibold text-gray-900">Total Amount:</span>
                                    <span className="text-xl font-bold text-blue-600">
                                        {formatCurrency(selectedTotal)}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details Form */}
                        <form onSubmit={handleSubmit(data => onSubmit(data, false))} className="bg-white rounded-xl shadow-lg p-6 space-y-4">
                            <h3 className="font-bold text-gray-900">Payment Details</h3>

                            {/* Payment Amount */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Payment Amount *
                                </label>
                                <input
                                    {...register('paymentAmount', {
                                        required: 'Payment amount is required',
                                        min: { value: 0.01, message: 'Amount must be greater than 0' },
                                    })}
                                    type="number"
                                    step="0.01"
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                                {errors.paymentAmount && (
                                    <p className="mt-1 text-sm text-red-600">{errors.paymentAmount.message}</p>
                                )}
                            </div>

                            {/* Payment Method */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Payment Method *
                                </label>
                                <div className="space-y-2">
                                    {[
                                        { value: 'CASH', label: 'Cash' },
                                        { value: 'CARD_TERMINAL', label: 'Card Terminal' },
                                        { value: 'BANK_TRANSFER', label: 'Bank Transfer' },
                                        { value: 'CHEQUE', label: 'Cheque' },
                                    ].map(method => (
                                        <label key={method.value} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                {...register('paymentMethod', { required: 'Payment method is required' })}
                                                type="radio"
                                                value={method.value}
                                                className="w-4 h-4 text-blue-600"
                                            />
                                            <span className="text-gray-700">{method.label}</span>
                                        </label>
                                    ))}
                                </div>
                                {errors.paymentMethod && (
                                    <p className="mt-1 text-sm text-red-600">{errors.paymentMethod.message}</p>
                                )}
                            </div>

                            {/* Transaction Reference */}
                            {requiresTransactionRef && (
                                <div>
                                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                                        Transaction Reference *
                                    </label>
                                    <input
                                        {...register('transactionRef', {
                                            required: requiresTransactionRef ? 'Transaction reference is required' : false,
                                        })}
                                        type="text"
                                        placeholder="Enter transaction number"
                                        className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                    />
                                    {errors.transactionRef && (
                                        <p className="mt-1 text-sm text-red-600">{errors.transactionRef.message}</p>
                                    )}
                                </div>
                            )}

                            {/* Notes */}
                            <div>
                                <label className="block text-sm font-semibold text-gray-700 mb-2">
                                    Notes (Optional)
                                </label>
                                <textarea
                                    {...register('notes', { maxLength: 500 })}
                                    rows={3}
                                    maxLength={500}
                                    placeholder="Add any special notes..."
                                    className="w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Payment Calculation */}
                            <div className="p-4 bg-gray-50 rounded-lg space-y-2">
                                <h4 className="font-semibold text-gray-900 mb-2">Payment Calculation</h4>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Selected Bills Total:</span>
                                    <span className="font-medium">{formatCurrency(selectedTotal)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Amount Paying:</span>
                                    <span className="font-medium">{formatCurrency(paymentAmount)}</span>
                                </div>
                                {changeToGive > 0 && (
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Change to Give:</span>
                                        <span className="font-bold text-green-600">
                                            {formatCurrency(changeToGive)}
                                        </span>
                                    </div>
                                )}
                                <div className="flex justify-between pt-2 border-t">
                                    <span className="font-semibold text-gray-900">New Outstanding:</span>
                                    <span className="font-bold text-blue-600">
                                        {formatCurrency(newOutstanding)}
                                    </span>
                                </div>
                            </div>

                            {/* Overpayment Warning */}
                            {changeToGive > 100 && (
                                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                                    <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-yellow-800">
                                        <strong>Overpayment:</strong> Customer is paying{' '}
                                        {formatCurrency(changeToGive)} more than the total selected bills.
                                    </p>
                                </div>
                            )}

                            {/* Action Buttons */}
                            <div className="space-y-2 pt-4">
                                <button
                                    type="submit"
                                    disabled={isSubmitting || selectedBillIds.size === 0}
                                    className="w-full px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white font-semibold rounded-lg flex items-center justify-center gap-2"
                                >
                                    <CreditCard className="w-5 h-5" />
                                    {isSubmitting ? 'Recording...' : 'Record Payment'}
                                </button>
                                <button
                                    type="button"
                                    onClick={handleSubmit(data => onSubmit(data, true))}
                                    disabled={isSubmitting || selectedBillIds.size === 0}
                                    className="w-full px-6 py-3 border-2 border-gray-300 hover:border-gray-400 disabled:border-gray-200 text-gray-700 font-semibold rounded-lg flex items-center justify-center gap-2"
                                >
                                    <Printer className="w-5 h-5" />
                                    Record & Print Receipt
                                </button>
                                <button
                                    type="button"
                                    onClick={() => router.back()}
                                    className="w-full px-6 py-3 text-gray-600 hover:text-gray-900"
                                >
                                    Cancel
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

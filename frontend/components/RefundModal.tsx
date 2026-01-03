"use client";

import { useState, useEffect, Fragment } from "react";
import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import {
    XMarkIcon,
    ExclamationTriangleIcon,
    CheckCircleIcon,
    BanknotesIcon,
    BuildingLibraryIcon,
    DocumentTextIcon,
    DocumentArrowDownIcon,
    PrinterIcon,
} from "@heroicons/react/24/outline";
import { PaymentMethod, PaymentChannel } from "@/types/payment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Refund reasons
const REFUND_REASONS = [
    { value: "OVERPAYMENT", label: "Overpayment" },
    { value: "BILL_CORRECTION", label: "Bill Correction" },
    { value: "DUPLICATE_PAYMENT", label: "Duplicate Payment" },
    { value: "CUSTOMER_REQUEST", label: "Customer Request" },
    { value: "SYSTEM_ERROR", label: "System Error" },
    { value: "OTHER", label: "Other" },
];

// Refund methods
const REFUND_METHODS = [
    {
        value: "CASH",
        label: "Cash Refund",
        icon: BanknotesIcon,
        description: "Issue cash refund to customer",
    },
    {
        value: "BANK_TRANSFER",
        label: "Bank Transfer",
        icon: BuildingLibraryIcon,
        description: "Transfer to customer bank account",
    },
    {
        value: "CREDIT",
        label: "Credit to Account",
        icon: DocumentTextIcon,
        description: "Apply credit to next bill",
    },
];

// Payment data interface
interface PaymentData {
    paymentId: number;
    receiptNumber: string;
    paymentDate: string;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    customerName: string;
    customerId: number;
    billNumber: string;
    billId: number;
    alreadyRefunded: number;
    refundable: number;
}

interface RefundModalProps {
    paymentId: number;
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

type RefundStep = "form" | "confirm" | "success";

export default function RefundModal({
    paymentId,
    isOpen,
    onClose,
    onSuccess,
}: RefundModalProps) {
    // State
    const [step, setStep] = useState<RefundStep>("form");
    const [loading, setLoading] = useState(false);
    const [fetchingPayment, setFetchingPayment] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [payment, setPayment] = useState<PaymentData | null>(null);

    // Form state
    const [refundAmount, setRefundAmount] = useState("");
    const [refundReason, setRefundReason] = useState("");
    const [refundMethod, setRefundMethod] = useState("CASH");
    const [notes, setNotes] = useState("");
    const [authorized, setAuthorized] = useState(false);
    const [confirmVerified, setConfirmVerified] = useState(false);

    // Bank details (for bank transfer)
    const [bankDetails, setBankDetails] = useState({
        accountName: "",
        accountNumber: "",
        bankName: "",
        branch: "",
    });

    // Validation errors
    const [errors, setErrors] = useState<Record<string, string>>({});

    // Success data
    const [refundReceipt, setRefundReceipt] = useState<{
        refundId: number;
        refundNumber: string;
    } | null>(null);

    // Fetch payment data
    useEffect(() => {
        if (isOpen && paymentId) {
            fetchPaymentData();
        }
    }, [isOpen, paymentId]);

    // Reset on close
    useEffect(() => {
        if (!isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const fetchPaymentData = async () => {
        setFetchingPayment(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentId}`);
            if (!response.ok) throw new Error("Failed to fetch payment data");

            const data = await response.json();
            const alreadyRefunded = data.refundedAmount || 0;

            setPayment({
                paymentId: data.paymentId,
                receiptNumber: data.receiptNumber || `RCP-${data.paymentId}`,
                paymentDate: data.paymentDate,
                paymentAmount: data.paymentAmount,
                paymentMethod: data.paymentMethod,
                customerName:
                    data.customerName ||
                    `${data.customer?.firstName || ""} ${data.customer?.lastName || ""}`.trim() ||
                    "Customer",
                customerId: data.customerId || data.customer?.customerId,
                billNumber: data.billNumber || `BILL-${data.billId}`,
                billId: data.billId,
                alreadyRefunded,
                refundable: data.paymentAmount - alreadyRefunded,
            });

            // Default refund amount to full refundable
            setRefundAmount((data.paymentAmount - alreadyRefunded).toFixed(2));
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to load payment");
        } finally {
            setFetchingPayment(false);
        }
    };

    const resetForm = () => {
        setStep("form");
        setRefundAmount("");
        setRefundReason("");
        setRefundMethod("CASH");
        setNotes("");
        setAuthorized(false);
        setConfirmVerified(false);
        setBankDetails({ accountName: "", accountNumber: "", bankName: "", branch: "" });
        setErrors({});
        setError(null);
        setRefundReceipt(null);
        setPayment(null);
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};
        const amount = parseFloat(refundAmount);

        if (!refundAmount || isNaN(amount)) {
            newErrors.refundAmount = "Refund amount is required";
        } else if (amount <= 0) {
            newErrors.refundAmount = "Refund amount must be greater than 0";
        } else if (payment && amount > payment.refundable) {
            newErrors.refundAmount = `Maximum refundable is ${formatCurrency(payment.refundable)}`;
        }

        if (!refundReason) {
            newErrors.refundReason = "Please select a refund reason";
        }

        if (!refundMethod) {
            newErrors.refundMethod = "Please select a refund method";
        }

        if (refundReason === "OTHER" && !notes.trim()) {
            newErrors.notes = "Notes are required when reason is 'Other'";
        }

        if (notes.length > 500) {
            newErrors.notes = "Notes cannot exceed 500 characters";
        }

        if (refundMethod === "BANK_TRANSFER") {
            if (!bankDetails.accountName.trim()) {
                newErrors.accountName = "Account name is required";
            }
            if (!bankDetails.accountNumber.trim()) {
                newErrors.accountNumber = "Account number is required";
            }
            if (!bankDetails.bankName.trim()) {
                newErrors.bankName = "Bank name is required";
            }
        }

        if (!authorized) {
            newErrors.authorized = "Authorization is required";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Handle proceed to confirmation
    const handleProceedToConfirm = () => {
        if (validateForm()) {
            setStep("confirm");
        }
    };

    // Handle process refund
    const handleProcessRefund = async () => {
        if (!confirmVerified) {
            setErrors({ confirm: "Please verify the refund details" });
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const payload = {
                refundAmount: parseFloat(refundAmount),
                reason: refundReason,
                refundMethod,
                notes: notes || null,
                bankDetails: refundMethod === "BANK_TRANSFER" ? bankDetails : null,
            };

            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/${paymentId}/refund`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(payload),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to process refund");
            }

            const result = await response.json();
            setRefundReceipt({
                refundId: result.refundId || result.paymentId,
                refundNumber: result.refundNumber || `RFD-${result.refundId || result.paymentId}`,
            });
            setStep("success");
            onSuccess();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to process refund");
            setStep("form");
        } finally {
            setLoading(false);
        }
    };

    // Handle download refund receipt
    const handleDownloadReceipt = async () => {
        if (!refundReceipt) return;
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/${refundReceipt.refundId}/receipt`
            );
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `refund_${refundReceipt.refundNumber}.pdf`;
            a.click();
        } catch (err) {
            console.error("Error downloading refund receipt:", err);
        }
    };

    const refundAmountNum = parseFloat(refundAmount) || 0;

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={onClose}>
                <Transition.Child
                    as={Fragment}
                    enter="ease-out duration-300"
                    enterFrom="opacity-0"
                    enterTo="opacity-100"
                    leave="ease-in duration-200"
                    leaveFrom="opacity-100"
                    leaveTo="opacity-0"
                >
                    <div className="fixed inset-0 bg-black bg-opacity-25" />
                </Transition.Child>

                <div className="fixed inset-0 overflow-y-auto">
                    <div className="flex min-h-full items-center justify-center p-4">
                        <Transition.Child
                            as={Fragment}
                            enter="ease-out duration-300"
                            enterFrom="opacity-0 scale-95"
                            enterTo="opacity-100 scale-100"
                            leave="ease-in duration-200"
                            leaveFrom="opacity-100 scale-100"
                            leaveTo="opacity-0 scale-95"
                        >
                            <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white shadow-xl transition-all">
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-red-50">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-red-100 rounded-full">
                                            <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                                        </div>
                                        <Dialog.Title className="text-xl font-semibold text-gray-900">
                                            Process Refund
                                        </Dialog.Title>
                                    </div>
                                    <button
                                        onClick={onClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Content */}
                                <div className="p-6">
                                    {/* Loading payment data */}
                                    {fetchingPayment && (
                                        <div className="flex items-center justify-center py-12">
                                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
                                        </div>
                                    )}

                                    {/* Error */}
                                    {error && (
                                        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                                            {error}
                                        </div>
                                    )}

                                    {/* Form Step */}
                                    {step === "form" && payment && !fetchingPayment && (
                                        <div className="space-y-6">
                                            {/* Original Payment Info */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h3 className="font-semibold text-gray-900 mb-3 border-b border-gray-200 pb-2">
                                                    Original Payment
                                                </h3>
                                                <div className="grid grid-cols-2 gap-3 text-sm">
                                                    <div>
                                                        <span className="text-gray-500">Receipt No.:</span>
                                                        <span className="ml-2 font-medium text-blue-600">
                                                            {payment.receiptNumber}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Payment Date:</span>
                                                        <span className="ml-2">{formatDate(payment.paymentDate)}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Customer:</span>
                                                        <span className="ml-2 font-medium">{payment.customerName}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Bill No.:</span>
                                                        <span className="ml-2">{payment.billNumber}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Payment Amount:</span>
                                                        <span className="ml-2 font-semibold">
                                                            {formatCurrency(payment.paymentAmount)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Payment Method:</span>
                                                        <span className="ml-2">{payment.paymentMethod.replace("_", " ")}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Already Refunded:</span>
                                                        <span className="ml-2 text-red-600">
                                                            {formatCurrency(payment.alreadyRefunded)}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-gray-500">Refundable:</span>
                                                        <span className="ml-2 font-bold text-green-600">
                                                            {formatCurrency(payment.refundable)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Refund Amount */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Refund Amount *
                                                </label>
                                                <div className="relative">
                                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                        LKR
                                                    </span>
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        min="0"
                                                        max={payment.refundable}
                                                        value={refundAmount}
                                                        onChange={(e) => setRefundAmount(e.target.value)}
                                                        className={`w-full pl-14 pr-4 py-3 text-lg border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.refundAmount ? "border-red-300" : "border-gray-300"
                                                            }`}
                                                    />
                                                </div>
                                                {errors.refundAmount && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.refundAmount}</p>
                                                )}
                                            </div>

                                            {/* Refund Reason */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Refund Reason *
                                                </label>
                                                <select
                                                    value={refundReason}
                                                    onChange={(e) => setRefundReason(e.target.value)}
                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent ${errors.refundReason ? "border-red-300" : "border-gray-300"
                                                        }`}
                                                >
                                                    <option value="">Select a reason...</option>
                                                    {REFUND_REASONS.map((reason) => (
                                                        <option key={reason.value} value={reason.value}>
                                                            {reason.label}
                                                        </option>
                                                    ))}
                                                </select>
                                                {errors.refundReason && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.refundReason}</p>
                                                )}
                                            </div>

                                            {/* Refund Method */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                                    Refund Method *
                                                </label>
                                                <RadioGroup value={refundMethod} onChange={setRefundMethod}>
                                                    <div className="space-y-2">
                                                        {REFUND_METHODS.map((method) => (
                                                            <RadioGroup.Option
                                                                key={method.value}
                                                                value={method.value}
                                                                className={({ checked }: { checked: boolean }) =>
                                                                    `cursor-pointer rounded-lg border p-3 flex items-center gap-3 transition-all ${checked
                                                                        ? "border-red-500 bg-red-50 ring-2 ring-red-500"
                                                                        : "border-gray-200 hover:border-gray-300"
                                                                    }`
                                                                }
                                                            >
                                                                {({ checked }: { checked: boolean }) => (
                                                                    <>
                                                                        <method.icon
                                                                            className={`w-6 h-6 ${checked ? "text-red-600" : "text-gray-400"
                                                                                }`}
                                                                        />
                                                                        <div className="flex-1">
                                                                            <p
                                                                                className={`font-medium ${checked ? "text-red-600" : "text-gray-700"
                                                                                    }`}
                                                                            >
                                                                                {method.label}
                                                                            </p>
                                                                            <p className="text-sm text-gray-500">
                                                                                {method.description}
                                                                            </p>
                                                                        </div>
                                                                    </>
                                                                )}
                                                            </RadioGroup.Option>
                                                        ))}
                                                    </div>
                                                </RadioGroup>
                                                {errors.refundMethod && (
                                                    <p className="mt-1 text-sm text-red-600">{errors.refundMethod}</p>
                                                )}
                                            </div>

                                            {/* Bank Details (conditional) */}
                                            {refundMethod === "BANK_TRANSFER" && (
                                                <div className="bg-blue-50 rounded-lg p-4 space-y-3">
                                                    <h4 className="font-medium text-blue-900">Bank Transfer Details</h4>
                                                    <div className="grid grid-cols-2 gap-3">
                                                        <div>
                                                            <label className="block text-sm text-gray-600 mb-1">
                                                                Account Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={bankDetails.accountName}
                                                                onChange={(e) =>
                                                                    setBankDetails({ ...bankDetails, accountName: e.target.value })
                                                                }
                                                                className={`w-full px-3 py-2 border rounded-lg ${errors.accountName ? "border-red-300" : "border-gray-300"
                                                                    }`}
                                                            />
                                                            {errors.accountName && (
                                                                <p className="text-xs text-red-600">{errors.accountName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 mb-1">
                                                                Account Number *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={bankDetails.accountNumber}
                                                                onChange={(e) =>
                                                                    setBankDetails({ ...bankDetails, accountNumber: e.target.value })
                                                                }
                                                                className={`w-full px-3 py-2 border rounded-lg ${errors.accountNumber ? "border-red-300" : "border-gray-300"
                                                                    }`}
                                                            />
                                                            {errors.accountNumber && (
                                                                <p className="text-xs text-red-600">{errors.accountNumber}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 mb-1">
                                                                Bank Name *
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={bankDetails.bankName}
                                                                onChange={(e) =>
                                                                    setBankDetails({ ...bankDetails, bankName: e.target.value })
                                                                }
                                                                className={`w-full px-3 py-2 border rounded-lg ${errors.bankName ? "border-red-300" : "border-gray-300"
                                                                    }`}
                                                            />
                                                            {errors.bankName && (
                                                                <p className="text-xs text-red-600">{errors.bankName}</p>
                                                            )}
                                                        </div>
                                                        <div>
                                                            <label className="block text-sm text-gray-600 mb-1">
                                                                Branch
                                                            </label>
                                                            <input
                                                                type="text"
                                                                value={bankDetails.branch}
                                                                onChange={(e) =>
                                                                    setBankDetails({ ...bankDetails, branch: e.target.value })
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* Notes */}
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Additional Notes {refundReason === "OTHER" && "*"}
                                                </label>
                                                <textarea
                                                    rows={2}
                                                    value={notes}
                                                    onChange={(e) => setNotes(e.target.value)}
                                                    maxLength={500}
                                                    className={`w-full px-3 py-2 border rounded-lg resize-none ${errors.notes ? "border-red-300" : "border-gray-300"
                                                        }`}
                                                    placeholder="Additional notes about this refund..."
                                                />
                                                <div className="flex justify-between mt-1">
                                                    {errors.notes && (
                                                        <p className="text-sm text-red-600">{errors.notes}</p>
                                                    )}
                                                    <p className="text-xs text-gray-500 ml-auto">
                                                        {notes.length}/500
                                                    </p>
                                                </div>
                                            </div>

                                            {/* Authorization */}
                                            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                                                <label className="flex items-start gap-3 cursor-pointer">
                                                    <input
                                                        type="checkbox"
                                                        checked={authorized}
                                                        onChange={(e) => setAuthorized(e.target.checked)}
                                                        className="mt-1 h-4 w-4 text-red-600 rounded border-gray-300"
                                                    />
                                                    <div>
                                                        <p className="font-medium text-yellow-800">
                                                            I confirm this refund is authorized
                                                        </p>
                                                        <p className="text-sm text-yellow-700">
                                                            By checking this box, you confirm that you have the authority
                                                            to process this refund and all details are correct.
                                                        </p>
                                                    </div>
                                                </label>
                                                {errors.authorized && (
                                                    <p className="mt-2 text-sm text-red-600">{errors.authorized}</p>
                                                )}
                                            </div>

                                            {/* Warning Messages */}
                                            <div className="space-y-2 text-sm text-gray-600">
                                                <p className="flex items-center gap-2">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                                                    This action cannot be undone
                                                </p>
                                                <p className="flex items-center gap-2">
                                                    <ExclamationTriangleIcon className="w-4 h-4 text-orange-500" />
                                                    Ensure you have collected the refund authorization
                                                </p>
                                            </div>
                                        </div>
                                    )}

                                    {/* Confirmation Step */}
                                    {step === "confirm" && payment && (
                                        <div className="space-y-6">
                                            <div className="text-center py-4">
                                                <ExclamationTriangleIcon className="w-16 h-16 text-orange-500 mx-auto mb-4" />
                                                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                                    Confirm Refund
                                                </h3>
                                                <p className="text-gray-600">
                                                    Are you sure you want to process a refund of{" "}
                                                    <span className="font-bold text-red-600">
                                                        {formatCurrency(refundAmountNum)}
                                                    </span>{" "}
                                                    to{" "}
                                                    <span className="font-semibold">{payment.customerName}</span>?
                                                </p>
                                            </div>

                                            {/* Refund Summary */}
                                            <div className="bg-gray-50 rounded-lg p-4">
                                                <h4 className="font-semibold text-gray-900 mb-3">Refund Summary</h4>
                                                <div className="space-y-2 text-sm">
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Original Payment:</span>
                                                        <span>{formatCurrency(payment.paymentAmount)}</span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Refund Amount:</span>
                                                        <span className="font-semibold text-red-600">
                                                            {formatCurrency(refundAmountNum)}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Refund Method:</span>
                                                        <span>
                                                            {REFUND_METHODS.find((m) => m.value === refundMethod)?.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between">
                                                        <span className="text-gray-500">Reason:</span>
                                                        <span>
                                                            {REFUND_REASONS.find((r) => r.value === refundReason)?.label}
                                                        </span>
                                                    </div>
                                                    <div className="flex justify-between pt-2 border-t border-gray-200">
                                                        <span className="font-medium">Net Refund:</span>
                                                        <span className="font-bold text-red-600">
                                                            {formatCurrency(refundAmountNum)}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Verification checkbox */}
                                            <label className="flex items-center gap-3 cursor-pointer bg-red-50 p-4 rounded-lg border border-red-200">
                                                <input
                                                    type="checkbox"
                                                    checked={confirmVerified}
                                                    onChange={(e) => setConfirmVerified(e.target.checked)}
                                                    className="h-5 w-5 text-red-600 rounded border-gray-300"
                                                />
                                                <span className="font-medium text-red-800">
                                                    I have verified the refund details
                                                </span>
                                            </label>
                                            {errors.confirm && (
                                                <p className="text-sm text-red-600">{errors.confirm}</p>
                                            )}
                                        </div>
                                    )}

                                    {/* Success Step */}
                                    {step === "success" && refundReceipt && (
                                        <div className="text-center py-8">
                                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                                <CheckCircleIcon className="w-12 h-12 text-green-600" />
                                            </div>
                                            <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                                Refund Processed Successfully!
                                            </h3>
                                            <p className="text-gray-600 mb-4">
                                                Refund Receipt Number:{" "}
                                                <span className="font-mono font-bold text-blue-600">
                                                    {refundReceipt.refundNumber}
                                                </span>
                                            </p>

                                            <div className="flex justify-center gap-3">
                                                <button
                                                    onClick={handleDownloadReceipt}
                                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                                                >
                                                    <DocumentArrowDownIcon className="w-5 h-5" />
                                                    Download Receipt
                                                </button>
                                                <button
                                                    onClick={onClose}
                                                    className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                                                >
                                                    Close
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Footer Actions */}
                                {step !== "success" && payment && !fetchingPayment && (
                                    <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                                        {step === "form" && (
                                            <>
                                                <button
                                                    onClick={onClose}
                                                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                                                >
                                                    Cancel
                                                </button>
                                                <button
                                                    onClick={handleProceedToConfirm}
                                                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                                                >
                                                    Process Refund
                                                </button>
                                            </>
                                        )}

                                        {step === "confirm" && (
                                            <>
                                                <button
                                                    onClick={() => setStep("form")}
                                                    className="px-4 py-2 text-gray-700 hover:text-gray-900"
                                                >
                                                    Back
                                                </button>
                                                <button
                                                    onClick={handleProcessRefund}
                                                    disabled={loading || !confirmVerified}
                                                    className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                                                >
                                                    {loading ? (
                                                        <>
                                                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                                                            Processing...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <CheckCircleIcon className="w-5 h-5" />
                                                            Confirm Refund
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                    </div>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

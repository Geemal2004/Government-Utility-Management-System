"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    ClockIcon,
    EyeIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    XCircleIcon,
    CurrencyDollarIcon,
    ChevronDownIcon,
} from "@heroicons/react/24/outline";
import {
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { PaymentMethod, PaymentChannel, Payment } from "@/types/payment";
import PaymentReceipt from "./PaymentReceipt";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Payment method icons
const PAYMENT_METHOD_ICONS: Record<PaymentMethod, React.ComponentType<{ className?: string }>> = {
    [PaymentMethod.CASH]: BanknotesIcon,
    [PaymentMethod.CARD]: CreditCardIcon,
    [PaymentMethod.BANK_TRANSFER]: BuildingLibraryIcon,
    [PaymentMethod.ONLINE]: GlobeAltIcon,
    [PaymentMethod.MOBILE_MONEY]: DevicePhoneMobileIcon,
    [PaymentMethod.CHEQUE]: DocumentTextIcon,
};

// Payment method colors
const PAYMENT_METHOD_COLORS: Record<PaymentMethod, { bg: string; text: string }> = {
    [PaymentMethod.CASH]: { bg: "bg-green-100", text: "text-green-800" },
    [PaymentMethod.CARD]: { bg: "bg-blue-100", text: "text-blue-800" },
    [PaymentMethod.BANK_TRANSFER]: { bg: "bg-purple-100", text: "text-purple-800" },
    [PaymentMethod.ONLINE]: { bg: "bg-cyan-100", text: "text-cyan-800" },
    [PaymentMethod.MOBILE_MONEY]: { bg: "bg-orange-100", text: "text-orange-800" },
    [PaymentMethod.CHEQUE]: { bg: "bg-gray-100", text: "text-gray-800" },
};

interface PaymentHistoryProps {
    customerId?: number;
    billId?: number;
    limit?: number;
    showActions?: boolean;
    viewMode?: "timeline" | "table";
}

interface PaymentHistoryItem extends Payment {
    isVoided?: boolean;
    isRefunded?: boolean;
    isPartial?: boolean;
}

export default function PaymentHistory({
    customerId,
    billId,
    limit = 10,
    showActions = true,
    viewMode = "timeline",
}: PaymentHistoryProps) {
    const [payments, setPayments] = useState<PaymentHistoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [displayCount, setDisplayCount] = useState(limit);
    const [totalCount, setTotalCount] = useState(0);
    const [view, setView] = useState<"timeline" | "table">(viewMode);

    // Receipt modal state
    const [showReceipt, setShowReceipt] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

    // Summary stats
    const [summary, setSummary] = useState({
        totalPaid: 0,
        paymentCount: 0,
        averagePayment: 0,
        mostUsedMethod: "" as PaymentMethod | "",
        dateRange: { start: "", end: "" },
    });

    // Fetch payments
    const fetchPayments = useCallback(async () => {
        if (!customerId && !billId) {
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            let url: string;
            if (billId) {
                url = `${API_BASE_URL}/api/v1/payments/bill/${billId}`;
            } else if (customerId) {
                url = `${API_BASE_URL}/api/v1/payments/customer/${customerId}`;
            } else {
                throw new Error("Either customerId or billId is required");
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to fetch payment history");
            }

            const data = await response.json();
            const paymentsList: PaymentHistoryItem[] = (data.payments || data || []).map(
                (p: any) => ({
                    paymentId: p.paymentId,
                    billId: p.billId,
                    customerId: p.customerId,
                    employeeId: p.employeeId,
                    paymentDate: p.paymentDate,
                    paymentAmount: p.paymentAmount,
                    paymentMethod: p.paymentMethod,
                    paymentChannel: p.paymentChannel,
                    transactionRef: p.transactionRef,
                    notes: p.notes,
                    billNumber: p.billNumber || `BILL-${p.billId}`,
                    customerName: p.customerName || "Customer",
                    customerEmail: p.customerEmail,
                    billAmount: p.billAmount || 0,
                    billOutstanding: p.billOutstanding || 0,
                    newOutstanding: p.newOutstanding || 0,
                    receiptNumber: p.receiptNumber || `RCP-${p.paymentId}`,
                    recordedByName: p.recordedByName,
                    billDetails: p.billDetails || {},
                    isVoided: p.isVoided || false,
                    isRefunded: p.isRefunded || false,
                    isPartial: p.newOutstanding > 0,
                })
            );

            // Sort by date descending
            paymentsList.sort(
                (a, b) =>
                    new Date(b.paymentDate).getTime() - new Date(a.paymentDate).getTime()
            );

            setPayments(paymentsList);
            setTotalCount(paymentsList.length);

            // Calculate summary
            calculateSummary(paymentsList);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [customerId, billId]);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    // Calculate summary statistics
    const calculateSummary = (paymentsList: PaymentHistoryItem[]) => {
        if (paymentsList.length === 0) {
            setSummary({
                totalPaid: 0,
                paymentCount: 0,
                averagePayment: 0,
                mostUsedMethod: "",
                dateRange: { start: "", end: "" },
            });
            return;
        }

        const totalPaid = paymentsList.reduce((sum, p) => sum + p.paymentAmount, 0);
        const paymentCount = paymentsList.length;
        const averagePayment = totalPaid / paymentCount;

        // Find most used method
        const methodCounts: Record<string, number> = {};
        paymentsList.forEach((p) => {
            methodCounts[p.paymentMethod] = (methodCounts[p.paymentMethod] || 0) + 1;
        });
        const mostUsedMethod = Object.entries(methodCounts).sort(
            (a, b) => b[1] - a[1]
        )[0]?.[0] as PaymentMethod || "";

        // Date range
        const dates = paymentsList.map((p) => new Date(p.paymentDate).getTime());
        const start = new Date(Math.min(...dates)).toISOString();
        const end = new Date(Math.max(...dates)).toISOString();

        setSummary({
            totalPaid,
            paymentCount,
            averagePayment,
            mostUsedMethod,
            dateRange: { start, end },
        });
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
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    };

    // Format time
    const formatTime = (dateString: string) => {
        const date = new Date(dateString);
        return date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Format date range
    const formatDateRange = () => {
        if (!summary.dateRange.start || !summary.dateRange.end) return "N/A";
        return `${formatDate(summary.dateRange.start)} - ${formatDate(summary.dateRange.end)}`;
    };

    // Get payment method badge
    const getMethodBadge = (method: PaymentMethod) => {
        const colors = PAYMENT_METHOD_COLORS[method] || { bg: "bg-gray-100", text: "text-gray-800" };
        const Icon = PAYMENT_METHOD_ICONS[method] || CurrencyDollarIcon;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full ${colors.bg} ${colors.text}`}
            >
                <Icon className="w-3 h-3" />
                {method.replace("_", " ")}
            </span>
        );
    };

    // Get status indicator
    const getStatusIndicator = (payment: PaymentHistoryItem) => {
        if (payment.isVoided) {
            return (
                <span className="flex items-center gap-1 text-xs text-gray-500">
                    <XCircleIcon className="w-4 h-4" />
                    VOIDED
                </span>
            );
        }
        if (payment.isRefunded) {
            return (
                <span className="flex items-center gap-1 text-xs text-red-500">
                    <ArrowPathIcon className="w-4 h-4" />
                    REFUNDED
                </span>
            );
        }
        if (payment.isPartial) {
            return (
                <span className="flex items-center gap-1 text-xs text-orange-500">
                    <ExclamationTriangleIcon className="w-4 h-4" />
                    Partial
                </span>
            );
        }
        return (
            <span className="flex items-center gap-1 text-xs text-green-500">
                <CheckCircleIcon className="w-4 h-4" />
                Full Payment
            </span>
        );
    };

    // Handle view receipt
    const handleViewReceipt = (paymentId: number) => {
        setSelectedPaymentId(paymentId);
        setShowReceipt(true);
    };

    // Handle download receipt
    const handleDownloadReceipt = async (paymentId: number, receiptNumber: string) => {
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/${paymentId}/receipt`
            );
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `receipt_${receiptNumber}.pdf`;
            a.click();
        } catch (err) {
            console.error("Error downloading receipt:", err);
        }
    };

    // Handle load more
    const handleLoadMore = () => {
        setDisplayCount((prev) => prev + limit);
    };

    const displayedPayments = payments.slice(0, displayCount);
    const hasMore = displayCount < totalCount;

    // Loading state
    if (loading) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/3" />
                    <div className="h-4 bg-gray-100 rounded w-1/2" />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-20 bg-gray-100 rounded" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-4">
                    <ExclamationTriangleIcon className="w-12 h-12 text-red-500 mx-auto mb-2" />
                    <p className="text-red-600">{error}</p>
                    <button
                        onClick={fetchPayments}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        Retry
                    </button>
                </div>
            </div>
        );
    }

    // Empty state
    if (payments.length === 0) {
        return (
            <div className="bg-white rounded-lg shadow p-6">
                <div className="text-center py-8">
                    <CurrencyDollarIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No Payments Recorded
                    </h3>
                    <p className="text-gray-500 mb-4">
                        There are no payments recorded for this {billId ? "bill" : "customer"} yet.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-lg shadow">
            {/* Header */}
            <div className="px-6 py-4 border-b border-gray-200">
                <div className="flex flex-wrap justify-between items-start gap-4">
                    <div>
                        <h3 className="text-lg font-semibold text-gray-900">Payment History</h3>
                        <div className="flex flex-wrap gap-4 mt-1 text-sm text-gray-500">
                            <span>
                                Total Paid:{" "}
                                <span className="font-semibold text-green-600">
                                    {formatCurrency(summary.totalPaid)}
                                </span>
                            </span>
                            <span>
                                Payments:{" "}
                                <span className="font-semibold">{summary.paymentCount}</span>
                            </span>
                            <span>Date Range: {formatDateRange()}</span>
                        </div>
                    </div>

                    {/* View Toggle */}
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setView("timeline")}
                            className={`px-3 py-1 text-sm rounded-lg ${view === "timeline"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Timeline
                        </button>
                        <button
                            onClick={() => setView("table")}
                            className={`px-3 py-1 text-sm rounded-lg ${view === "table"
                                    ? "bg-blue-600 text-white"
                                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                                }`}
                        >
                            Table
                        </button>
                    </div>
                </div>
            </div>

            {/* Timeline View */}
            {view === "timeline" && (
                <div className="p-6">
                    <div className="relative">
                        {/* Timeline line */}
                        <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200" />

                        {/* Timeline items */}
                        <div className="space-y-6">
                            {displayedPayments.map((payment, index) => (
                                <div key={payment.paymentId} className="relative pl-10">
                                    {/* Timeline dot */}
                                    <div
                                        className={`absolute left-2 w-4 h-4 rounded-full border-2 ${payment.isVoided
                                                ? "bg-gray-100 border-gray-400"
                                                : payment.isRefunded
                                                    ? "bg-red-100 border-red-400"
                                                    : payment.isPartial
                                                        ? "bg-orange-100 border-orange-400"
                                                        : "bg-green-100 border-green-400"
                                            }`}
                                    />

                                    {/* Date/Time label */}
                                    <div className="text-sm text-gray-500 mb-2">
                                        <ClockIcon className="w-4 h-4 inline mr-1" />
                                        {formatDate(payment.paymentDate)} - {formatTime(payment.paymentDate)}
                                    </div>

                                    {/* Payment card */}
                                    <div
                                        className={`border rounded-lg p-4 ${payment.isVoided ? "bg-gray-50 opacity-60" : "bg-white"
                                            }`}
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div>
                                                <p className="font-medium text-gray-900">
                                                    Receipt:{" "}
                                                    <span className="text-blue-600">
                                                        {payment.receiptNumber}
                                                    </span>
                                                </p>
                                                <p
                                                    className={`text-2xl font-bold ${payment.isVoided
                                                            ? "line-through text-gray-400"
                                                            : "text-gray-900"
                                                        }`}
                                                >
                                                    {formatCurrency(payment.paymentAmount)}
                                                </p>
                                            </div>
                                            {getStatusIndicator(payment)}
                                        </div>

                                        <div className="grid grid-cols-2 gap-2 text-sm text-gray-600 mb-3">
                                            <div>
                                                <span className="text-gray-400">Method:</span>{" "}
                                                {getMethodBadge(payment.paymentMethod)}
                                            </div>
                                            {!billId && (
                                                <div>
                                                    <span className="text-gray-400">Bill:</span>{" "}
                                                    <Link
                                                        href={`/bills/${payment.billId}`}
                                                        className="text-blue-600 hover:underline"
                                                    >
                                                        {payment.billNumber}
                                                    </Link>
                                                </div>
                                            )}
                                            {payment.transactionRef && (
                                                <div className="col-span-2">
                                                    <span className="text-gray-400">Transaction:</span>{" "}
                                                    <span className="font-mono">{payment.transactionRef}</span>
                                                </div>
                                            )}
                                            {payment.recordedByName && (
                                                <div>
                                                    <span className="text-gray-400">Recorded by:</span>{" "}
                                                    {payment.recordedByName}
                                                </div>
                                            )}
                                        </div>

                                        {/* Actions */}
                                        {showActions && !payment.isVoided && (
                                            <div className="flex gap-2 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => handleViewReceipt(payment.paymentId)}
                                                    className="flex items-center gap-1 px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded"
                                                >
                                                    <EyeIcon className="w-4 h-4" />
                                                    View Receipt
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDownloadReceipt(
                                                            payment.paymentId,
                                                            payment.receiptNumber
                                                        )
                                                    }
                                                    className="flex items-center gap-1 px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded"
                                                >
                                                    <DocumentArrowDownIcon className="w-4 h-4" />
                                                    Download
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Table View */}
            {view === "table" && (
                <div className="overflow-x-auto">
                    <table className="w-full">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Date
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Receipt No.
                                </th>
                                {!billId && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Bill No.
                                    </th>
                                )}
                                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                    Amount
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Method
                                </th>
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                    Status
                                </th>
                                {showActions && (
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                        Actions
                                    </th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {displayedPayments.map((payment) => (
                                <tr
                                    key={payment.paymentId}
                                    className={`hover:bg-gray-50 ${payment.isVoided ? "bg-gray-50 opacity-60" : ""
                                        }`}
                                >
                                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                        <div>{formatDate(payment.paymentDate)}</div>
                                        <div className="text-xs text-gray-500">
                                            {formatTime(payment.paymentDate)}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                                        {payment.receiptNumber}
                                    </td>
                                    {!billId && (
                                        <td className="px-4 py-3 whitespace-nowrap text-sm">
                                            <Link
                                                href={`/bills/${payment.billId}`}
                                                className="text-blue-600 hover:underline"
                                            >
                                                {payment.billNumber}
                                            </Link>
                                        </td>
                                    )}
                                    <td
                                        className={`px-4 py-3 whitespace-nowrap text-sm font-semibold text-right ${payment.isVoided ? "line-through text-gray-400" : "text-gray-900"
                                            }`}
                                    >
                                        {formatCurrency(payment.paymentAmount)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {getMethodBadge(payment.paymentMethod)}
                                    </td>
                                    <td className="px-4 py-3 whitespace-nowrap">
                                        {getStatusIndicator(payment)}
                                    </td>
                                    {showActions && (
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <div className="flex gap-1">
                                                <button
                                                    onClick={() => handleViewReceipt(payment.paymentId)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="View Receipt"
                                                >
                                                    <EyeIcon className="w-5 h-5" />
                                                </button>
                                                <button
                                                    onClick={() =>
                                                        handleDownloadReceipt(
                                                            payment.paymentId,
                                                            payment.receiptNumber
                                                        )
                                                    }
                                                    className="p-1 text-gray-600 hover:bg-gray-50 rounded"
                                                    title="Download Receipt"
                                                >
                                                    <DocumentArrowDownIcon className="w-5 h-5" />
                                                </button>
                                            </div>
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Load More */}
            {hasMore && (
                <div className="px-6 py-4 border-t border-gray-200 text-center">
                    <button
                        onClick={handleLoadMore}
                        className="flex items-center gap-2 mx-auto px-4 py-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                    >
                        <ChevronDownIcon className="w-5 h-5" />
                        Load More ({totalCount - displayCount} remaining)
                    </button>
                </div>
            )}

            {/* Summary Footer */}
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                        <span className="text-gray-500">Total Paid:</span>
                        <span className="ml-2 font-semibold text-green-600">
                            {formatCurrency(summary.totalPaid)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Payments:</span>
                        <span className="ml-2 font-semibold">{summary.paymentCount}</span>
                    </div>
                    <div>
                        <span className="text-gray-500">Average:</span>
                        <span className="ml-2 font-semibold">
                            {formatCurrency(summary.averagePayment)}
                        </span>
                    </div>
                    <div>
                        <span className="text-gray-500">Most Used:</span>
                        <span className="ml-2">
                            {summary.mostUsedMethod
                                ? getMethodBadge(summary.mostUsedMethod as PaymentMethod)
                                : "N/A"}
                        </span>
                    </div>
                </div>
            </div>

            {/* Receipt Modal */}
            {selectedPaymentId && (
                <PaymentReceipt
                    paymentId={selectedPaymentId}
                    isOpen={showReceipt}
                    onClose={() => {
                        setShowReceipt(false);
                        setSelectedPaymentId(null);
                    }}
                />
            )}
        </div>
    );
}

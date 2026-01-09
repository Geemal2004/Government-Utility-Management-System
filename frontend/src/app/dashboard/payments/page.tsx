"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
    Payment,
    PaymentMethod,
    PaymentChannel,
    PaymentFilters,
    PaymentSummary,
    PaginatedPaymentResponse,
} from "@/types/payment";
import {
    MagnifyingGlassIcon,
    FunnelIcon,
    ArrowDownTrayIcon,
    PlusIcon,
    EyeIcon,
    ArrowPathIcon,
    XMarkIcon,
    DocumentArrowDownIcon,
    TrashIcon,
    ClockIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
    CurrencyDollarIcon,
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    DocumentTextIcon,
    BuildingOffice2Icon,
} from "@heroicons/react/24/solid";
import RecordPaymentModal from "@/components/RecordPaymentModal";
import PaymentReceipt from "@/components/PaymentReceipt";


const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Payment Method badge configuration
const PAYMENT_METHOD_CONFIG: Record<
    PaymentMethod,
    { bg: string; text: string; icon: React.ComponentType<{ className?: string }> }
> = {
    [PaymentMethod.CASH]: {
        bg: "bg-green-100",
        text: "text-green-800",
        icon: BanknotesIcon,
    },
    [PaymentMethod.CARD]: {
        bg: "bg-blue-100",
        text: "text-blue-800",
        icon: CreditCardIcon,
    },
    [PaymentMethod.BANK_TRANSFER]: {
        bg: "bg-purple-100",
        text: "text-purple-800",
        icon: BuildingLibraryIcon,
    },
    [PaymentMethod.ONLINE]: {
        bg: "bg-cyan-100",
        text: "text-cyan-800",
        icon: GlobeAltIcon,
    },
    [PaymentMethod.MOBILE_MONEY]: {
        bg: "bg-orange-100",
        text: "text-orange-800",
        icon: DevicePhoneMobileIcon,
    },
    [PaymentMethod.CHEQUE]: {
        bg: "bg-gray-100",
        text: "text-gray-800",
        icon: DocumentTextIcon,
    },
};

// Payment Channel badge configuration
const PAYMENT_CHANNEL_CONFIG: Record<
    PaymentChannel,
    { bg: string; text: string }
> = {
    [PaymentChannel.OFFICE]: { bg: "bg-blue-100", text: "text-blue-800" },
    [PaymentChannel.WEBSITE]: { bg: "bg-green-100", text: "text-green-800" },
    [PaymentChannel.MOBILE_APP]: { bg: "bg-purple-100", text: "text-purple-800" },
    [PaymentChannel.BANK]: { bg: "bg-orange-100", text: "text-orange-800" },
    [PaymentChannel.ATM]: { bg: "bg-gray-100", text: "text-gray-800" },
};

export default function PaymentsPage() {
    const [payments, setPayments] = useState<Payment[]>([]);
    const [summary, setSummary] = useState<PaymentSummary | null>(null);
    const [todaySummary, setTodaySummary] = useState<{
        count: number;
        amount: number;
    }>({ count: 0, amount: 0 });
    const [monthSummary, setMonthSummary] = useState<{
        count: number;
        amount: number;
    }>({ count: 0, amount: 0 });
    const [overpaymentAmount, setOverpaymentAmount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filters
    const [filters, setFilters] = useState<PaymentFilters>({
        page: 1,
        limit: 25,
        sortBy: "paymentDate",
        order: "DESC",
    });
    const [showFilters, setShowFilters] = useState(false);
    const [showPaymentModal, setShowPaymentModal] = useState(false);
    const [showReceiptModal, setShowReceiptModal] = useState(false);
    const [selectedPaymentId, setSelectedPaymentId] = useState<number | null>(null);

    // Pagination
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);


    // Fetch payments
    const fetchPayments = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);

            const queryParams = new URLSearchParams();
            if (filters.search) queryParams.append("search", filters.search);
            if (filters.transactionRef)
                queryParams.append("transactionRef", filters.transactionRef);
            if (filters.paymentMethod?.length) {
                filters.paymentMethod.forEach((m) =>
                    queryParams.append("paymentMethod", m)
                );
            }
            if (filters.paymentChannel?.length) {
                filters.paymentChannel.forEach((c) =>
                    queryParams.append("paymentChannel", c)
                );
            }
            if (filters.startDate) queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);
            if (filters.minAmount !== undefined)
                queryParams.append("minAmount", filters.minAmount.toString());
            if (filters.maxAmount !== undefined)
                queryParams.append("maxAmount", filters.maxAmount.toString());
            if (filters.employeeId)
                queryParams.append("employeeId", filters.employeeId.toString());
            if (filters.customerId)
                queryParams.append("customerId", filters.customerId.toString());
            queryParams.append("page", filters.page?.toString() || "1");
            queryParams.append("limit", filters.limit?.toString() || "25");
            if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
            if (filters.order) queryParams.append("order", filters.order);

            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments?${queryParams.toString()}`
            );

            if (!response.ok) {
                throw new Error("Failed to fetch payments");
            }

            const result: PaginatedPaymentResponse = await response.json();
            setPayments(result.payments || []);
            setTotal(result.total);
            setTotalPages(result.totalPages);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
            console.error("Error fetching payments:", err);
        } finally {
            setLoading(false);
        }
    }, [filters]);

    // Fetch summary
    const fetchSummary = useCallback(async () => {
        try {
            // Get today's date range
            const today = new Date();
            const todayStart = new Date(today.setHours(0, 0, 0, 0)).toISOString();
            const todayEnd = new Date(today.setHours(23, 59, 59, 999)).toISOString();

            // Get month date range
            const monthStart = new Date(
                today.getFullYear(),
                today.getMonth(),
                1
            ).toISOString();
            const monthEnd = new Date(
                today.getFullYear(),
                today.getMonth() + 1,
                0,
                23,
                59,
                59,
                999
            ).toISOString();

            // Fetch today's summary
            const todayResponse = await fetch(
                `${API_BASE_URL}/api/v1/payments/summary?startDate=${todayStart}&endDate=${todayEnd}`
            );
            if (todayResponse.ok) {
                const todayData = await todayResponse.json();
                setTodaySummary({
                    count: todayData.totalPayments || 0,
                    amount: todayData.totalAmount || 0,
                });
            }

            // Fetch month summary
            const monthResponse = await fetch(
                `${API_BASE_URL}/api/v1/payments/summary?startDate=${monthStart}&endDate=${monthEnd}`
            );
            if (monthResponse.ok) {
                const monthData = await monthResponse.json();
                setMonthSummary({
                    count: monthData.totalPayments || 0,
                    amount: monthData.totalAmount || 0,
                });
                setSummary(monthData);
            }

            // Fetch overpayments
            const overpaymentResponse = await fetch(
                `${API_BASE_URL}/api/v1/payments/overpayments`
            );
            if (overpaymentResponse.ok) {
                const overpayments = await overpaymentResponse.json();
                const totalOverpayment = overpayments.reduce(
                    (sum: number, op: { overpaymentAmount: number }) =>
                        sum + op.overpaymentAmount,
                    0
                );
                setOverpaymentAmount(totalOverpayment);
            }
        } catch (err) {
            console.error("Error fetching summary:", err);
        }
    }, []);

    useEffect(() => {
        fetchPayments();
    }, [fetchPayments]);

    useEffect(() => {
        fetchSummary();
    }, [fetchSummary]);

    const handleFilterChange = (key: keyof PaymentFilters, value: any) => {
        setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
    };

    const clearFilters = () => {
        setFilters({
            page: 1,
            limit: 25,
            sortBy: "paymentDate",
            order: "DESC",
        });
    };

    const handleSort = (column: string) => {
        setFilters((prev) => ({
            ...prev,
            sortBy: column,
            order: prev.sortBy === column && prev.order === "ASC" ? "DESC" : "ASC",
        }));
    };

    const handleExportCSV = async () => {
        try {
            const queryParams = new URLSearchParams();
            if (filters.startDate) queryParams.append("startDate", filters.startDate);
            if (filters.endDate) queryParams.append("endDate", filters.endDate);

            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/export?${queryParams.toString()}`
            );
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
            a.click();
        } catch (err) {
            console.error("Error exporting CSV:", err);
            alert("Failed to export CSV");
        }
    };

    const handleVoidPayment = async (paymentId: number) => {
        const reason = prompt("Please enter the reason for voiding this payment:");
        if (!reason) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/${paymentId}/void`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ reason }),
                }
            );

            if (!response.ok) throw new Error("Failed to void payment");

            alert("Payment voided successfully");
            fetchPayments();
            fetchSummary();
        } catch (err) {
            console.error("Error voiding payment:", err);
            alert("Failed to void payment");
        }
    };

    const handleRefund = async (paymentId: number, paymentAmount: number) => {
        const refundAmountStr = prompt(
            `Enter refund amount (max: ${formatCurrency(paymentAmount)}):`
        );
        if (!refundAmountStr) return;

        const refundAmount = parseFloat(refundAmountStr);
        if (isNaN(refundAmount) || refundAmount <= 0 || refundAmount > paymentAmount) {
            alert("Invalid refund amount");
            return;
        }

        const reason = prompt("Please enter the refund reason:");
        if (!reason) return;

        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/${paymentId}/refund`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        refundAmount,
                        refundReason: reason,
                        refundMethod: "CASH",
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to process refund");

            alert("Refund processed successfully");
            fetchPayments();
            fetchSummary();
        } catch (err) {
            console.error("Error processing refund:", err);
            alert("Failed to process refund");
        }
    };

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
            alert("Failed to download receipt");
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "LKR",
        }).format(amount);
    };

    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return {
            date: date.toLocaleDateString("en-US", {
                year: "numeric",
                month: "short",
                day: "numeric",
            }),
            time: date.toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
            }),
        };
    };

    const getPaymentMethodBadge = (method: PaymentMethod) => {
        const config = PAYMENT_METHOD_CONFIG[method] || {
            bg: "bg-gray-100",
            text: "text-gray-800",
            icon: CurrencyDollarIcon,
        };
        const Icon = config.icon;
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded-full ${config.bg} ${config.text}`}
            >
                <Icon className="w-3 h-3" />
                {method.replace("_", " ")}
            </span>
        );
    };

    const getPaymentChannelBadge = (channel: PaymentChannel | null) => {
        if (!channel) return null;
        const config = PAYMENT_CHANNEL_CONFIG[channel] || {
            bg: "bg-gray-100",
            text: "text-gray-800",
        };
        return (
            <span
                className={`inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded ${config.bg} ${config.text}`}
            >
                {channel.replace("_", " ")}
            </span>
        );
    };

    const getRowHighlight = (payment: Payment) => {
        if (payment.isVoided) return "bg-red-50 line-through";
        if (payment.isRefunded) return "bg-gray-50";
        if (payment.newOutstanding < 0) return "bg-yellow-50";
        return "";
    };

    const getStatusBadge = (payment: Payment) => {
        if (payment.isVoided) {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-red-100 text-red-800">
                    VOIDED
                </span>
            );
        }
        if (payment.isRefunded) {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                    REFUNDED
                </span>
            );
        }
        if (payment.newOutstanding < 0) {
            return (
                <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
                    OVERPAID
                </span>
            );
        }
        return null;
    };

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Header */}
            <div className="mb-6">
                <div className="flex justify-between items-center">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Payments</h1>
                        <p className="text-gray-600 mt-1">
                            Manage and track payment transactions
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <button
                            onClick={handleExportCSV}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ArrowDownTrayIcon className="w-5 h-5" />
                            Export CSV
                        </button>
                        <Link
                            href="/payments/daily-report"
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            <ClockIcon className="w-5 h-5" />
                            Daily Report
                        </Link>
                        <button
                            onClick={() => setShowPaymentModal(true)}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                        >
                            <PlusIcon className="w-5 h-5" />
                            Record Payment
                        </button>
                    </div>
                </div>
            </div>

            {/* Record Payment Modal */}
            <RecordPaymentModal
                isOpen={showPaymentModal}
                onClose={() => setShowPaymentModal(false)}
                onSuccess={() => {
                    fetchPayments();
                    fetchSummary();
                }}
            />

            {/* Payment Receipt Modal */}
            {selectedPaymentId && (
                <PaymentReceipt
                    paymentId={selectedPaymentId}
                    isOpen={showReceiptModal}
                    onClose={() => {
                        setShowReceiptModal(false);
                        setSelectedPaymentId(null);
                    }}
                />
            )}

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
                {/* Today's Collections */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Today&apos;s Collections
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {formatCurrency(todaySummary.amount)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {todaySummary.count} payments
                            </p>
                        </div>
                        <div className="bg-green-100 p-3 rounded-full">
                            <BanknotesIcon className="w-6 h-6 text-green-600" />
                        </div>
                    </div>
                </div>

                {/* Month's Collections */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                This Month&apos;s Collections
                            </p>
                            <p className="text-2xl font-bold text-gray-900 mt-2">
                                {formatCurrency(monthSummary.amount)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">
                                {monthSummary.count} payments
                            </p>
                        </div>
                        <div className="bg-blue-100 p-3 rounded-full">
                            <CurrencyDollarIcon className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                {/* Outstanding Amount */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">
                                Outstanding Amount
                            </p>
                            <p className="text-2xl font-bold text-orange-600 mt-2">
                                {formatCurrency(0)} {/* Placeholder - fetch from bills */}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">From unpaid bills</p>
                        </div>
                        <div className="bg-orange-100 p-3 rounded-full">
                            <ExclamationTriangleIcon className="w-6 h-6 text-orange-600" />
                        </div>
                    </div>
                </div>

                {/* Overpayments */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-medium text-gray-600">Overpayments</p>
                            <p className="text-2xl font-bold text-yellow-600 mt-2">
                                {formatCurrency(overpaymentAmount)}
                            </p>
                            <p className="text-sm text-gray-500 mt-1">Pending refunds</p>
                        </div>
                        <div className="bg-yellow-100 p-3 rounded-full">
                            <ArrowPathIcon className="w-6 h-6 text-yellow-600" />
                        </div>
                    </div>
                </div>
            </div>

            {/* Quick Actions Bar */}
            <div className="bg-white rounded-lg shadow p-4 mb-6">
                <div className="flex items-center justify-between">
                    <div className="flex gap-3">
                        <button
                            onClick={() =>
                                handleFilterChange("startDate", new Date().toISOString().split("T")[0])
                            }
                            className="px-4 py-2 bg-blue-50 text-blue-700 rounded-lg hover:bg-blue-100 transition-colors text-sm font-medium"
                        >
                            Today&apos;s Payments
                        </button>
                        <button
                            onClick={() => {
                                setFilters((prev) => ({
                                    ...prev,
                                    page: 1,
                                }));
                                // Navigate to overpayments view
                                window.location.href = "/payments/overpayments";
                            }}
                            className="px-4 py-2 bg-yellow-50 text-yellow-700 rounded-lg hover:bg-yellow-100 transition-colors text-sm font-medium"
                        >
                            View Overpayments
                        </button>
                        <button
                            onClick={() =>
                                (window.location.href = "/payments/pending-reconciliation")
                            }
                            className="px-4 py-2 bg-purple-50 text-purple-700 rounded-lg hover:bg-purple-100 transition-colors text-sm font-medium"
                        >
                            Pending Reconciliation
                        </button>
                    </div>
                    <button
                        onClick={() => setShowFilters(!showFilters)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors ${showFilters
                            ? "bg-blue-600 text-white"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                            }`}
                    >
                        <FunnelIcon className="w-5 h-5" />
                        {showFilters ? "Hide Filters" : "Show Filters"}
                    </button>
                </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
                <div className="bg-white rounded-lg shadow p-6 mb-6">
                    <div className="flex items-center gap-2 mb-4">
                        <FunnelIcon className="w-5 h-5 text-gray-600" />
                        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Search */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Search
                            </label>
                            <div className="relative">
                                <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                <input
                                    type="text"
                                    placeholder="Receipt, customer, transaction ref"
                                    value={filters.search || ""}
                                    onChange={(e) => handleFilterChange("search", e.target.value)}
                                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                />
                            </div>
                        </div>

                        {/* Payment Method */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Method
                            </label>
                            <select
                                value={filters.paymentMethod?.[0] || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "paymentMethod",
                                        e.target.value ? [e.target.value] : undefined
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Methods</option>
                                {Object.values(PaymentMethod).map((method) => (
                                    <option key={method} value={method}>
                                        {method.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Payment Channel */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Payment Channel
                            </label>
                            <select
                                value={filters.paymentChannel?.[0] || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "paymentChannel",
                                        e.target.value ? [e.target.value] : undefined
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            >
                                <option value="">All Channels</option>
                                {Object.values(PaymentChannel).map((channel) => (
                                    <option key={channel} value={channel}>
                                        {channel.replace("_", " ")}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Employee/Cashier */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Cashier/Employee
                            </label>
                            <input
                                type="number"
                                placeholder="Employee ID"
                                value={filters.employeeId || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "employeeId",
                                        e.target.value ? parseInt(e.target.value) : undefined
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Start Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Start Date
                            </label>
                            <input
                                type="date"
                                value={filters.startDate || ""}
                                onChange={(e) =>
                                    handleFilterChange("startDate", e.target.value || undefined)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* End Date */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                End Date
                            </label>
                            <input
                                type="date"
                                value={filters.endDate || ""}
                                onChange={(e) =>
                                    handleFilterChange("endDate", e.target.value || undefined)
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Min Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Min Amount
                            </label>
                            <input
                                type="number"
                                placeholder="0.00"
                                value={filters.minAmount || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "minAmount",
                                        e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>

                        {/* Max Amount */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Max Amount
                            </label>
                            <input
                                type="number"
                                placeholder="999999.00"
                                value={filters.maxAmount || ""}
                                onChange={(e) =>
                                    handleFilterChange(
                                        "maxAmount",
                                        e.target.value ? parseFloat(e.target.value) : undefined
                                    )
                                }
                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                            />
                        </div>
                    </div>

                    <div className="mt-4 flex justify-end">
                        <button
                            onClick={clearFilters}
                            className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <XMarkIcon className="w-5 h-5" />
                            Clear Filters
                        </button>
                    </div>
                </div>
            )}

            {/* Data Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
                {error && (
                    <div className="p-4 bg-red-50 border-l-4 border-red-500">
                        <p className="text-red-700">{error}</p>
                    </div>
                )}

                {loading ? (
                    <div className="p-12">
                        {/* Skeleton Loading */}
                        <div className="animate-pulse space-y-4">
                            <div className="h-10 bg-gray-200 rounded w-full" />
                            {[...Array(5)].map((_, i) => (
                                <div key={i} className="h-16 bg-gray-100 rounded w-full" />
                            ))}
                        </div>
                    </div>
                ) : payments.length === 0 ? (
                    <div className="p-12 text-center">
                        <CurrencyDollarIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No payments found
                        </h3>
                        <p className="text-gray-600">
                            Try adjusting your filters or record a new payment
                        </p>
                    </div>
                ) : (
                    <>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50 border-b border-gray-200">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Receipt No.
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("paymentDate")}
                                        >
                                            Date & Time{" "}
                                            {filters.sortBy === "paymentDate" &&
                                                (filters.order === "ASC" ? "↑" : "↓")}
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("customerName")}
                                        >
                                            Customer{" "}
                                            {filters.sortBy === "customerName" &&
                                                (filters.order === "ASC" ? "↑" : "↓")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bill No.
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Bill Amount
                                        </th>
                                        <th
                                            className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                                            onClick={() => handleSort("paymentAmount")}
                                        >
                                            Payment{" "}
                                            {filters.sortBy === "paymentAmount" &&
                                                (filters.order === "ASC" ? "↑" : "↓")}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Outstanding
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Method
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Channel
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Transaction Ref
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Recorded By
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Status
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Actions
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {payments.map((payment) => {
                                        const { date, time } = formatDateTime(payment.paymentDate);
                                        return (
                                            <tr
                                                key={payment.paymentId}
                                                className={`hover:bg-gray-50 ${getRowHighlight(payment)}`}
                                            >
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-medium text-blue-600">
                                                    <Link href={`/payments/${payment.paymentId}`}>
                                                        {payment.receiptNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div>{date}</div>
                                                    <div className="text-xs text-gray-500">{time}</div>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`/customers/${payment.customerId}`}
                                                        className="text-sm text-blue-600 hover:underline"
                                                    >
                                                        {payment.customerName}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    <Link
                                                        href={`/bills/${payment.billId}`}
                                                        className="text-sm text-blue-600 hover:underline"
                                                    >
                                                        {payment.billNumber}
                                                    </Link>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    {formatCurrency(payment.billAmount)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                                                    {formatCurrency(payment.paymentAmount)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <span
                                                        className={
                                                            payment.newOutstanding < 0
                                                                ? "text-yellow-600 font-medium"
                                                                : ""
                                                        }
                                                    >
                                                        {formatCurrency(payment.newOutstanding)}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {getPaymentMethodBadge(payment.paymentMethod)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {getPaymentChannelBadge(payment.paymentChannel)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {payment.transactionRef || "-"}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {payment.recordedByName || "-"}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap">
                                                    {getStatusBadge(payment)}
                                                </td>
                                                <td className="px-4 py-4 whitespace-nowrap text-sm">
                                                    <div className="flex items-center gap-2">
                                                        <button
                                                            onClick={() =>
                                                                handleDownloadReceipt(
                                                                    payment.paymentId,
                                                                    payment.receiptNumber
                                                                )
                                                            }
                                                            className="text-blue-600 hover:text-blue-800"
                                                            title="Download Receipt"
                                                        >
                                                            <DocumentArrowDownIcon className="w-5 h-5" />
                                                        </button>
                                                        <button
                                                            onClick={() => window.location.href = `/payments/${payment.paymentId}`}
                                                            className="text-gray-600 hover:text-gray-800"
                                                            title="View Details"
                                                        >
                                                            <EyeIcon className="w-5 h-5" />
                                                        </button>
                                                        {!payment.isVoided && !payment.isRefunded && (
                                                            <>
                                                                <button
                                                                    onClick={() =>
                                                                        handleRefund(
                                                                            payment.paymentId,
                                                                            payment.paymentAmount
                                                                        )
                                                                    }
                                                                    className="text-orange-600 hover:text-orange-800"
                                                                    title="Process Refund"
                                                                >
                                                                    <ArrowPathIcon className="w-5 h-5" />
                                                                </button>
                                                                <button
                                                                    onClick={() =>
                                                                        handleVoidPayment(payment.paymentId)
                                                                    }
                                                                    className="text-red-600 hover:text-red-800"
                                                                    title="Void Payment"
                                                                >
                                                                    <TrashIcon className="w-5 h-5" />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <p className="text-sm text-gray-700">
                                        Showing{" "}
                                        <span className="font-medium">
                                            {(filters.page! - 1) * filters.limit! + 1}
                                        </span>{" "}
                                        to{" "}
                                        <span className="font-medium">
                                            {Math.min(filters.page! * filters.limit!, total)}
                                        </span>{" "}
                                        of <span className="font-medium">{total}</span> results
                                    </p>
                                    <select
                                        value={filters.limit}
                                        onChange={(e) =>
                                            handleFilterChange("limit", Number(e.target.value))
                                        }
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                                    >
                                        <option value={10}>10 per page</option>
                                        <option value={25}>25 per page</option>
                                        <option value={50}>50 per page</option>
                                        <option value={100}>100 per page</option>
                                    </select>
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() =>
                                            handleFilterChange("page", Math.max(1, filters.page! - 1))
                                        }
                                        disabled={filters.page === 1}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Previous
                                    </button>

                                    {[...Array(Math.min(5, totalPages))].map((_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (filters.page! <= 3) {
                                            pageNum = i + 1;
                                        } else if (filters.page! >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = filters.page! - 2 + i;
                                        }

                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => handleFilterChange("page", pageNum)}
                                                className={`px-3 py-1 border rounded-lg text-sm font-medium ${filters.page === pageNum
                                                    ? "bg-blue-600 text-white border-blue-600"
                                                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                                                    }`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}

                                    <button
                                        onClick={() =>
                                            handleFilterChange(
                                                "page",
                                                Math.min(totalPages, filters.page! + 1)
                                            )
                                        }
                                        disabled={filters.page === totalPages}
                                        className="px-3 py-1 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        Next
                                    </button>
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}

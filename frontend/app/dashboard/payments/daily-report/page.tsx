"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
    CalendarIcon,
    UserIcon,
    PrinterIcon,
    DocumentArrowDownIcon,
    ArrowPathIcon,
    ChartBarIcon,
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    ClockIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import {
    CurrencyDollarIcon,
    ReceiptPercentIcon,
} from "@heroicons/react/24/solid";
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
} from "recharts";
import { PaymentMethod, PaymentChannel } from "@/types/payment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Company info for print header
const COMPANY_INFO = {
    name: "Ceylon Utility Services",
    address: "No. 123, Utility Road, Colombo 07",
    phone: "+94 11 234 5678",
};

// Interfaces
interface DailyReportData {
    date: string;
    cashierName: string;
    cashierId: number;
    openingBalance: number;
    closingBalance: number;
    totalCollected: number;
    totalTransactions: number;
    cashCollected: number;
    nonCashCollected: number;
    status: "OPEN" | "CLOSED";
    byMethod: Array<{ category: string; count: number; amount: number }>;
    byChannel: Array<{ category: string; count: number; amount: number }>;
    byHour: Array<{ hour: string; amount: number; count: number }>;
    payments: PaymentRecord[];
    generatedAt: string;
}

interface PaymentRecord {
    paymentId: number;
    receiptNumber: string;
    paymentDate: string;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    paymentChannel: PaymentChannel | null;
    transactionRef: string | null;
    customerName: string;
    billNumber: string;
}

interface Employee {
    employeeId: number;
    firstName: string;
    lastName: string;
}

export default function DailyCollectionReportPage() {
    // State
    const [reportDate, setReportDate] = useState(
        new Date().toISOString().split("T")[0]
    );
    const [selectedEmployee, setSelectedEmployee] = useState<number | null>(null);
    const [employees, setEmployees] = useState<Employee[]>([]);
    const [report, setReport] = useState<DailyReportData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Cash reconciliation state
    const [actualCashCount, setActualCashCount] = useState<string>("");
    const [reconciliationNotes, setReconciliationNotes] = useState("");
    const [isClosing, setIsClosing] = useState(false);

    // Pagination for transactions
    const [showAllTransactions, setShowAllTransactions] = useState(false);

    const reportRef = useRef<HTMLDivElement>(null);

    // Fetch employees (for admin/manager)
    useEffect(() => {
        fetchEmployees();
    }, []);

    // Auto-generate report on load
    useEffect(() => {
        if (reportDate) {
            generateReport();
        }
    }, []);

    const fetchEmployees = async () => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/employees?role=CASHIER`);
            if (response.ok) {
                const data = await response.json();
                setEmployees(data.employees || data || []);
            }
        } catch (err) {
            console.error("Error fetching employees:", err);
        }
    };

    const generateReport = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            let url = `${API_BASE_URL}/api/v1/payments/daily-report/${reportDate}`;
            if (selectedEmployee) {
                url += `?employeeId=${selectedEmployee}`;
            }

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error("Failed to fetch report data");
            }

            const data = await response.json();

            // Transform and enhance report data
            const reportData: DailyReportData = {
                date: reportDate,
                cashierName: data.cashierName || "All Cashiers",
                cashierId: data.cashierId || 0,
                openingBalance: data.openingBalance || 0,
                closingBalance: data.closingBalance || 0,
                totalCollected: data.totalCollected || 0,
                totalTransactions: data.totalTransactions || 0,
                cashCollected: data.cashCollected || 0,
                nonCashCollected: data.nonCashCollected || 0,
                status: data.status || "OPEN",
                byMethod: data.byMethod || [],
                byChannel: data.byChannel || [],
                byHour: generateHourlyData(data.paymentsList || data.payments || []),
                payments: (data.paymentsList || data.payments || []).map((p: any) => ({
                    paymentId: p.paymentId,
                    receiptNumber: p.receiptNumber || `RCP-${p.paymentId}`,
                    paymentDate: p.paymentDate,
                    paymentAmount: p.paymentAmount,
                    paymentMethod: p.paymentMethod,
                    paymentChannel: p.paymentChannel,
                    transactionRef: p.transactionRef,
                    customerName: p.customerName || "Customer",
                    billNumber: p.billNumber || `BILL-${p.billId}`,
                })),
                generatedAt: new Date().toISOString(),
            };

            setReport(reportData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    }, [reportDate, selectedEmployee]);

    // Generate hourly data from payments
    const generateHourlyData = (payments: any[]) => {
        const hourlyMap: Record<string, { amount: number; count: number }> = {};

        // Initialize hours from 8 AM to 6 PM
        for (let h = 8; h <= 18; h++) {
            const hourLabel = h < 12 ? `${h}AM` : h === 12 ? "12PM" : `${h - 12}PM`;
            hourlyMap[hourLabel] = { amount: 0, count: 0 };
        }

        // Aggregate payments by hour
        payments.forEach((payment) => {
            const date = new Date(payment.paymentDate);
            const hour = date.getHours();
            const hourLabel =
                hour < 12 ? `${hour}AM` : hour === 12 ? "12PM" : `${hour - 12}PM`;

            if (hourlyMap[hourLabel]) {
                hourlyMap[hourLabel].amount += payment.paymentAmount;
                hourlyMap[hourLabel].count += 1;
            }
        });

        return Object.entries(hourlyMap).map(([hour, data]) => ({
            hour,
            ...data,
        }));
    };

    // Print handler
    const handlePrint = useReactToPrint({
        contentRef: reportRef,
        documentTitle: `Daily_Report_${reportDate}`,
    });

    // Close day handler
    const handleCloseDay = async () => {
        if (!report) return;

        const actualCash = parseFloat(actualCashCount);
        if (isNaN(actualCash)) {
            alert("Please enter the actual cash count");
            return;
        }

        setIsClosing(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/daily-report/${reportDate}/close`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({
                        employeeId: selectedEmployee || report.cashierId,
                        actualCashCount: actualCash,
                        notes: reconciliationNotes,
                    }),
                }
            );

            if (!response.ok) throw new Error("Failed to close day");

            alert("Day closed successfully");
            generateReport();
        } catch (err) {
            console.error("Error closing day:", err);
            alert("Failed to close day");
        } finally {
            setIsClosing(false);
        }
    };

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-LK", {
            style: "currency",
            currency: "LKR",
            minimumFractionDigits: 2,
        }).format(amount);
    };

    // Format date
    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString("en-US", {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Format time
    const formatTime = (dateString: string) => {
        return new Date(dateString).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        });
    };

    // Calculate variance
    const calculateVariance = () => {
        if (!report || !actualCashCount) return null;
        const expected = report.openingBalance + report.cashCollected;
        const actual = parseFloat(actualCashCount);
        if (isNaN(actual)) return null;
        return actual - expected;
    };

    const variance = calculateVariance();

    // Get method totals
    const getMethodTotal = (method: string) => {
        if (!report) return 0;
        const found = report.byMethod.find(
            (m) => m.category.toUpperCase() === method.toUpperCase()
        );
        return found?.amount || 0;
    };

    // Displayed transactions
    const displayedTransactions = showAllTransactions
        ? report?.payments || []
        : (report?.payments || []).slice(0, 50);

    return (
        <div className="min-h-screen bg-gray-50 p-6">
            {/* Page Header */}
            <div className="mb-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Daily Collection Report
                        </h1>
                        <p className="text-gray-600 mt-1">
                            View and reconcile daily payment collections
                        </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                        {/* Date Selector */}
                        <div className="flex items-center gap-2">
                            <CalendarIcon className="w-5 h-5 text-gray-400" />
                            <input
                                type="date"
                                value={reportDate}
                                onChange={(e) => setReportDate(e.target.value)}
                                max={new Date().toISOString().split("T")[0]}
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {/* Cashier Selector */}
                        <div className="flex items-center gap-2">
                            <UserIcon className="w-5 h-5 text-gray-400" />
                            <select
                                value={selectedEmployee || ""}
                                onChange={(e) =>
                                    setSelectedEmployee(
                                        e.target.value ? parseInt(e.target.value) : null
                                    )
                                }
                                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                            >
                                <option value="">All Cashiers</option>
                                {employees.map((emp) => (
                                    <option key={emp.employeeId} value={emp.employeeId}>
                                        {emp.firstName} {emp.lastName}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Action Buttons */}
                        <button
                            onClick={generateReport}
                            disabled={loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            {loading ? (
                                <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                            ) : (
                                <ArrowPathIcon className="w-5 h-5" />
                            )}
                            Generate Report
                        </button>

                        <button
                            onClick={() => handlePrint()}
                            disabled={!report}
                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            Print Report
                        </button>
                    </div>
                </div>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                    {error}
                </div>
            )}

            {/* Loading State */}
            {loading && (
                <div className="flex items-center justify-center py-12">
                    <div className="animate-spin h-12 w-12 border-4 border-blue-500 rounded-full border-t-transparent" />
                </div>
            )}

            {/* Report Content */}
            {!loading && report && (
                <div ref={reportRef} className="space-y-6 print:space-y-4">
                    {/* Print Styles */}
                    <style jsx>{`
            @media print {
              @page {
                size: A4;
                margin: 10mm;
              }
              body {
                print-color-adjust: exact;
                -webkit-print-color-adjust: exact;
              }
            }
          `}</style>

                    {/* Print Header - Only visible on print */}
                    <div className="hidden print:block text-center mb-6 border-b-2 pb-4">
                        <h1 className="text-2xl font-bold">{COMPANY_INFO.name}</h1>
                        <p className="text-sm text-gray-600">{COMPANY_INFO.address}</p>
                        <p className="text-sm text-gray-600">{COMPANY_INFO.phone}</p>
                        <h2 className="text-xl font-semibold mt-4">DAILY COLLECTION REPORT</h2>
                    </div>

                    {/* Report Header Card */}
                    <div className="bg-white rounded-lg shadow p-6">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            <div>
                                <p className="text-sm text-gray-500">Report Date</p>
                                <p className="font-semibold text-lg">{formatDate(report.date)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Cashier</p>
                                <p className="font-semibold">
                                    {report.cashierName}
                                    {report.cashierId > 0 && (
                                        <span className="text-sm text-gray-500 ml-1">
                                            (ID: EMP-{report.cashierId})
                                        </span>
                                    )}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Generated At</p>
                                <p className="font-semibold">
                                    {new Date(report.generatedAt).toLocaleString()}
                                </p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-500">Status</p>
                                <span
                                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold ${report.status === "CLOSED"
                                        ? "bg-green-100 text-green-800"
                                        : "bg-yellow-100 text-yellow-800"
                                        }`}
                                >
                                    {report.status === "CLOSED" ? (
                                        <CheckCircleIcon className="w-4 h-4" />
                                    ) : (
                                        <ClockIcon className="w-4 h-4" />
                                    )}
                                    {report.status}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Summary Statistics - Row 1 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Total Collections
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(report.totalCollected)}
                                    </p>
                                </div>
                                <div className="bg-green-100 p-3 rounded-full">
                                    <CurrencyDollarIcon className="w-8 h-8 text-green-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Transactions
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {report.totalTransactions}
                                    </p>
                                </div>
                                <div className="bg-blue-100 p-3 rounded-full">
                                    <ReceiptPercentIcon className="w-8 h-8 text-blue-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Average Transaction
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {report.totalTransactions > 0
                                            ? formatCurrency(
                                                report.totalCollected / report.totalTransactions
                                            )
                                            : formatCurrency(0)}
                                    </p>
                                </div>
                                <div className="bg-purple-100 p-3 rounded-full">
                                    <ChartBarIcon className="w-8 h-8 text-purple-600" />
                                </div>
                            </div>
                        </div>

                        <div className="bg-white rounded-lg shadow p-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-600">
                                        Opening Balance
                                    </p>
                                    <p className="text-3xl font-bold text-gray-900 mt-2">
                                        {formatCurrency(report.openingBalance)}
                                    </p>
                                </div>
                                <div className="bg-orange-100 p-3 rounded-full">
                                    <BanknotesIcon className="w-8 h-8 text-orange-600" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Summary Statistics - Row 2 */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-green-500">
                            <p className="text-sm text-gray-500">Cash Collections</p>
                            <p className="text-xl font-bold text-green-600">
                                {formatCurrency(report.cashCollected)}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-blue-500">
                            <p className="text-sm text-gray-500">Card Collections</p>
                            <p className="text-xl font-bold text-blue-600">
                                {formatCurrency(getMethodTotal("CARD"))}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-purple-500">
                            <p className="text-sm text-gray-500">Bank Transfer</p>
                            <p className="text-xl font-bold text-purple-600">
                                {formatCurrency(getMethodTotal("BANK_TRANSFER"))}
                            </p>
                        </div>
                        <div className="bg-white rounded-lg shadow p-4 border-l-4 border-orange-500">
                            <p className="text-sm text-gray-500">Online/Other</p>
                            <p className="text-xl font-bold text-orange-600">
                                {formatCurrency(report.nonCashCollected - getMethodTotal("CARD") - getMethodTotal("BANK_TRANSFER"))}
                            </p>
                        </div>
                    </div>

                    {/* Tables Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Collections by Payment Method */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Collections by Payment Method
                                </h3>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Payment Method
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            Count
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {report.byMethod.map((method, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {method.category.replace("_", " ")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                {method.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {formatCurrency(method.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                    <tr className="bg-gray-50 font-semibold">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            TOTAL
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-center">
                                            {report.totalTransactions}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                            {formatCurrency(report.totalCollected)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Collections by Channel */}
                        <div className="bg-white rounded-lg shadow overflow-hidden">
                            <div className="px-6 py-4 border-b border-gray-200">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Collections by Channel
                                </h3>
                            </div>
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Channel
                                        </th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">
                                            Count
                                        </th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Amount
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {report.byChannel.map((channel, index) => (
                                        <tr key={index}>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                {channel.category.replace("_", " ")}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 text-center">
                                                {channel.count}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right">
                                                {formatCurrency(channel.amount)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Hourly Collection Chart */}
                    <div className="bg-white rounded-lg shadow p-6 print:hidden">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4">
                            Hourly Collections
                        </h3>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={report.byHour}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="hour" />
                                    <YAxis tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`} />
                                    <Tooltip
                                        formatter={(value: number | undefined) => [formatCurrency(value ?? 0), "Amount"]}
                                        labelFormatter={(label) => `Time: ${label}`}
                                    />
                                    <Bar dataKey="amount" fill="#3B82F6" radius={[4, 4, 0, 0]}>
                                        {report.byHour.map((entry, index) => (
                                            <Cell
                                                key={`cell-${index}`}
                                                fill={entry.amount > 0 ? "#3B82F6" : "#E5E7EB"}
                                            />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </div>

                    {/* Detailed Transactions Table */}
                    <div className="bg-white rounded-lg shadow overflow-hidden">
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Detailed Transactions
                                <span className="ml-2 text-sm font-normal text-gray-500">
                                    ({report.payments.length} total)
                                </span>
                            </h3>
                            {report.payments.length > 50 && !showAllTransactions && (
                                <button
                                    onClick={() => setShowAllTransactions(true)}
                                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                >
                                    View All
                                </button>
                            )}
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Time
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Receipt No.
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Customer
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Bill No.
                                        </th>
                                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                            Amount
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Method
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                                            Transaction Ref
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {displayedTransactions.length === 0 ? (
                                        <tr>
                                            <td
                                                colSpan={7}
                                                className="px-4 py-8 text-center text-gray-500"
                                            >
                                                No transactions for this day
                                            </td>
                                        </tr>
                                    ) : (
                                        displayedTransactions.map((payment) => (
                                            <tr key={payment.paymentId} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {formatTime(payment.paymentDate)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-blue-600">
                                                    {payment.receiptNumber}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                                                    {payment.customerName}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {payment.billNumber}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900 text-right">
                                                    {formatCurrency(payment.paymentAmount)}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600">
                                                    {payment.paymentMethod.replace("_", " ")}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500 font-mono">
                                                    {payment.transactionRef || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Cash Reconciliation Section */}
                    {report.status === "OPEN" && (
                        <div className="bg-white rounded-lg shadow p-6 print:hidden">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                <BanknotesIcon className="w-6 h-6" />
                                Cash Reconciliation
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Opening Balance:</span>
                                        <span className="font-semibold">
                                            {formatCurrency(report.openingBalance)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b">
                                        <span className="text-gray-600">Total Cash Received:</span>
                                        <span className="font-semibold text-green-600">
                                            {formatCurrency(report.cashCollected)}
                                        </span>
                                    </div>
                                    <div className="flex justify-between py-2 border-b bg-blue-50 px-2 rounded">
                                        <span className="text-gray-800 font-medium">
                                            Expected Closing:
                                        </span>
                                        <span className="font-bold text-blue-600">
                                            {formatCurrency(
                                                report.openingBalance + report.cashCollected
                                            )}
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Actual Cash Count
                                        </label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                LKR
                                            </span>
                                            <input
                                                type="number"
                                                step="0.01"
                                                value={actualCashCount}
                                                onChange={(e) => setActualCashCount(e.target.value)}
                                                className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                placeholder="Enter actual cash count"
                                            />
                                        </div>
                                    </div>

                                    {variance !== null && (
                                        <div
                                            className={`flex justify-between py-2 px-2 rounded ${variance === 0
                                                ? "bg-green-50"
                                                : variance > 0
                                                    ? "bg-blue-50"
                                                    : "bg-red-50"
                                                }`}
                                        >
                                            <span className="font-medium">Variance:</span>
                                            <span
                                                className={`font-bold ${variance === 0
                                                    ? "text-green-600"
                                                    : variance > 0
                                                        ? "text-blue-600"
                                                        : "text-red-600"
                                                    }`}
                                            >
                                                {variance >= 0 ? "+" : ""}
                                                {formatCurrency(variance)}
                                                {variance === 0 && " ✓"}
                                            </span>
                                        </div>
                                    )}

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">
                                            Notes
                                        </label>
                                        <textarea
                                            rows={2}
                                            value={reconciliationNotes}
                                            onChange={(e) => setReconciliationNotes(e.target.value)}
                                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 resize-none"
                                            placeholder="Any notes about the reconciliation..."
                                        />
                                    </div>

                                    <button
                                        onClick={handleCloseDay}
                                        disabled={isClosing || !actualCashCount}
                                        className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50"
                                    >
                                        {isClosing ? (
                                            <div className="animate-spin h-5 w-5 border-2 border-white rounded-full border-t-transparent" />
                                        ) : (
                                            <CheckCircleIcon className="w-5 h-5" />
                                        )}
                                        Close Cash Register
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Print Footer - Signature Lines */}
                    <div className="hidden print:block border-t-2 pt-6 mt-8">
                        <div className="grid grid-cols-2 gap-12">
                            <div className="text-center">
                                <div className="border-b border-gray-400 w-48 mx-auto mb-2 pt-12"></div>
                                <p className="text-sm text-gray-600">Cashier Signature</p>
                                <p className="text-xs text-gray-500">{report.cashierName}</p>
                            </div>
                            <div className="text-center">
                                <div className="border-b border-gray-400 w-48 mx-auto mb-2 pt-12"></div>
                                <p className="text-sm text-gray-600">Manager Signature</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Empty State */}
            {!loading && !report && !error && (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500">
                    <ChartBarIcon className="w-16 h-16 text-gray-300 mb-4" />
                    <h3 className="text-lg font-medium text-gray-700 mb-2">
                        No Report Generated
                    </h3>
                    <p className="text-gray-500 mb-4">
                        Select a date and click &quot;Generate Report&quot; to view
                        collections
                    </p>
                    <button
                        onClick={generateReport}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <ArrowPathIcon className="w-5 h-5" />
                        Generate Today&apos;s Report
                    </button>
                </div>
            )}
        </div>
    );
}

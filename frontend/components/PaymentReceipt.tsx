"use client";

import { useState, useEffect, useRef } from "react";
import { useReactToPrint } from "react-to-print";
import {
    XMarkIcon,
    PrinterIcon,
    DocumentArrowDownIcon,
    EnvelopeIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
} from "@heroicons/react/24/outline";
import { PaymentMethod, PaymentChannel } from "@/types/payment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Company information (can be made configurable)
const COMPANY_INFO = {
    name: "Ceylon Utility Services",
    address: "No. 123, Utility Road",
    city: "Colombo 07",
    postalCode: "00700",
    country: "Sri Lanka",
    phone: "+94 11 234 5678",
    email: "support@ceylonutility.lk",
    website: "www.ceylonutility.lk",
    logo: "/logo.png", // Path to company logo
};

// Payment data interface
interface PaymentReceiptData {
    paymentId: number;
    receiptNumber: string;
    paymentDate: string;
    paymentAmount: number;
    paymentMethod: PaymentMethod;
    paymentChannel: PaymentChannel | null;
    transactionRef: string | null;
    notes: string | null;
    // Bill info
    billId: number;
    billNumber: string;
    billDate: string;
    billingPeriodStart: string;
    billingPeriodEnd: string;
    billAmount: number;
    previousPayments: number;
    outstandingBefore: number;
    outstandingAfter: number;
    // Customer info
    customerId: number;
    customerName: string;
    customerEmail: string | null;
    customerPhone: string | null;
    customerAddress: string | null;
    // Meter info
    meterSerialNo: string;
    utilityType: string;
    // Employee info
    recordedByName: string | null;
    recordedById: number | null;
}

interface PaymentReceiptProps {
    paymentId?: number;
    payment?: PaymentReceiptData;
    isOpen: boolean;
    onClose: () => void;
}

export default function PaymentReceipt({
    paymentId,
    payment: initialPayment,
    isOpen,
    onClose,
}: PaymentReceiptProps) {
    const [payment, setPayment] = useState<PaymentReceiptData | null>(
        initialPayment || null
    );
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const receiptRef = useRef<HTMLDivElement>(null);

    // Fetch payment data if paymentId is provided
    useEffect(() => {
        if (paymentId && isOpen && !initialPayment) {
            fetchPaymentData(paymentId);
        }
    }, [paymentId, isOpen, initialPayment]);

    // Update payment when initialPayment changes
    useEffect(() => {
        if (initialPayment) {
            setPayment(initialPayment);
        }
    }, [initialPayment]);

    const fetchPaymentData = async (id: number) => {
        setLoading(true);
        setError(null);
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/payments/${id}`);
            if (!response.ok) {
                throw new Error("Failed to fetch payment data");
            }
            const data = await response.json();

            // Transform API response to PaymentReceiptData
            const receiptData: PaymentReceiptData = {
                paymentId: data.paymentId,
                receiptNumber: data.receiptNumber || `RCP-${data.paymentId}`,
                paymentDate: data.paymentDate,
                paymentAmount: data.paymentAmount,
                paymentMethod: data.paymentMethod,
                paymentChannel: data.paymentChannel,
                transactionRef: data.transactionRef,
                notes: data.notes,
                billId: data.billId || data.bill?.billId,
                billNumber: data.billNumber || `BILL-${data.billId}`,
                billDate: data.bill?.billDate || data.billDate,
                billingPeriodStart: data.bill?.billingPeriodStart,
                billingPeriodEnd: data.bill?.billingPeriodEnd,
                billAmount: data.billAmount || data.bill?.totalAmount || 0,
                previousPayments: data.previousPayments || 0,
                outstandingBefore: data.billOutstanding || data.outstandingBefore || 0,
                outstandingAfter: data.newOutstanding || data.outstandingAfter || 0,
                customerId: data.customerId || data.customer?.customerId,
                customerName:
                    data.customerName ||
                    `${data.customer?.firstName || ""} ${data.customer?.lastName || ""}`.trim() ||
                    "Unknown Customer",
                customerEmail: data.customerEmail || data.customer?.email,
                customerPhone: data.customerPhone || data.customer?.phone,
                customerAddress:
                    data.customerAddress ||
                    data.customer?.address?.addressLine1 ||
                    null,
                meterSerialNo:
                    data.meterSerialNo || data.bill?.meter?.meterSerialNo || "",
                utilityType:
                    data.utilityType ||
                    data.bill?.meter?.utilityType?.typeName ||
                    "",
                recordedByName:
                    data.recordedByName ||
                    `${data.employee?.firstName || ""} ${data.employee?.lastName || ""}`.trim() ||
                    null,
                recordedById: data.employeeId || data.employee?.employeeId,
            };

            setPayment(receiptData);
        } catch (err) {
            setError(err instanceof Error ? err.message : "An error occurred");
        } finally {
            setLoading(false);
        }
    };

    // Print handler
    const handlePrint = useReactToPrint({
        contentRef: receiptRef,
        documentTitle: `Receipt_${payment?.receiptNumber || "payment"}`,
    });

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
        const date = new Date(dateString);
        return date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        });
    };

    // Format date with time
    const formatDateTime = (dateString: string) => {
        const date = new Date(dateString);
        return `${date.toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
        })} ${date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
        })}`;
    };

    // Format billing period
    const formatBillingPeriod = (start: string, end: string) => {
        const startDate = new Date(start);
        const endDate = new Date(end);
        return `${startDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        })} - ${endDate.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        })}`;
    };

    // Get payment method display name
    const getPaymentMethodDisplay = (method: PaymentMethod) => {
        const methodNames: Record<PaymentMethod, string> = {
            [PaymentMethod.CASH]: "Cash",
            [PaymentMethod.CARD]: "Credit/Debit Card",
            [PaymentMethod.BANK_TRANSFER]: "Bank Transfer",
            [PaymentMethod.ONLINE]: "Online Payment",
            [PaymentMethod.MOBILE_MONEY]: "Mobile Money",
            [PaymentMethod.CHEQUE]: "Cheque",
        };
        return methodNames[method] || method;
    };

    // Get payment channel display name
    const getPaymentChannelDisplay = (channel: PaymentChannel | null) => {
        if (!channel) return "N/A";
        const channelNames: Record<PaymentChannel, string> = {
            [PaymentChannel.OFFICE]: "Office Counter",
            [PaymentChannel.WEBSITE]: "Website",
            [PaymentChannel.MOBILE_APP]: "Mobile App",
            [PaymentChannel.BANK]: "Bank",
            [PaymentChannel.ATM]: "ATM",
        };
        return channelNames[channel] || channel;
    };

    // Check if fully paid
    const isFullyPaid = payment ? payment.outstandingAfter <= 0 : false;

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4 overflow-y-auto">
            <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
                {/* Modal Header (not printed) */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 print:hidden">
                    <h2 className="text-xl font-semibold text-gray-900">Payment Receipt</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => handlePrint()}
                            disabled={!payment || loading}
                            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                        >
                            <PrinterIcon className="w-5 h-5" />
                            Print
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <XMarkIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Receipt Content */}
                <div className="flex-1 overflow-y-auto p-6">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="animate-spin h-8 w-8 border-4 border-blue-500 rounded-full border-t-transparent" />
                        </div>
                    ) : error ? (
                        <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                            {error}
                        </div>
                    ) : payment ? (
                        <div
                            ref={receiptRef}
                            className="bg-white print:p-0"
                            style={{ fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif" }}
                        >
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

                            {/* Header Section */}
                            <div className="text-center border-b-2 border-gray-300 pb-6 mb-6">
                                {/* Company Logo Placeholder */}
                                <div className="w-16 h-16 mx-auto mb-3 bg-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-2xl font-bold text-white">CU</span>
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    {COMPANY_INFO.name}
                                </h1>
                                <p className="text-sm text-gray-600">{COMPANY_INFO.address}</p>
                                <p className="text-sm text-gray-600">
                                    {COMPANY_INFO.city}, {COMPANY_INFO.postalCode}
                                </p>
                                <p className="text-sm text-gray-600">
                                    Phone: {COMPANY_INFO.phone}
                                </p>

                                <div className="mt-4 py-2 bg-gray-100 rounded-lg">
                                    <h2 className="text-xl font-bold text-gray-800 tracking-wider">
                                        PAYMENT RECEIPT
                                    </h2>
                                </div>
                            </div>

                            {/* Receipt Information */}
                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div>
                                    <p className="text-gray-500">Receipt No.:</p>
                                    <p className="font-bold text-lg text-blue-600">
                                        {payment.receiptNumber}
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-gray-500">Receipt Date:</p>
                                    <p className="font-semibold">
                                        {formatDateTime(payment.paymentDate)}
                                    </p>
                                </div>
                            </div>

                            {/* Customer Information */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-2">
                                    Customer Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Name:</span>
                                        <span className="ml-2 font-medium">{payment.customerName}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Customer ID:</span>
                                        <span className="ml-2 font-medium">
                                            CUST-{String(payment.customerId).padStart(5, "0")}
                                        </span>
                                    </div>
                                    {payment.customerAddress && (
                                        <div className="col-span-2">
                                            <span className="text-gray-500">Address:</span>
                                            <span className="ml-2">{payment.customerAddress}</span>
                                        </div>
                                    )}
                                    {payment.customerPhone && (
                                        <div>
                                            <span className="text-gray-500">Phone:</span>
                                            <span className="ml-2">{payment.customerPhone}</span>
                                        </div>
                                    )}
                                    {payment.customerEmail && (
                                        <div>
                                            <span className="text-gray-500">Email:</span>
                                            <span className="ml-2">{payment.customerEmail}</span>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Bill Information */}
                            <div className="bg-gray-50 rounded-lg p-4 mb-6">
                                <h3 className="font-semibold text-gray-800 mb-2 border-b border-gray-200 pb-2">
                                    Bill Information
                                </h3>
                                <div className="grid grid-cols-2 gap-2 text-sm">
                                    <div>
                                        <span className="text-gray-500">Bill Number:</span>
                                        <span className="ml-2 font-medium">{payment.billNumber}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Bill Date:</span>
                                        <span className="ml-2">{formatDate(payment.billDate)}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Billing Period:</span>
                                        <span className="ml-2">
                                            {formatBillingPeriod(
                                                payment.billingPeriodStart,
                                                payment.billingPeriodEnd
                                            )}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Utility Type:</span>
                                        <span className="ml-2">{payment.utilityType}</span>
                                    </div>
                                    <div className="col-span-2">
                                        <span className="text-gray-500">Meter Serial No.:</span>
                                        <span className="ml-2 font-mono">{payment.meterSerialNo}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Payment Details Table */}
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-800 mb-2">
                                    Payment Details
                                </h3>
                                <table className="w-full text-sm border-collapse">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="text-left py-2 px-3 border border-gray-300">
                                                Description
                                            </th>
                                            <th className="text-right py-2 px-3 border border-gray-300 w-32">
                                                Amount
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr>
                                            <td className="py-2 px-3 border border-gray-300">
                                                Bill Amount
                                            </td>
                                            <td className="py-2 px-3 border border-gray-300 text-right">
                                                {formatCurrency(payment.billAmount)}
                                            </td>
                                        </tr>
                                        {payment.previousPayments > 0 && (
                                            <tr>
                                                <td className="py-2 px-3 border border-gray-300">
                                                    Previous Payments
                                                </td>
                                                <td className="py-2 px-3 border border-gray-300 text-right text-green-600">
                                                    - {formatCurrency(payment.previousPayments)}
                                                </td>
                                            </tr>
                                        )}
                                        <tr>
                                            <td className="py-2 px-3 border border-gray-300">
                                                Outstanding Before
                                            </td>
                                            <td className="py-2 px-3 border border-gray-300 text-right text-orange-600">
                                                {formatCurrency(payment.outstandingBefore)}
                                            </td>
                                        </tr>
                                        <tr className="bg-blue-50">
                                            <td className="py-2 px-3 border border-gray-300 font-semibold">
                                                Payment Amount
                                            </td>
                                            <td className="py-2 px-3 border border-gray-300 text-right font-bold text-blue-600 text-lg">
                                                {formatCurrency(payment.paymentAmount)}
                                            </td>
                                        </tr>
                                        <tr className="bg-gray-50">
                                            <td className="py-2 px-3 border border-gray-300 font-semibold">
                                                New Outstanding
                                            </td>
                                            <td
                                                className={`py-2 px-3 border border-gray-300 text-right font-bold ${payment.outstandingAfter <= 0
                                                        ? "text-green-600"
                                                        : "text-orange-600"
                                                    }`}
                                            >
                                                {formatCurrency(Math.max(0, payment.outstandingAfter))}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Payment Information */}
                            <div className="grid grid-cols-2 gap-4 mb-6 text-sm">
                                <div className="space-y-1">
                                    <div>
                                        <span className="text-gray-500">Payment Method:</span>
                                        <span className="ml-2 font-medium">
                                            {getPaymentMethodDisplay(payment.paymentMethod)}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Payment Channel:</span>
                                        <span className="ml-2">
                                            {getPaymentChannelDisplay(payment.paymentChannel)}
                                        </span>
                                    </div>
                                </div>
                                <div className="space-y-1">
                                    <div>
                                        <span className="text-gray-500">Transaction Ref:</span>
                                        <span className="ml-2 font-mono">
                                            {payment.transactionRef || "N/A"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500">Recorded By:</span>
                                        <span className="ml-2">
                                            {payment.recordedByName || "System"}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Bill Status */}
                            <div
                                className={`p-4 rounded-lg mb-6 flex items-center gap-3 ${isFullyPaid
                                        ? "bg-green-50 border border-green-200"
                                        : "bg-yellow-50 border border-yellow-200"
                                    }`}
                            >
                                {isFullyPaid ? (
                                    <>
                                        <CheckCircleIcon className="w-8 h-8 text-green-600" />
                                        <div>
                                            <p className="font-bold text-green-800">PAID IN FULL</p>
                                            <p className="text-sm text-green-600">
                                                This bill has been fully settled.
                                            </p>
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        <ExclamationTriangleIcon className="w-8 h-8 text-yellow-600" />
                                        <div>
                                            <p className="font-bold text-yellow-800">PARTIALLY PAID</p>
                                            <p className="text-sm text-yellow-600">
                                                Outstanding balance: {formatCurrency(payment.outstandingAfter)}
                                            </p>
                                        </div>
                                    </>
                                )}
                            </div>

                            {/* Notes */}
                            {payment.notes && (
                                <div className="mb-6 p-3 bg-gray-50 rounded-lg">
                                    <p className="text-sm text-gray-600">
                                        <span className="font-medium">Notes:</span> {payment.notes}
                                    </p>
                                </div>
                            )}

                            {/* Footer */}
                            <div className="border-t-2 border-gray-300 pt-6 text-center text-sm text-gray-600">
                                <p className="font-medium text-gray-800 mb-2">
                                    Thank you for your payment!
                                </p>
                                <p className="mb-4">
                                    This is a computer-generated receipt and does not require a
                                    signature.
                                </p>

                                <div className="border-t border-gray-200 pt-4">
                                    <p className="mb-1">For queries, please contact:</p>
                                    <p className="font-medium">{COMPANY_INFO.email}</p>
                                    <p>{COMPANY_INFO.phone}</p>
                                </div>

                                {/* QR Code Placeholder */}
                                <div className="mt-4 flex justify-center">
                                    <div className="w-24 h-24 bg-gray-200 rounded-lg flex items-center justify-center border border-gray-300">
                                        <div className="text-center">
                                            <div className="grid grid-cols-3 gap-1">
                                                {[...Array(9)].map((_, i) => (
                                                    <div
                                                        key={i}
                                                        className={`w-4 h-4 ${[0, 2, 3, 5, 6, 8].includes(i)
                                                                ? "bg-gray-800"
                                                                : "bg-white"
                                                            }`}
                                                    />
                                                ))}
                                            </div>
                                            <p className="text-xs text-gray-500 mt-1">Verify</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Signature Line */}
                                <div className="mt-6 pt-8 border-t border-dashed border-gray-300">
                                    <div className="w-48 mx-auto border-b border-gray-400 pt-8"></div>
                                    <p className="text-xs text-gray-500 mt-1">
                                        Authorized Signature
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-12 text-gray-500">
                            No payment data available
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

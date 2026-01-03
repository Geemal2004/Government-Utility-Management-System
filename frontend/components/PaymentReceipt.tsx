'use client';

import { useEffect, useState } from 'react';
import { Printer, Download, Mail, X, CheckCircle } from 'lucide-react';
import QRCode from 'qrcode';

interface PaymentReceiptProps {
    paymentId: number;
    variant?: 'customer' | 'cashier';
    actions?: 'view' | 'print' | 'download' | 'all';
    onClose?: () => void;
}

interface PaymentData {
    receiptNumber: string;
    paymentDate: string;
    paymentId: number;
    amount: number;
    paymentMethod: string;
    paymentStatus: string;
    transactionRef?: string;
    cardLast4?: string;
    customer: {
        name: string;
        customerId: string;
        address: string;
        phone: string;
        email: string;
    };
    bills: {
        billNumber: string;
        billingPeriodStart: string;
        billingPeriodEnd: string;
        meterNumber: string;
        utilityType: string;
        amount: number;
    }[];
}

export default function PaymentReceipt({ paymentId, variant = 'customer', actions = 'all', onClose }: PaymentReceiptProps) {
    const [payment, setPayment] = useState<PaymentData | null>(null);
    const [qrCodeUrl, setQrCodeUrl] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        fetchPaymentData();
    }, [paymentId]);

    useEffect(() => {
        if (payment) {
            generateQRCode();
        }
    }, [payment]);

    const fetchPaymentData = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`/api/v1/payments/${paymentId}`, {
                headers: {
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
            });

            if (response.ok) {
                const data = await response.json();
                setPayment(data);
            }
        } catch (error) {
            console.error('Failed to fetch payment data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const generateQRCode = async () => {
        if (!payment) return;

        const verificationUrl = `${window.location.origin}/verify-receipt?receipt=${payment.receiptNumber}&amount=${payment.amount}&date=${payment.paymentDate}`;

        try {
            const qrUrl = await QRCode.toDataURL(verificationUrl, {
                width: 150,
                margin: 1,
            });
            setQrCodeUrl(qrUrl);
        } catch (error) {
            console.error('Failed to generate QR code:', error);
        }
    };

    const handlePrint = () => {
        window.print();
    };

    const handleDownloadPDF = () => {
        // Trigger print dialog which can save as PDF
        window.print();
    };

    const handleEmailReceipt = async () => {
        if (!payment) return;

        try {
            const response = await fetch('/api/v1/payments/email-receipt', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${localStorage.getItem('token')}`,
                },
                body: JSON.stringify({
                    paymentId,
                    email: payment.customer.email,
                }),
            });

            if (response.ok) {
                alert('Receipt sent to email successfully');
            } else {
                alert('Failed to send receipt');
            }
        } catch (error) {
            console.error('Failed to email receipt:', error);
            alert('Failed to send receipt');
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

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
        });
    };

    if (isLoading) {
        return (
            <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!payment) {
        return (
            <div className="text-center p-12">
                <p className="text-gray-500">Receipt not found</p>
            </div>
        );
    }

    const showActions = actions === 'all' || actions !== 'view';

    return (
        <div className={`${variant === 'customer' ? 'bg-gray-50' : 'bg-white'} min-h-screen p-6 print:p-0 print:bg-white`}>
            <div className="max-w-3xl mx-auto">
                {/* Action Buttons */}
                {showActions && (
                    <div className="mb-6 flex items-center justify-between print:hidden">
                        <div className="flex gap-2">
                            {(actions === 'all' || actions === 'print') && (
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                            )}
                            {(actions === 'all' || actions === 'download') && (
                                <button
                                    onClick={handleDownloadPDF}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg"
                                >
                                    <Download className="w-4 h-4" />
                                    Download PDF
                                </button>
                            )}
                            {actions === 'all' && (
                                <button
                                    onClick={handleEmailReceipt}
                                    className="flex items-center gap-2 px-4 py-2 border border-gray-300 hover:bg-gray-50 rounded-lg"
                                >
                                    <Mail className="w-4 h-4" />
                                    Email
                                </button>
                            )}
                        </div>
                        {onClose && (
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-gray-100 rounded-lg"
                            >
                                <X className="w-5 h-5" />
                            </button>
                        )}
                    </div>
                )}

                {/* Receipt */}
                <div className="bg-white shadow-xl rounded-lg print:shadow-none print:rounded-none">
                    {/* Header */}
                    <div className="border-b-4 border-blue-600 p-8 text-center print:border-b-2">
                        <div className="mb-4">
                            <h1 className="text-3xl font-bold text-gray-900 print:text-2xl">
                                GOVERNMENT UTILITY MANAGEMENT
                            </h1>
                            <p className="text-gray-600 mt-2">123 Main Street, Colombo, Sri Lanka</p>
                            <p className="text-gray-600">Phone: +94 11 234 5678 | Email: info@utility.gov.lk</p>
                        </div>

                        <div className="inline-block bg-blue-600 text-white px-6 py-2 rounded-lg print:bg-gray-900">
                            <h2 className="text-xl font-bold">PAYMENT RECEIPT</h2>
                        </div>
                    </div>

                    {/* Receipt Information */}
                    <div className="p-8 space-y-6">
                        {/* Receipt Details */}
                        <div className="grid grid-cols-2 gap-4 pb-6 border-b">
                            <div>
                                <p className="text-sm text-gray-600">Receipt Number</p>
                                <p className="text-lg font-bold text-gray-900">{payment.receiptNumber}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Date & Time</p>
                                <p className="text-lg font-semibold text-gray-900">{formatDateTime(payment.paymentDate)}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Payment ID</p>
                                <p className="font-semibold text-gray-900">#{payment.paymentId}</p>
                            </div>
                            <div>
                                <p className="text-sm text-gray-600">Status</p>
                                <span className="inline-flex items-center gap-1 px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-semibold">
                                    <CheckCircle className="w-4 h-4" />
                                    {payment.paymentStatus}
                                </span>
                            </div>
                        </div>

                        {/* Customer Information */}
                        <div className="pb-6 border-b">
                            <h3 className="font-bold text-gray-900 mb-4">Customer Information</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Name</p>
                                    <p className="font-semibold text-gray-900">{payment.customer.name}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Customer ID</p>
                                    <p className="font-semibold text-gray-900">{payment.customer.customerId}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Phone</p>
                                    <p className="font-semibold text-gray-900">{payment.customer.phone}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Email</p>
                                    <p className="font-semibold text-gray-900">{payment.customer.email}</p>
                                </div>
                                <div className="col-span-2">
                                    <p className="text-sm text-gray-600">Address</p>
                                    <p className="font-semibold text-gray-900">{payment.customer.address}</p>
                                </div>
                            </div>
                        </div>

                        {/* Payment Details */}
                        <div className="pb-6 border-b">
                            <h3 className="font-bold text-gray-900 mb-4">Payment Details</h3>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm text-gray-600">Payment Method</p>
                                    <p className="font-semibold text-gray-900">{payment.paymentMethod}</p>
                                </div>
                                {payment.cardLast4 && (
                                    <div>
                                        <p className="text-sm text-gray-600">Card Number</p>
                                        <p className="font-semibold text-gray-900">**** **** **** {payment.cardLast4}</p>
                                    </div>
                                )}
                                {payment.transactionRef && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600">Transaction ID</p>
                                        <p className="font-mono text-sm text-gray-900">{payment.transactionRef}</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bills Paid */}
                        <div className="pb-6 border-b">
                            <h3 className="font-bold text-gray-900 mb-4">Bills Paid</h3>
                            <div className="space-y-4">
                                {payment.bills.map((bill, index) => (
                                    <div key={index} className="p-4 bg-gray-50 rounded-lg print:bg-white print:border print:border-gray-300">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-bold text-gray-900">{bill.billNumber}</h4>
                                            <span className="font-bold text-blue-600">{formatCurrency(bill.amount)}</span>
                                        </div>
                                        <div className="grid grid-cols-2 gap-2 text-sm">
                                            <div>
                                                <span className="text-gray-600">Billing Period:</span>
                                                <span className="ml-2 text-gray-900">
                                                    {formatDate(bill.billingPeriodStart)} - {formatDate(bill.billingPeriodEnd)}
                                                </span>
                                            </div>
                                            <div>
                                                <span className="text-gray-600">Utility Type:</span>
                                                <span className="ml-2 text-gray-900">{bill.utilityType}</span>
                                            </div>
                                            <div className="col-span-2">
                                                <span className="text-gray-600">Meter Number:</span>
                                                <span className="ml-2 text-gray-900">{bill.meterNumber}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Total Amount */}
                        <div className="bg-blue-50 p-6 rounded-lg print:bg-gray-100">
                            <div className="flex justify-between items-center">
                                <span className="text-xl font-bold text-gray-900">TOTAL AMOUNT PAID</span>
                                <span className="text-3xl font-bold text-blue-600 print:text-gray-900">
                                    {formatCurrency(payment.amount)}
                                </span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="pt-6 border-t text-center space-y-4">
                            <p className="text-lg font-semibold text-gray-900">Thank you for your payment!</p>

                            <div className="text-sm text-gray-600">
                                <p>For inquiries:</p>
                                <p>Email: support@utility.gov.lk | Phone: +94 11 234 5678</p>
                            </div>

                            <p className="text-xs text-gray-500 italic">
                                This is a computer-generated receipt. No signature required.
                            </p>

                            {/* QR Code */}
                            {qrCodeUrl && (
                                <div className="flex justify-center pt-4">
                                    <div className="text-center">
                                        <img src={qrCodeUrl} alt="Receipt QR Code" className="mx-auto" />
                                        <p className="text-xs text-gray-500 mt-2">Scan to verify receipt</p>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
                @media print {
                    body {
                        print-color-adjust: exact;
                        -webkit-print-color-adjust: exact;
                    }
                    @page {
                        margin: 1cm;
                        size: A4;
                    }
                    .print\\:hidden {
                        display: none !important;
                    }
                    .print\\:p-0 {
                        padding: 0 !important;
                    }
                    .print\\:bg-white {
                        background-color: white !important;
                    }
                    .print\\:bg-gray-100 {
                        background-color: #f3f4f6 !important;
                    }
                    .print\\:bg-gray-900 {
                        background-color: #111827 !important;
                    }
                    .print\\:text-gray-900 {
                        color: #111827 !important;
                    }
                    .print\\:border {
                        border-width: 1px !important;
                    }
                    .print\\:border-gray-300 {
                        border-color: #d1d5db !important;
                    }
                    .print\\:border-b-2 {
                        border-bottom-width: 2px !important;
                    }
                    .print\\:shadow-none {
                        box-shadow: none !important;
                    }
                    .print\\:rounded-none {
                        border-radius: 0 !important;
                    }
                    .print\\:text-2xl {
                        font-size: 1.5rem !important;
                    }
                }
            `}</style>
        </div>
    );
}

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import {
    X,
    Download,
    Printer,
    Mail,
    Loader2,
    AlertCircle,
    RefreshCw,
    ChevronRight,
    Building2,
} from 'lucide-react';
import { formatCurrency } from '@/types/payroll';
import { Modal } from '@/components/employees/ProfileComponents';

// Types
export interface PayslipComponentDto {
    componentId?: number;
    name: string;
    type: 'EARNING' | 'DEDUCTION';
    amount: number;
}

export interface PayslipDetailDto {
    payslipId: number;
    payrollRunId: number;
    employeeId: number;
    employeeNo: string;
    employeeName: string;
    designation?: string;
    departmentName?: string;
    month: string;
    periodStart: string;
    periodEnd: string;
    payDate?: string;
    paymentMode?: string;
    grossSalary: number;
    totalDeductions: number;
    netSalary: number;
    status: string;
    components: PayslipComponentDto[];
    bankAccountLast4?: string;
    companyName?: string;
}

interface PayslipViewProps {
    payslipId: number;
    variant: 'modal' | 'page';
    showActions?: boolean;
    isOpen?: boolean;
    onClose?: () => void;
}

// Get auth token
function getAuthToken(): string | null {
    if (typeof window === 'undefined') return null;
    return localStorage.getItem('token') || sessionStorage.getItem('token');
}

export function PayslipView({
    payslipId,
    variant,
    showActions = true,
    isOpen = true,
    onClose,
}: PayslipViewProps) {
    const router = useRouter();
    const printRef = useRef<HTMLDivElement>(null);
    const [payslip, setPayslip] = useState<PayslipDetailDto | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isDownloading, setIsDownloading] = useState(false);

    // Fetch payslip data
    const fetchPayslip = useCallback(async () => {
        setIsLoading(true);
        setError(null);

        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/payroll/payslips/${payslipId}`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                if (response.status === 404) {
                    throw new Error('Payslip not found');
                }
                if (response.status === 403) {
                    throw new Error('You do not have permission to view this payslip');
                }
                throw new Error('Failed to fetch payslip');
            }

            const result = await response.json();
            setPayslip(result.data || result);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'An error occurred');
        } finally {
            setIsLoading(false);
        }
    }, [payslipId]);

    useEffect(() => {
        if (isOpen) {
            fetchPayslip();
        }
    }, [fetchPayslip, isOpen]);

    // Handle print
    const handlePrint = useCallback(() => {
        window.print();
    }, []);

    // Handle download PDF
    const handleDownload = useCallback(async () => {
        setIsDownloading(true);
        try {
            const token = getAuthToken();
            const response = await fetch(`/api/v1/payroll/payslips/${payslipId}/download`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            if (!response.ok) {
                throw new Error('Failed to download payslip');
            }

            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `payslip-${payslip?.employeeNo}-${payslip?.month}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
        } catch (err) {
            alert('Failed to download payslip. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    }, [payslipId, payslip]);

    // Handle email (placeholder)
    const handleEmail = useCallback(() => {
        alert('Email feature coming soon!');
    }, []);

    // Separate earnings and deductions
    const earnings = payslip?.components.filter((c) => c.type === 'EARNING') || [];
    const deductions = payslip?.components.filter((c) => c.type === 'DEDUCTION') || [];

    // Format month display
    const formatMonthDisplay = (month: string) => {
        try {
            const [year, monthNum] = month.split('-');
            const date = new Date(parseInt(year), parseInt(monthNum) - 1);
            return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        } catch {
            return month;
        }
    };

    // The payslip content
    const PayslipContent = () => (
        <div
            ref={printRef}
            className="bg-white print:shadow-none print:border-none"
            id="payslip-content"
        >
            {/* Company Header */}
            <div className="text-center border-b-2 border-gray-800 pb-4 mb-6">
                <div className="flex justify-center mb-2">
                    <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                        <Building2 className="w-7 h-7 text-white" />
                    </div>
                </div>
                <h1 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                    {payslip?.companyName || 'Government Utility Management'}
                </h1>
                <p className="text-gray-600 mt-1">
                    Payslip for {formatMonthDisplay(payslip?.month || '')}
                </p>
            </div>

            {/* Employee Information */}
            <div className="grid grid-cols-2 gap-x-8 gap-y-2 mb-6 text-sm">
                <div>
                    <span className="text-gray-500">Name:</span>
                    <span className="ml-2 font-medium text-gray-900">{payslip?.employeeName}</span>
                </div>
                <div>
                    <span className="text-gray-500">Employee No:</span>
                    <span className="ml-2 font-medium text-gray-900">{payslip?.employeeNo}</span>
                </div>
                <div>
                    <span className="text-gray-500">Designation:</span>
                    <span className="ml-2 font-medium text-gray-900">{payslip?.designation || '-'}</span>
                </div>
                <div>
                    <span className="text-gray-500">Department:</span>
                    <span className="ml-2 font-medium text-gray-900">{payslip?.departmentName || '-'}</span>
                </div>
            </div>

            {/* Period Information */}
            <div className="bg-gray-50 rounded-lg p-4 mb-6 text-sm">
                <div className="grid grid-cols-3 gap-4">
                    <div>
                        <span className="text-gray-500">Period:</span>
                        <p className="font-medium text-gray-900">
                            {payslip?.periodStart && payslip?.periodEnd
                                ? `${new Date(payslip.periodStart).toLocaleDateString()} - ${new Date(payslip.periodEnd).toLocaleDateString()}`
                                : '-'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Pay Date:</span>
                        <p className="font-medium text-gray-900">
                            {payslip?.payDate ? new Date(payslip.payDate).toLocaleDateString() : 'Pending'}
                        </p>
                    </div>
                    <div>
                        <span className="text-gray-500">Payment Mode:</span>
                        <p className="font-medium text-gray-900">{payslip?.paymentMode || 'Bank Transfer'}</p>
                    </div>
                </div>
            </div>

            {/* Earnings Section */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">
                    Earnings
                </h3>
                <div className="space-y-2">
                    {earnings.length > 0 ? (
                        earnings.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.name}</span>
                                <span className="font-medium text-gray-900">{formatCurrency(item.amount)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Basic Salary</span>
                            <span className="font-medium text-gray-900">{formatCurrency(payslip?.grossSalary || 0)}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-between text-sm font-semibold mt-3 pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total Earnings</span>
                    <span className="text-green-600">{formatCurrency(payslip?.grossSalary || 0)}</span>
                </div>
            </div>

            {/* Deductions Section */}
            <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-3 border-b border-gray-200 pb-2">
                    Deductions
                </h3>
                <div className="space-y-2">
                    {deductions.length > 0 ? (
                        deductions.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm">
                                <span className="text-gray-700">{item.name}</span>
                                <span className="font-medium text-red-600">-{formatCurrency(item.amount)}</span>
                            </div>
                        ))
                    ) : (
                        <div className="flex justify-between text-sm">
                            <span className="text-gray-700">Deductions</span>
                            <span className="font-medium text-red-600">-{formatCurrency(payslip?.totalDeductions || 0)}</span>
                        </div>
                    )}
                </div>
                <div className="flex justify-between text-sm font-semibold mt-3 pt-2 border-t border-gray-200">
                    <span className="text-gray-900">Total Deductions</span>
                    <span className="text-red-600">-{formatCurrency(payslip?.totalDeductions || 0)}</span>
                </div>
            </div>

            {/* Net Pay */}
            <div className="bg-blue-600 rounded-xl p-6 text-white text-center">
                <p className="text-blue-100 text-sm uppercase tracking-wide mb-1">Net Pay</p>
                <p className="text-3xl font-bold">{formatCurrency(payslip?.netSalary || 0)}</p>
            </div>

            {/* Bank Details */}
            {payslip?.bankAccountLast4 && (
                <div className="mt-6 pt-4 border-t border-gray-200 text-sm text-center text-gray-500">
                    <p>Credited to Account: ****{payslip.bankAccountLast4}</p>
                </div>
            )}

            {/* Footer */}
            <div className="mt-6 pt-4 border-t border-gray-200 text-xs text-center text-gray-400 print:mt-8">
                <p>This is a computer-generated payslip. No signature is required.</p>
                <p className="mt-1">Generated on {new Date().toLocaleDateString()}</p>
            </div>
        </div>
    );

    // Loading state
    const LoadingState = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-blue-600 animate-spin mb-4" />
            <p className="text-gray-500">Loading payslip...</p>
        </div>
    );

    // Error state
    const ErrorState = () => (
        <div className="flex flex-col items-center justify-center py-12">
            <AlertCircle className="w-12 h-12 text-red-500 mb-4" />
            <p className="text-gray-900 font-medium mb-2">Error</p>
            <p className="text-gray-500 mb-4">{error}</p>
            <button
                onClick={fetchPayslip}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
                <RefreshCw className="w-4 h-4" />
                Retry
            </button>
        </div>
    );

    // Action buttons
    const ActionButtons = () => (
        <div className="flex items-center justify-center gap-3 mt-6 print:hidden">
            <button
                onClick={handleDownload}
                disabled={isDownloading}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
                {isDownloading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                    <Download className="w-4 h-4" />
                )}
                Download PDF
            </button>
            <button
                onClick={handlePrint}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200"
            >
                <Printer className="w-4 h-4" />
                Print
            </button>
            <button
                onClick={handleEmail}
                className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200"
            >
                <Mail className="w-4 h-4" />
                Email
            </button>
        </div>
    );

    // Modal variant
    if (variant === 'modal') {
        return (
            <Modal
                isOpen={isOpen}
                onClose={onClose || (() => { })}
                title="Payslip Details"
                size="md"
            >
                <div className="p-6">
                    {isLoading && <LoadingState />}
                    {error && <ErrorState />}
                    {!isLoading && !error && payslip && (
                        <>
                            <PayslipContent />
                            {showActions && <ActionButtons />}
                        </>
                    )}
                </div>
            </Modal>
        );
    }

    // Page variant
    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <div className="bg-white border-b border-gray-200 print:hidden">
                <div className="max-w-3xl mx-auto px-4 py-6">
                    {/* Breadcrumb */}
                    <nav className="flex items-center gap-2 text-sm text-gray-500 mb-4">
                        <button
                            onClick={() => router.push('/dashboard/payroll')}
                            className="hover:text-blue-600"
                        >
                            Payroll
                        </button>
                        <ChevronRight className="w-4 h-4" />
                        <button
                            onClick={() => router.back()}
                            className="hover:text-blue-600"
                        >
                            Payslips
                        </button>
                        <ChevronRight className="w-4 h-4" />
                        <span className="text-gray-700">View Payslip</span>
                    </nav>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <h1 className="text-2xl font-bold text-gray-900">
                            Payslip {payslip?.employeeNo && `- ${payslip.employeeNo}`}
                        </h1>
                        {showActions && !isLoading && !error && payslip && (
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={handleDownload}
                                    disabled={isDownloading}
                                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50"
                                >
                                    {isDownloading ? (
                                        <Loader2 className="w-4 h-4 animate-spin" />
                                    ) : (
                                        <Download className="w-4 h-4" />
                                    )}
                                    Download
                                </button>
                                <button
                                    onClick={handlePrint}
                                    className="flex items-center gap-2 px-4 py-2 text-gray-700 bg-gray-100 font-medium rounded-lg hover:bg-gray-200"
                                >
                                    <Printer className="w-4 h-4" />
                                    Print
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-3xl mx-auto px-4 py-8 print:py-0 print:px-0 print:max-w-none">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8 print:shadow-none print:border-none print:rounded-none">
                    {isLoading && <LoadingState />}
                    {error && <ErrorState />}
                    {!isLoading && !error && payslip && <PayslipContent />}
                </div>
            </div>

            {/* Print Styles */}
            <style jsx global>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #payslip-content,
          #payslip-content * {
            visibility: visible;
          }
          #payslip-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 40px;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
        </div>
    );
}

// Standalone payslip page component
export function PayslipPage({ payslipId }: { payslipId: number }) {
    return <PayslipView payslipId={payslipId} variant="page" showActions={true} />;
}

// Payslip modal wrapper for convenience
export function PayslipModal({
    payslipId,
    isOpen,
    onClose,
}: {
    payslipId: number;
    isOpen: boolean;
    onClose: () => void;
}) {
    return (
        <PayslipView
            payslipId={payslipId}
            variant="modal"
            showActions={true}
            isOpen={isOpen}
            onClose={onClose}
        />
    );
}

"use client";

import { useState, useEffect, useCallback, Fragment } from "react";
import { Dialog, Transition, RadioGroup } from "@headlessui/react";
import {
    XMarkIcon,
    MagnifyingGlassIcon,
    CheckCircleIcon,
    ExclamationTriangleIcon,
    InformationCircleIcon,
    ArrowPathIcon,
    DocumentArrowDownIcon,
} from "@heroicons/react/24/outline";
import {
    BanknotesIcon,
    CreditCardIcon,
    BuildingLibraryIcon,
    GlobeAltIcon,
    DevicePhoneMobileIcon,
    DocumentTextIcon,
} from "@heroicons/react/24/solid";
import { PaymentMethod, PaymentChannel } from "@/types/payment";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

// Bill search result interface
interface BillSearchResult {
    billId: number;
    billNumber: string;
    customerName: string;
    customerId: number;
    billDate: string;
    billingPeriod: string;
    totalAmount: number;
    paidAmount: number;
    outstanding: number;
    meterSerialNo: string;
    utilityType: string;
}

// Payment method configuration with icons
const PAYMENT_METHODS = [
    { value: PaymentMethod.CASH, label: "Cash", icon: BanknotesIcon, requiresRef: false },
    { value: PaymentMethod.CARD, label: "Card", icon: CreditCardIcon, requiresRef: false },
    { value: PaymentMethod.BANK_TRANSFER, label: "Bank Transfer", icon: BuildingLibraryIcon, requiresRef: true },
    { value: PaymentMethod.ONLINE, label: "Online", icon: GlobeAltIcon, requiresRef: true },
    { value: PaymentMethod.MOBILE_MONEY, label: "Mobile Money", icon: DevicePhoneMobileIcon, requiresRef: true },
    { value: PaymentMethod.CHEQUE, label: "Cheque", icon: DocumentTextIcon, requiresRef: false },
];

const PAYMENT_CHANNELS = [
    { value: PaymentChannel.OFFICE, label: "Office Counter" },
    { value: PaymentChannel.WEBSITE, label: "Website" },
    { value: PaymentChannel.MOBILE_APP, label: "Mobile App" },
    { value: PaymentChannel.BANK, label: "Bank" },
    { value: PaymentChannel.ATM, label: "ATM" },
];

interface RecordPaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: (paymentId: number, receiptNumber: string) => void;
    preSelectedBillId?: number;
}

export default function RecordPaymentModal({
    isOpen,
    onClose,
    onSuccess,
    preSelectedBillId,
}: RecordPaymentModalProps) {
    // Bill selection state
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<BillSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedBill, setSelectedBill] = useState<BillSearchResult | null>(null);
    const [showSearchDropdown, setShowSearchDropdown] = useState(false);

    // Payment form state
    const [paymentAmount, setPaymentAmount] = useState<string>("");
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(PaymentMethod.CASH);
    const [paymentChannel, setPaymentChannel] = useState<PaymentChannel>(PaymentChannel.OFFICE);
    const [transactionRef, setTransactionRef] = useState("");
    const [paymentDate, setPaymentDate] = useState(
        new Date().toISOString().slice(0, 16) // Format: YYYY-MM-DDTHH:mm
    );
    const [notes, setNotes] = useState("");

    // Validation state
    const [errors, setErrors] = useState<Record<string, string>>({});
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isCheckingRef, setIsCheckingRef] = useState(false);
    const [refExists, setRefExists] = useState(false);

    // Success state
    const [showSuccess, setShowSuccess] = useState(false);
    const [createdPayment, setCreatedPayment] = useState<{
        paymentId: number;
        receiptNumber: string;
    } | null>(null);

    const OVERPAYMENT_TOLERANCE = 0.10; // 10%

    // Format currency
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: "LKR",
        }).format(amount);
    };

    // Parse amount from string
    const parseAmount = (value: string): number => {
        const cleaned = value.replace(/[^0-9.]/g, "");
        return parseFloat(cleaned) || 0;
    };

    // Calculate new outstanding
    const calculateNewOutstanding = (): number => {
        if (!selectedBill) return 0;
        return selectedBill.outstanding - parseAmount(paymentAmount);
    };

    // Check if method requires transaction ref
    const methodRequiresRef = (): boolean => {
        const method = PAYMENT_METHODS.find((m) => m.value === paymentMethod);
        return method?.requiresRef || false;
    };

    // Search bills
    const searchBills = useCallback(async (query: string) => {
        if (query.length < 2) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/bills?search=${encodeURIComponent(query)}&status=UNPAID&limit=10`
            );
            if (response.ok) {
                const data = await response.json();
                // Transform response to BillSearchResult format
                const results: BillSearchResult[] = (data.bills || data.data || []).map(
                    (bill: any) => ({
                        billId: bill.billId,
                        billNumber: `BILL-${bill.billId}`,
                        customerName: bill.customer?.firstName
                            ? `${bill.customer.firstName} ${bill.customer.lastName || ""}`
                            : bill.customerName || "Unknown",
                        customerId: bill.customer?.customerId || bill.customerId,
                        billDate: bill.billDate,
                        billingPeriod: `${new Date(bill.billingPeriodStart).toLocaleDateString()} - ${new Date(bill.billingPeriodEnd).toLocaleDateString()}`,
                        totalAmount: bill.totalAmount,
                        paidAmount: bill.paidAmount || 0,
                        outstanding: bill.outstandingAmount || bill.totalAmount - (bill.paidAmount || 0),
                        meterSerialNo: bill.meter?.meterSerialNo || "",
                        utilityType: bill.meter?.utilityType || "",
                    })
                );
                setSearchResults(results);
            }
        } catch (err) {
            console.error("Error searching bills:", err);
        } finally {
            setIsSearching(false);
        }
    }, []);

    // Debounced search
    useEffect(() => {
        const timeoutId = setTimeout(() => {
            if (searchQuery.length >= 2) {
                searchBills(searchQuery);
                setShowSearchDropdown(true);
            } else {
                setSearchResults([]);
                setShowSearchDropdown(false);
            }
        }, 300);

        return () => clearTimeout(timeoutId);
    }, [searchQuery, searchBills]);

    // Load pre-selected bill
    useEffect(() => {
        if (preSelectedBillId && isOpen) {
            loadBillById(preSelectedBillId);
        }
    }, [preSelectedBillId, isOpen]);

    const loadBillById = async (billId: number) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/bills/${billId}`);
            if (response.ok) {
                const bill = await response.json();
                const billResult: BillSearchResult = {
                    billId: bill.billId,
                    billNumber: `BILL-${bill.billId}`,
                    customerName: bill.customer?.firstName
                        ? `${bill.customer.firstName} ${bill.customer.lastName || ""}`
                        : bill.customerName || "Unknown",
                    customerId: bill.customer?.customerId || bill.customerId,
                    billDate: bill.billDate,
                    billingPeriod: `${new Date(bill.billingPeriodStart).toLocaleDateString()} - ${new Date(bill.billingPeriodEnd).toLocaleDateString()}`,
                    totalAmount: bill.totalAmount,
                    paidAmount: bill.paidAmount || 0,
                    outstanding: bill.outstandingAmount || bill.totalAmount - (bill.paidAmount || 0),
                    meterSerialNo: bill.meter?.meterSerialNo || "",
                    utilityType: bill.meter?.utilityType || "",
                };
                handleSelectBill(billResult);
            }
        } catch (err) {
            console.error("Error loading bill:", err);
        }
    };

    // Handle bill selection
    const handleSelectBill = (bill: BillSearchResult) => {
        setSelectedBill(bill);
        setPaymentAmount(bill.outstanding.toFixed(2));
        setSearchQuery("");
        setSearchResults([]);
        setShowSearchDropdown(false);
        setErrors({});
    };

    // Check transaction reference uniqueness
    const checkTransactionRef = useCallback(async (ref: string) => {
        if (!ref || ref.trim().length === 0) {
            setRefExists(false);
            return;
        }

        setIsCheckingRef(true);
        try {
            const response = await fetch(
                `${API_BASE_URL}/api/v1/payments/search/transaction/${encodeURIComponent(ref)}`
            );
            if (response.ok) {
                const payment = await response.json();
                setRefExists(!!payment);
            } else {
                setRefExists(false);
            }
        } catch (err) {
            console.error("Error checking transaction ref:", err);
            setRefExists(false);
        } finally {
            setIsCheckingRef(false);
        }
    }, []);

    // Debounced ref check
    useEffect(() => {
        if (transactionRef && methodRequiresRef()) {
            const timeoutId = setTimeout(() => {
                checkTransactionRef(transactionRef);
            }, 500);
            return () => clearTimeout(timeoutId);
        }
    }, [transactionRef, checkTransactionRef]);

    // Validate form
    const validateForm = (): boolean => {
        const newErrors: Record<string, string> = {};

        if (!selectedBill) {
            newErrors.bill = "Please select a bill";
        }

        const amount = parseAmount(paymentAmount);
        if (amount <= 0) {
            newErrors.amount = "Payment amount must be greater than 0";
        }

        if (selectedBill && amount > selectedBill.outstanding * (1 + OVERPAYMENT_TOLERANCE) && selectedBill.outstanding > 0) {
            newErrors.amount = `Payment exceeds maximum allowed (${formatCurrency(selectedBill.outstanding * (1 + OVERPAYMENT_TOLERANCE))})`;
        }

        if (methodRequiresRef() && (!transactionRef || transactionRef.trim().length === 0)) {
            newErrors.transactionRef = "Transaction reference is required for this payment method";
        }

        if (refExists) {
            newErrors.transactionRef = "This transaction reference already exists";
        }

        const paymentDateObj = new Date(paymentDate);
        if (paymentDateObj > new Date()) {
            newErrors.paymentDate = "Payment date cannot be in the future";
        }

        if (notes.length > 500) {
            newErrors.notes = "Notes cannot exceed 500 characters";
        }

        setErrors(newErrors);
        return Object.keys(newErrors).length === 0;
    };

    // Submit payment
    const handleSubmit = async (printReceipt: boolean = false) => {
        if (!validateForm() || !selectedBill) return;

        setIsSubmitting(true);
        try {
            const payload = {
                billId: selectedBill.billId,
                paymentAmount: parseAmount(paymentAmount),
                paymentMethod,
                paymentChannel,
                transactionRef: transactionRef || null,
                paymentDate: new Date(paymentDate).toISOString(),
            };

            const response = await fetch(`${API_BASE_URL}/api/v1/payments`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || "Failed to record payment");
            }

            const result = await response.json();
            setCreatedPayment({
                paymentId: result.paymentId,
                receiptNumber: result.receiptNumber,
            });
            setShowSuccess(true);

            if (printReceipt) {
                // Download receipt
                handleDownloadReceipt(result.paymentId, result.receiptNumber);
            }

            onSuccess?.(result.paymentId, result.receiptNumber);

            // Auto-close after 3 seconds
            setTimeout(() => {
                if (!printReceipt) {
                    handleClose();
                }
            }, 3000);
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to record payment";
            setErrors({ submit: message });
        } finally {
            setIsSubmitting(false);
        }
    };

    // Download receipt
    const handleDownloadReceipt = async (paymentId: number, receiptNumber: string) => {
        try {
            const response = await fetch(`${API_BASE_URL}/api/v1/payments/${paymentId}/receipt`);
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

    // Reset form
    const resetForm = () => {
        setSearchQuery("");
        setSearchResults([]);
        setSelectedBill(null);
        setPaymentAmount("");
        setPaymentMethod(PaymentMethod.CASH);
        setPaymentChannel(PaymentChannel.OFFICE);
        setTransactionRef("");
        setPaymentDate(new Date().toISOString().slice(0, 16));
        setNotes("");
        setErrors({});
        setShowSuccess(false);
        setCreatedPayment(null);
    };

    // Handle close
    const handleClose = () => {
        resetForm();
        onClose();
    };

    // Handle record another
    const handleRecordAnother = () => {
        resetForm();
    };

    // Get warning/info messages
    const getAmountMessage = () => {
        if (!selectedBill) return null;
        const amount = parseAmount(paymentAmount);
        const outstanding = selectedBill.outstanding;

        if (amount > outstanding && outstanding > 0) {
            const overpayment = amount - outstanding;
            return {
                type: "warning",
                message: `Overpayment of ${formatCurrency(overpayment)} will be recorded`,
            };
        }

        if (amount < outstanding && amount > 0) {
            const remaining = outstanding - amount;
            return {
                type: "info",
                message: `Partial payment - ${formatCurrency(remaining)} will remain outstanding`,
            };
        }

        if (outstanding <= 0) {
            return {
                type: "warning",
                message: "This bill is already fully paid",
            };
        }

        return null;
    };

    const amountMessage = getAmountMessage();
    const newOutstanding = calculateNewOutstanding();

    return (
        <Transition appear show={isOpen} as={Fragment}>
            <Dialog as="div" className="relative z-50" onClose={handleClose}>
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
                                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200">
                                    <Dialog.Title className="text-xl font-semibold text-gray-900">
                                        Record Payment
                                    </Dialog.Title>
                                    <button
                                        onClick={handleClose}
                                        className="text-gray-400 hover:text-gray-600 transition-colors"
                                    >
                                        <XMarkIcon className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Success State */}
                                {showSuccess && createdPayment ? (
                                    <div className="p-8 text-center">
                                        <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                                            <CheckCircleIcon className="w-10 h-10 text-green-600" />
                                        </div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                                            Payment Recorded Successfully!
                                        </h3>
                                        <p className="text-gray-600 mb-4">
                                            Receipt Number:{" "}
                                            <span className="font-mono font-semibold text-blue-600">
                                                {createdPayment.receiptNumber}
                                            </span>
                                        </p>
                                        <div className="flex justify-center gap-3">
                                            <button
                                                onClick={() =>
                                                    handleDownloadReceipt(
                                                        createdPayment.paymentId,
                                                        createdPayment.receiptNumber
                                                    )
                                                }
                                                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                                            >
                                                <DocumentArrowDownIcon className="w-5 h-5" />
                                                Download Receipt
                                            </button>
                                            <button
                                                onClick={handleRecordAnother}
                                                className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
                                            >
                                                <ArrowPathIcon className="w-5 h-5" />
                                                Record Another
                                            </button>
                                            <button
                                                onClick={handleClose}
                                                className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                                            >
                                                Close
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <>
                                        {/* Form Content */}
                                        <div className="p-6 space-y-6">
                                            {/* Error Banner */}
                                            {errors.submit && (
                                                <div className="p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                                    <ExclamationTriangleIcon className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                                                    <p className="text-red-700">{errors.submit}</p>
                                                </div>
                                            )}

                                            {/* Step 1: Bill Selection */}
                                            {!selectedBill ? (
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-medium text-gray-900">
                                                        Step 1: Select Bill
                                                    </h3>
                                                    <div className="relative">
                                                        <div className="relative">
                                                            <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
                                                            <input
                                                                type="text"
                                                                placeholder="Search by bill number, meter serial, or customer name..."
                                                                value={searchQuery}
                                                                onChange={(e) => setSearchQuery(e.target.value)}
                                                                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            />
                                                            {isSearching && (
                                                                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                    <div className="animate-spin h-5 w-5 border-2 border-blue-500 rounded-full border-t-transparent" />
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Search Dropdown */}
                                                        {showSearchDropdown && searchResults.length > 0 && (
                                                            <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                                                {searchResults.map((bill) => (
                                                                    <button
                                                                        key={bill.billId}
                                                                        onClick={() => handleSelectBill(bill)}
                                                                        className="w-full px-4 py-3 text-left hover:bg-gray-50 border-b border-gray-100 last:border-b-0"
                                                                    >
                                                                        <div className="flex justify-between items-start">
                                                                            <div>
                                                                                <p className="font-medium text-gray-900">
                                                                                    {bill.billNumber}
                                                                                </p>
                                                                                <p className="text-sm text-gray-600">
                                                                                    {bill.customerName}
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    {bill.meterSerialNo} • {bill.utilityType}
                                                                                </p>
                                                                            </div>
                                                                            <div className="text-right">
                                                                                <p className="text-sm font-semibold text-orange-600">
                                                                                    {formatCurrency(bill.outstanding)} due
                                                                                </p>
                                                                                <p className="text-xs text-gray-500">
                                                                                    of {formatCurrency(bill.totalAmount)}
                                                                                </p>
                                                                            </div>
                                                                        </div>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        )}

                                                        {showSearchDropdown &&
                                                            searchQuery.length >= 2 &&
                                                            searchResults.length === 0 &&
                                                            !isSearching && (
                                                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg p-4 text-center text-gray-500">
                                                                    No unpaid bills found
                                                                </div>
                                                            )}
                                                    </div>
                                                    {errors.bill && (
                                                        <p className="text-sm text-red-600">{errors.bill}</p>
                                                    )}
                                                </div>
                                            ) : (
                                                <>
                                                    {/* Selected Bill Display */}
                                                    <div className="bg-gray-50 rounded-lg p-4">
                                                        <div className="flex justify-between items-start mb-4">
                                                            <div>
                                                                <h3 className="text-lg font-bold text-gray-900">
                                                                    {selectedBill.billNumber}
                                                                </h3>
                                                                <p className="text-gray-600">
                                                                    {selectedBill.customerName}
                                                                </p>
                                                                <p className="text-sm text-gray-500">
                                                                    {selectedBill.billingPeriod}
                                                                </p>
                                                            </div>
                                                            <button
                                                                onClick={() => setSelectedBill(null)}
                                                                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                                                            >
                                                                Change Bill
                                                            </button>
                                                        </div>
                                                        <div className="grid grid-cols-3 gap-4 text-center">
                                                            <div>
                                                                <p className="text-sm text-gray-500">Bill Amount</p>
                                                                <p className="text-lg font-semibold text-gray-900">
                                                                    {formatCurrency(selectedBill.totalAmount)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">Already Paid</p>
                                                                <p className="text-lg font-semibold text-green-600">
                                                                    {formatCurrency(selectedBill.paidAmount)}
                                                                </p>
                                                            </div>
                                                            <div>
                                                                <p className="text-sm text-gray-500">Outstanding</p>
                                                                <p className="text-lg font-semibold text-orange-600">
                                                                    {formatCurrency(selectedBill.outstanding)}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    {/* Step 2: Payment Details */}
                                                    <div className="space-y-5">
                                                        <h3 className="text-lg font-medium text-gray-900">
                                                            Step 2: Payment Details
                                                        </h3>

                                                        {/* Payment Amount */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Payment Amount *
                                                            </label>
                                                            <div className="relative">
                                                                <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                                                    LKR
                                                                </span>
                                                                <input
                                                                    type="number"
                                                                    step="0.01"
                                                                    min="0"
                                                                    value={paymentAmount}
                                                                    onChange={(e) => setPaymentAmount(e.target.value)}
                                                                    className={`w-full pl-14 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.amount
                                                                        ? "border-red-300"
                                                                        : "border-gray-300"
                                                                        }`}
                                                                />
                                                            </div>
                                                            {errors.amount && (
                                                                <p className="mt-1 text-sm text-red-600">
                                                                    {errors.amount}
                                                                </p>
                                                            )}
                                                            {amountMessage && (
                                                                <div
                                                                    className={`mt-2 p-2 rounded-lg flex items-center gap-2 text-sm ${amountMessage.type === "warning"
                                                                        ? "bg-yellow-50 text-yellow-700"
                                                                        : "bg-blue-50 text-blue-700"
                                                                        }`}
                                                                >
                                                                    {amountMessage.type === "warning" ? (
                                                                        <ExclamationTriangleIcon className="w-4 h-4" />
                                                                    ) : (
                                                                        <InformationCircleIcon className="w-4 h-4" />
                                                                    )}
                                                                    {amountMessage.message}
                                                                </div>
                                                            )}
                                                            {/* Real-time calculation */}
                                                            <div className="mt-2 grid grid-cols-2 gap-4 text-sm">
                                                                <div className="bg-gray-50 rounded p-2">
                                                                    <span className="text-gray-500">Amount Paying:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {formatCurrency(parseAmount(paymentAmount))}
                                                                    </span>
                                                                </div>
                                                                <div className="bg-gray-50 rounded p-2">
                                                                    <span className="text-gray-500">New Outstanding:</span>{" "}
                                                                    <span
                                                                        className={`font-medium ${newOutstanding <= 0
                                                                            ? "text-green-600"
                                                                            : "text-orange-600"
                                                                            }`}
                                                                    >
                                                                        {formatCurrency(Math.max(0, newOutstanding))}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* Payment Method */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                                Payment Method *
                                                            </label>
                                                            <RadioGroup
                                                                value={paymentMethod}
                                                                onChange={setPaymentMethod}
                                                            >
                                                                <div className="grid grid-cols-3 gap-2">
                                                                    {PAYMENT_METHODS.map((method) => (
                                                                        <RadioGroup.Option
                                                                            key={method.value}
                                                                            value={method.value}
                                                                            className={({ checked }: { checked: boolean }) =>
                                                                                `cursor-pointer rounded-lg border p-3 flex items-center gap-2 transition-all ${checked
                                                                                    ? "border-blue-500 bg-blue-50 ring-2 ring-blue-500"
                                                                                    : "border-gray-200 hover:border-gray-300"
                                                                                }`
                                                                            }
                                                                        >
                                                                            {({ checked }: { checked: boolean }) => (
                                                                                <>
                                                                                    <method.icon
                                                                                        className={`w-5 h-5 ${checked
                                                                                            ? "text-blue-600"
                                                                                            : "text-gray-400"
                                                                                            }`}
                                                                                    />
                                                                                    <span
                                                                                        className={`text-sm font-medium ${checked
                                                                                            ? "text-blue-600"
                                                                                            : "text-gray-700"
                                                                                            }`}
                                                                                    >
                                                                                        {method.label}
                                                                                    </span>
                                                                                </>
                                                                            )}
                                                                        </RadioGroup.Option>
                                                                    ))}
                                                                </div>
                                                            </RadioGroup>
                                                        </div>

                                                        {/* Payment Channel */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Payment Channel
                                                            </label>
                                                            <select
                                                                value={paymentChannel}
                                                                onChange={(e) =>
                                                                    setPaymentChannel(e.target.value as PaymentChannel)
                                                                }
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                            >
                                                                {PAYMENT_CHANNELS.map((channel) => (
                                                                    <option key={channel.value} value={channel.value}>
                                                                        {channel.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Transaction Reference */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Transaction Reference{" "}
                                                                {methodRequiresRef() && (
                                                                    <span className="text-red-500">*</span>
                                                                )}
                                                            </label>
                                                            <div className="relative">
                                                                <input
                                                                    type="text"
                                                                    placeholder="Enter transaction/reference number"
                                                                    value={transactionRef}
                                                                    onChange={(e) => setTransactionRef(e.target.value)}
                                                                    className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.transactionRef
                                                                        ? "border-red-300"
                                                                        : "border-gray-300"
                                                                        }`}
                                                                />
                                                                {isCheckingRef && (
                                                                    <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                                                                        <div className="animate-spin h-4 w-4 border-2 border-blue-500 rounded-full border-t-transparent" />
                                                                    </div>
                                                                )}
                                                            </div>
                                                            {errors.transactionRef && (
                                                                <p className="mt-1 text-sm text-red-600">
                                                                    {errors.transactionRef}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Payment Date */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Payment Date & Time
                                                            </label>
                                                            <input
                                                                type="datetime-local"
                                                                value={paymentDate}
                                                                onChange={(e) => setPaymentDate(e.target.value)}
                                                                max={new Date().toISOString().slice(0, 16)}
                                                                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent ${errors.paymentDate
                                                                    ? "border-red-300"
                                                                    : "border-gray-300"
                                                                    }`}
                                                            />
                                                            {errors.paymentDate && (
                                                                <p className="mt-1 text-sm text-red-600">
                                                                    {errors.paymentDate}
                                                                </p>
                                                            )}
                                                        </div>

                                                        {/* Notes */}
                                                        <div>
                                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                                Notes (optional)
                                                            </label>
                                                            <textarea
                                                                rows={2}
                                                                placeholder="Additional notes about this payment..."
                                                                value={notes}
                                                                onChange={(e) => setNotes(e.target.value)}
                                                                maxLength={500}
                                                                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
                                                            />
                                                            <p className="mt-1 text-xs text-gray-500 text-right">
                                                                {notes.length}/500 characters
                                                            </p>
                                                        </div>
                                                    </div>
                                                </>
                                            )}
                                        </div>

                                        {/* Footer Actions */}
                                        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50">
                                            <button
                                                onClick={handleClose}
                                                className="px-4 py-2 text-gray-700 hover:text-gray-900 transition-colors"
                                            >
                                                Cancel
                                            </button>
                                            {selectedBill && (
                                                <>
                                                    <button
                                                        onClick={() => handleSubmit(true)}
                                                        disabled={isSubmitting}
                                                        className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors disabled:opacity-50"
                                                    >
                                                        <DocumentArrowDownIcon className="w-5 h-5" />
                                                        Record & Print Receipt
                                                    </button>
                                                    <button
                                                        onClick={() => handleSubmit(false)}
                                                        disabled={isSubmitting}
                                                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {isSubmitting ? (
                                                            <>
                                                                <div className="animate-spin h-4 w-4 border-2 border-white rounded-full border-t-transparent" />
                                                                Recording...
                                                            </>
                                                        ) : (
                                                            "Record Payment"
                                                        )}
                                                    </button>
                                                </>
                                            )}
                                        </div>
                                    </>
                                )}
                            </Dialog.Panel>
                        </Transition.Child>
                    </div>
                </div>
            </Dialog>
        </Transition>
    );
}

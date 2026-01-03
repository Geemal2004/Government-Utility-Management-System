"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentArrowDownIcon,
  PrinterIcon,
  TrashIcon,
  ArrowPathIcon,
  CreditCardIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  ClockIcon,
} from "@heroicons/react/24/outline";
import { BillStatus } from "@/types/bill";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface BillDetail {
  billId: number;
  billDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: BillStatus;
  customer: {
    customerId: number;
    firstName: string;
    middleName?: string;
    lastName: string;
    customerType: string;
  };
  meter: {
    meterId: number;
    meterSerialNo: string;
    utilityType: string;
  };
  serviceConnection: {
    connectionId: number;
    connectionAddress: string;
    tariffCategoryName: string;
  };
  consumption: {
    previousReading: number;
    previousReadingDate: string;
    currentReading: number;
    currentReadingDate: string;
    consumedUnits: number;
    exportUnits?: number;
    readingSource: string;
  };
  billDetails: Array<{
    slabRange: string;
    fromUnit: number;
    toUnit: number | null;
    units: number;
    ratePerUnit: number;
    amount: number;
  }>;
  fixedCharge: number;
  subsidy?: number;
  solarCredit?: number;
  taxes: Array<{
    taxName: string;
    ratePercent: number;
    taxableAmount: number;
    taxAmount: number;
  }>;
  payments?: Array<{
    paymentId: number;
    paymentDate: string;
    paymentMethod: string;
    paymentReference?: string;
    paymentAmount: number;
    recordedBy: string;
  }>;
}

export default function BillDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const [bill, setBill] = useState<BillDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBillDetail();
  }, [params.id]);

  const fetchBillDetail = async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/v1/bills/${params.id}`);

      if (!response.ok) {
        throw new Error("Failed to fetch bill details");
      }

      const result = await response.json();
      setBill(result.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching bill details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bills/${params.id}/download`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill_${params.id}.pdf`;
      a.click();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF");
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const handleVoidBill = async () => {
    if (
      !confirm(
        "Are you sure you want to void this bill? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bills/${params.id}/void`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to void bill");

      alert("Bill voided successfully");
      fetchBillDetail();
    } catch (err) {
      console.error("Error voiding bill:", err);
      alert("Failed to void bill");
    }
  };

  const handleRecalculate = async () => {
    if (
      !confirm(
        "Recalculate this bill? This will update all charges based on current rates."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bills/${params.id}/recalculate`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to recalculate bill");

      alert("Bill recalculated successfully");
      fetchBillDetail();
    } catch (err) {
      console.error("Error recalculating bill:", err);
      alert("Failed to recalculate bill");
    }
  };

  const getStatusBadge = (status: BillStatus) => {
    const baseClasses = "px-3 py-1 text-sm font-semibold rounded-full";
    switch (status) {
      case BillStatus.PAID:
        return `${baseClasses} bg-green-100 text-green-800`;
      case BillStatus.UNPAID:
        return `${baseClasses} bg-gray-100 text-gray-800`;
      case BillStatus.OVERDUE:
        return `${baseClasses} bg-red-100 text-red-800`;
      case BillStatus.PARTIAL:
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case BillStatus.VOIDED:
        return `${baseClasses} bg-gray-400 text-gray-800 line-through`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const getDaysUntilDue = () => {
    if (!bill) return null;
    const today = new Date();
    const dueDate = new Date(bill.dueDate);
    const diffTime = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bill details...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error || !bill) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-6xl mx-auto">
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <ExclamationTriangleIcon className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              Error Loading Bill
            </h3>
            <p className="text-gray-600 mb-4">{error || "Bill not found"}</p>
            <button
              onClick={() => router.back()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  const daysUntilDue = getDaysUntilDue();
  const energyChargesSubtotal = bill.billDetails.reduce(
    (sum, detail) => sum + detail.amount,
    0
  );
  const subtotalBeforeTax =
    energyChargesSubtotal +
    bill.fixedCharge -
    (bill.subsidy || 0) -
    (bill.solarCredit || 0);
  const totalTaxes = bill.taxes.reduce((sum, tax) => sum + tax.taxAmount, 0);

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            Back to Bills
          </button>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Bill #{bill.billId}
                </h1>
                <div className="mt-2">
                  <span className={getStatusBadge(bill.status)}>
                    {bill.status}
                  </span>
                </div>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={handleDownloadPDF}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Download PDF"
                >
                  <DocumentArrowDownIcon className="w-5 h-5" />
                  Download
                </button>
                <button
                  onClick={handlePrint}
                  className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
                  title="Print Bill"
                >
                  <PrinterIcon className="w-5 h-5" />
                  Print
                </button>
                {bill.status !== BillStatus.VOIDED && (
                  <>
                    <button
                      onClick={handleRecalculate}
                      className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      title="Recalculate"
                    >
                      <ArrowPathIcon className="w-5 h-5" />
                      Recalculate
                    </button>
                    <button
                      onClick={handleVoidBill}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                      title="Void Bill"
                    >
                      <TrashIcon className="w-5 h-5" />
                      Void
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Bill Information Card */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Bill Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Bill Date</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(bill.billDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Billing Period</p>
              <p className="text-lg font-medium text-gray-900">
                {formatDate(bill.billingPeriodStart)} -{" "}
                {formatDate(bill.billingPeriodEnd)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Due Date</p>
              <p
                className={`text-lg font-medium ${
                  bill.status === BillStatus.OVERDUE
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {formatDate(bill.dueDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">
                {daysUntilDue && daysUntilDue >= 0
                  ? "Days Until Due"
                  : "Days Overdue"}
              </p>
              <p
                className={`text-lg font-medium ${
                  daysUntilDue && daysUntilDue < 0
                    ? "text-red-600"
                    : "text-gray-900"
                }`}
              >
                {daysUntilDue !== null && (
                  <>
                    {Math.abs(daysUntilDue)}{" "}
                    {Math.abs(daysUntilDue) === 1 ? "day" : "days"}
                  </>
                )}
              </p>
            </div>
          </div>
        </div>

        {/* Customer & Meter Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Customer & Meter Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Customer Name</p>
                <button
                  onClick={() =>
                    alert(`View customer ${bill.customer.customerId}`)
                  }
                  className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {bill.customer.firstName}{" "}
                  {bill.customer.middleName
                    ? bill.customer.middleName + " "
                    : ""}
                  {bill.customer.lastName}
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer ID</p>
                <p className="text-lg font-medium text-gray-900">
                  #{bill.customer.customerId}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Customer Type</p>
                <p className="text-lg font-medium text-gray-900">
                  {bill.customer.customerType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Connection Address</p>
                <p className="text-lg font-medium text-gray-900">
                  {bill.serviceConnection.connectionAddress}
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-sm text-gray-600">Meter Serial Number</p>
                <button
                  onClick={() => alert(`View meter ${bill.meter.meterId}`)}
                  className="text-lg font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {bill.meter.meterSerialNo}
                </button>
              </div>
              <div>
                <p className="text-sm text-gray-600">Utility Type</p>
                <p className="text-lg font-medium text-gray-900">
                  {bill.meter.utilityType}
                </p>
              </div>
              <div>
                <p className="text-sm text-gray-600">Tariff Category</p>
                <p className="text-lg font-medium text-gray-900">
                  {bill.serviceConnection.tariffCategoryName}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Consumption Details */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Consumption Details
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div>
              <p className="text-sm text-gray-600">Previous Reading</p>
              <p className="text-2xl font-bold text-gray-900">
                {bill.consumption.previousReading.toFixed(3)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(bill.consumption.previousReadingDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Current Reading</p>
              <p className="text-2xl font-bold text-gray-900">
                {bill.consumption.currentReading.toFixed(3)}
              </p>
              <p className="text-xs text-gray-500">
                {formatDate(bill.consumption.currentReadingDate)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Consumption</p>
              <p className="text-3xl font-bold text-blue-600">
                {bill.consumption.consumedUnits.toFixed(3)} units
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600">Reading Source</p>
              <p className="text-lg font-medium text-gray-900">
                {bill.consumption.readingSource}
              </p>
              {bill.consumption.exportUnits &&
                bill.consumption.exportUnits > 0 && (
                  <p className="text-sm text-green-600 mt-2">
                    Solar Export: {bill.consumption.exportUnits.toFixed(3)}{" "}
                    units
                  </p>
                )}
            </div>
          </div>
        </div>

        {/* Billing Calculation */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Billing Breakdown
          </h2>

          {/* Energy Charges */}
          <div className="mb-6">
            <h3 className="text-lg font-medium text-gray-900 mb-3">
              Energy Charges
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Slab Range
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Units
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Rate per Unit
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bill.billDetails.map((detail, index) => (
                    <tr key={index}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {detail.slabRange}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {detail.units.toFixed(3)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900 text-right">
                        {formatCurrency(detail.ratePerUnit)}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(detail.amount)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot className="bg-gray-50">
                  <tr>
                    <td
                      colSpan={3}
                      className="px-4 py-3 text-sm font-medium text-gray-900 text-right"
                    >
                      Subtotal Energy Charges:
                    </td>
                    <td className="px-4 py-3 text-sm font-bold text-gray-900 text-right">
                      {formatCurrency(energyChargesSubtotal)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>

          {/* Fixed Charges */}
          <div className="mb-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-gray-700">Monthly Fixed Charge</span>
              <span className="font-medium text-gray-900">
                {formatCurrency(bill.fixedCharge)}
              </span>
            </div>
          </div>

          {/* Subtotal */}
          <div className="mb-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-gray-900">
                Subtotal
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(energyChargesSubtotal + bill.fixedCharge)}
              </span>
            </div>
          </div>

          {/* Deductions */}
          {((bill.subsidy && bill.subsidy > 0) ||
            (bill.solarCredit && bill.solarCredit > 0)) && (
            <div className="mb-6 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">
                Deductions
              </h3>
              {bill.subsidy && bill.subsidy > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Subsidy</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(bill.subsidy)}
                  </span>
                </div>
              )}
              {bill.solarCredit && bill.solarCredit > 0 && (
                <div className="flex justify-between items-center mb-2">
                  <span className="text-gray-700">Solar Export Credit</span>
                  <span className="font-medium text-green-600">
                    -{formatCurrency(bill.solarCredit)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Amount Before Tax */}
          <div className="mb-6 border-t pt-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-lg font-medium text-gray-900">
                Amount Before Tax
              </span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(subtotalBeforeTax)}
              </span>
            </div>
          </div>

          {/* Taxes */}
          {bill.taxes.length > 0 && (
            <div className="mb-6 border-t pt-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Taxes</h3>
              <div className="overflow-x-auto">
                <table className="w-full mb-3">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Tax Name
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Rate
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Taxable Amount
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Tax Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {bill.taxes.map((tax, index) => (
                      <tr key={index}>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {tax.taxName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {tax.ratePercent}%
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {formatCurrency(tax.taxableAmount)}
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(tax.taxAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-700 font-medium">Total Taxes:</span>
                <span className="font-bold text-gray-900">
                  {formatCurrency(totalTaxes)}
                </span>
              </div>
            </div>
          )}

          {/* Total Amount */}
          <div className="border-t-2 border-gray-300 pt-4">
            <div className="flex justify-between items-center">
              <span className="text-2xl font-bold text-gray-900">
                Total Amount
              </span>
              <span className="text-3xl font-bold text-blue-600">
                {formatCurrency(bill.totalAmount)}
              </span>
            </div>
          </div>
        </div>

        {/* Payment Information */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Payment Information
          </h2>

          {bill.status === BillStatus.PAID ? (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <CheckCircleIcon className="w-6 h-6 text-green-600" />
                <span className="text-lg font-semibold text-green-900">
                  Payment Status: PAID
                </span>
              </div>
              {bill.payments && bill.payments.length > 0 && (
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Payment Date</p>
                      <p className="font-medium text-gray-900">
                        {formatDate(bill.payments[0].paymentDate)}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Payment Method</p>
                      <p className="font-medium text-gray-900">
                        {bill.payments[0].paymentMethod}
                      </p>
                    </div>
                    {bill.payments[0].paymentReference && (
                      <div>
                        <p className="text-sm text-gray-600">
                          Payment Reference
                        </p>
                        <p className="font-medium text-gray-900">
                          {bill.payments[0].paymentReference}
                        </p>
                      </div>
                    )}
                    <div>
                      <p className="text-sm text-gray-600">Amount Paid</p>
                      <p className="font-medium text-green-600">
                        {formatCurrency(bill.paidAmount)}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : bill.status === BillStatus.PARTIAL ? (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ClockIcon className="w-6 h-6 text-yellow-600" />
                <span className="text-lg font-semibold text-yellow-900">
                  Payment Status: PARTIALLY PAID
                </span>
              </div>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <p className="text-sm text-gray-600">Total Paid</p>
                  <p className="text-lg font-bold text-green-600">
                    {formatCurrency(bill.paidAmount)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Outstanding Balance</p>
                  <p className="text-lg font-bold text-red-600">
                    {formatCurrency(bill.outstandingAmount)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => alert("Record payment feature coming soon")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CreditCardIcon className="w-5 h-5" />
                Record Payment
              </button>
            </div>
          ) : (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
                <span className="text-lg font-semibold text-red-900">
                  Payment Status:{" "}
                  {bill.status === BillStatus.OVERDUE ? "OVERDUE" : "UNPAID"}
                </span>
              </div>
              <div className="mb-4">
                <p className="text-sm text-gray-600">Amount Outstanding</p>
                <p className="text-2xl font-bold text-red-600">
                  {formatCurrency(bill.outstandingAmount)}
                </p>
              </div>
              <button
                onClick={() => alert("Record payment feature coming soon")}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                <CreditCardIcon className="w-5 h-5" />
                Record Payment
              </button>
            </div>
          )}
        </div>

        {/* Payment History */}
        {bill.payments && bill.payments.length > 0 && (
          <div className="bg-white rounded-lg shadow p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Payment History
            </h2>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Method
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Reference
                    </th>
                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                      Recorded By
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {bill.payments.map((payment) => (
                    <tr key={payment.paymentId}>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {formatDate(payment.paymentDate)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.paymentMethod}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.paymentReference || "-"}
                      </td>
                      <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                        {formatCurrency(payment.paymentAmount)}
                      </td>
                      <td className="px-4 py-3 text-sm text-gray-900">
                        {payment.recordedBy}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Actions Section */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Actions</h2>
          <div className="flex flex-wrap gap-3">
            {bill.status !== BillStatus.PAID &&
              bill.status !== BillStatus.VOIDED && (
                <button
                  onClick={() => alert("Record payment feature coming soon")}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  <CreditCardIcon className="w-5 h-5" />
                  Record Payment
                </button>
              )}
            <button
              onClick={() =>
                alert(`View connection ${bill.serviceConnection.connectionId}`)
              }
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              View Connection
            </button>
            <button
              onClick={() =>
                alert(`View meter history for ${bill.meter.meterId}`)
              }
              className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
            >
              View Meter History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

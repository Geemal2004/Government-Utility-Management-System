"use client";

import { useState, useEffect } from "react";
import {
  Bill,
  BillFilters,
  BillStatus,
  BillSummary,
  PaginatedResponse,
} from "@/types/bill";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  ArrowDownTrayIcon,
  PlusIcon,
  EyeIcon,
  TrashIcon,
  DocumentArrowDownIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";
import {
  CurrencyDollarIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/solid";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export default function BillsPage() {
  const [bills, setBills] = useState<Bill[]>([]);
  const [summary, setSummary] = useState<BillSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedBills, setSelectedBills] = useState<number[]>([]);

  // Filters
  const [filters, setFilters] = useState<BillFilters>({
    page: 1,
    limit: 25,
    sortBy: "billDate",
    order: "DESC",
    status: "All",
  });

  // Pagination
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  // Fetch bills
  useEffect(() => {
    fetchBills();
    fetchSummary();
  }, [filters]);

  const fetchBills = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      if (filters.search) queryParams.append("search", filters.search);
      if (filters.utilityType)
        queryParams.append("utilityType", filters.utilityType);
      if (filters.status && filters.status !== "All")
        queryParams.append("status", filters.status);
      if (filters.customerId)
        queryParams.append("customerId", filters.customerId.toString());
      if (filters.startDate) queryParams.append("startDate", filters.startDate);
      if (filters.endDate) queryParams.append("endDate", filters.endDate);
      queryParams.append("page", filters.page?.toString() || "1");
      queryParams.append("limit", filters.limit?.toString() || "25");
      if (filters.sortBy) queryParams.append("sortBy", filters.sortBy);
      if (filters.order) queryParams.append("order", filters.order);

      const response = await fetch(
        `${API_BASE_URL}/bills?${queryParams.toString()}`
      );

      if (!response.ok) {
        throw new Error("Failed to fetch bills");
      }

      const result: { bills: Bill[]; total: number } = await response.json();
      setBills(result.bills || []);
      setTotal(result.total || 0);
      setTotalPages(Math.ceil((result.total || 0) / filters.limit));
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      console.error("Error fetching bills:", err);
      setBills([]);
      setTotal(0);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/bills/summary`);
      if (!response.ok) throw new Error("Failed to fetch summary");
      const result = await response.json();
      setSummary(result);
    } catch (err) {
      console.error("Error fetching summary:", err);
    }
  };

  const handleFilterChange = (key: keyof BillFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 1 }));
  };

  const clearFilters = () => {
    setFilters({
      page: 1,
      limit: 25,
      sortBy: "billDate",
      order: "DESC",
      status: "All",
    });
  };

  const handleSort = (column: string) => {
    setFilters((prev) => ({
      ...prev,
      sortBy: column,
      order: prev.sortBy === column && prev.order === "ASC" ? "DESC" : "ASC",
    }));
  };

  const handleSelectBill = (billId: number) => {
    setSelectedBills((prev) =>
      prev.includes(billId)
        ? prev.filter((id) => id !== billId)
        : [...prev, billId]
    );
  };

  const handleSelectAll = () => {
    if (selectedBills.length === bills.length) {
      setSelectedBills([]);
    } else {
      setSelectedBills(bills.map((bill) => bill.billId));
    }
  };

  const handleExportCSV = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/v1/bills/export`);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bills_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
    } catch (err) {
      console.error("Error exporting CSV:", err);
      alert("Failed to export CSV");
    }
  };

  const handleVoidBill = async (billId: number) => {
    if (
      !confirm(
        "Are you sure you want to void this bill? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bills/${billId}/void`,
        {
          method: "POST",
        }
      );

      if (!response.ok) throw new Error("Failed to void bill");

      alert("Bill voided successfully");
      fetchBills();
      fetchSummary();
    } catch (err) {
      console.error("Error voiding bill:", err);
      alert("Failed to void bill");
    }
  };

  const handleDownloadPDF = async (billId: number) => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/api/v1/bills/${billId}/download`
      );
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `bill_${billId}.pdf`;
      a.click();
    } catch (err) {
      console.error("Error downloading PDF:", err);
      alert("Failed to download PDF");
    }
  };

  const getStatusBadge = (status: BillStatus) => {
    const baseClasses = "px-2 py-1 text-xs font-semibold rounded-full";
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

  const getUtilityBadge = (utilityType: string) => {
    const baseClasses = "px-2 py-1 text-xs font-medium rounded";
    if (utilityType.toLowerCase().includes("electric")) {
      return `${baseClasses} bg-blue-100 text-blue-800`;
    } else if (utilityType.toLowerCase().includes("water")) {
      return `${baseClasses} bg-cyan-100 text-cyan-800`;
    } else if (utilityType.toLowerCase().includes("gas")) {
      return `${baseClasses} bg-orange-100 text-orange-800`;
    }
    return `${baseClasses} bg-gray-100 text-gray-800`;
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
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      {/* Header */}
      <div className="mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Bills Management
            </h1>
            <p className="text-gray-600 mt-1">Manage and track utility bills</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleExportCSV}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <ArrowDownTrayIcon className="w-5 h-5" />
              Export CSV
            </button>
            <button
              onClick={() => alert("Bulk Generate feature coming soon")}
              className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <DocumentTextIcon className="w-5 h-5" />
              Bulk Generate
            </button>
            <button
              onClick={() => alert("Generate Bill feature coming soon")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <PlusIcon className="w-5 h-5" />
              Generate Bill
            </button>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Bills This Month
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {summary.totalBills}
                </p>
              </div>
              <div className="bg-blue-100 p-3 rounded-full">
                <DocumentTextIcon className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Amount
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(summary.totalAmount)}
                </p>
              </div>
              <div className="bg-green-100 p-3 rounded-full">
                <CurrencyDollarIcon className="w-6 h-6 text-green-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Outstanding
                </p>
                <p className="text-2xl font-bold text-gray-900 mt-2">
                  {formatCurrency(summary.totalOutstanding)}
                </p>
              </div>
              <div className="bg-yellow-100 p-3 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-yellow-600" />
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Overdue Bills
                </p>
                <p className="text-2xl font-bold text-red-600 mt-2">
                  {summary.overdueCount}
                </p>
              </div>
              <div className="bg-red-100 p-3 rounded-full">
                <ExclamationTriangleIcon className="w-6 h-6 text-red-600" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <div className="flex items-center gap-2 mb-4">
          <FunnelIcon className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Search
            </label>
            <div className="relative">
              <MagnifyingGlassIcon className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" />
              <input
                type="text"
                placeholder="Customer name or Bill ID"
                value={filters.search || ""}
                onChange={(e) => handleFilterChange("search", e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* Utility Type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Utility Type
            </label>
            <select
              value={filters.utilityType || ""}
              onChange={(e) =>
                handleFilterChange("utilityType", e.target.value || undefined)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Types</option>
              <option value="Electricity">Electricity</option>
              <option value="Water">Water</option>
              <option value="Natural Gas">Gas</option>
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              value={filters.status || "All"}
              onChange={(e) => handleFilterChange("status", e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="All">All Status</option>
              <option value={BillStatus.PAID}>Paid</option>
              <option value={BillStatus.UNPAID}>Unpaid</option>
              <option value={BillStatus.OVERDUE}>Overdue</option>
              <option value={BillStatus.PARTIAL}>Partial</option>
            </select>
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

      {/* Bulk Actions */}
      {selectedBills.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-blue-900">
              {selectedBills.length} bill(s) selected
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => alert("Download selected feature coming soon")}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm"
              >
                Download Selected
              </button>
              <button
                onClick={() => alert("Send reminders feature coming soon")}
                className="px-4 py-2 bg-white border border-blue-300 text-blue-700 rounded-lg hover:bg-blue-50 transition-colors text-sm"
              >
                Send Reminders
              </button>
            </div>
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
          <div className="p-12 text-center">
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Loading bills...</p>
          </div>
        ) : bills.length === 0 ? (
          <div className="p-12 text-center">
            <DocumentTextIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No bills found
            </h3>
            <p className="text-gray-600">
              Try adjusting your filters or generate new bills
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-6 py-3 text-left">
                      <input
                        type="checkbox"
                        checked={
                          selectedBills.length === bills.length &&
                          bills.length > 0
                        }
                        onChange={handleSelectAll}
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Bill ID
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("billDate")}
                    >
                      Bill Date{" "}
                      {filters.sortBy === "billDate" &&
                        (filters.order === "ASC" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Meter Serial
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Utility Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Billing Period
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("dueDate")}
                    >
                      Due Date{" "}
                      {filters.sortBy === "dueDate" &&
                        (filters.order === "ASC" ? "↑" : "↓")}
                    </th>
                    <th
                      className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      onClick={() => handleSort("totalAmount")}
                    >
                      Amount{" "}
                      {filters.sortBy === "totalAmount" &&
                        (filters.order === "ASC" ? "↑" : "↓")}
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {bills.map((bill) => (
                    <tr key={bill.billId} className="hover:bg-gray-50">
                      <td className="px-6 py-4">
                        <input
                          type="checkbox"
                          checked={selectedBills.includes(bill.billId)}
                          onChange={() => handleSelectBill(bill.billId)}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        #{bill.billId}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(bill.billDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            alert(`View customer ${bill.customer.customerId}`)
                          }
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {bill.customer.firstName}{" "}
                          {bill.customer.middleName
                            ? bill.customer.middleName + " "
                            : ""}
                          {bill.customer.lastName}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() =>
                            alert(`View meter ${bill.meter.meterId}`)
                          }
                          className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                        >
                          {bill.meter.meterSerialNo}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span
                          className={getUtilityBadge(bill.meter.utilityType)}
                        >
                          {bill.meter.utilityType}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(bill.billingPeriodStart)} -{" "}
                        {formatDate(bill.billingPeriodEnd)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {formatDate(bill.dueDate)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {formatCurrency(bill.totalAmount)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(bill.status)}>
                          {bill.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm">
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() =>
                              alert(`View bill ${bill.billId} details`)
                            }
                            className="text-blue-600 hover:text-blue-800"
                            title="View Details"
                          >
                            <EyeIcon className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => handleDownloadPDF(bill.billId)}
                            className="text-green-600 hover:text-green-800"
                            title="Download PDF"
                          >
                            <DocumentArrowDownIcon className="w-5 h-5" />
                          </button>
                          {bill.status !== BillStatus.VOIDED && (
                            <button
                              onClick={() => handleVoidBill(bill.billId)}
                              className="text-red-600 hover:text-red-800"
                              title="Void Bill"
                            >
                              <TrashIcon className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
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
                        className={`px-3 py-1 border rounded-lg text-sm font-medium ${
                          filters.page === pageNum
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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  DocumentPlusIcon,
  XMarkIcon,
  ArrowDownTrayIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ClockIcon,
  PlayIcon,
  StopIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

interface BulkGenerationFormData {
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  utilityType: string;
  customerType: string;
  specificMeters: number[];
  geoAreaId?: number;
  dryRun: boolean;
  applySubsidies: boolean;
  applySolarCredits: boolean;
  skipExisting: boolean;
}

interface MeterPreview {
  meterId: number;
  meterSerialNo: string;
  customerName: string;
  lastReadingDate: string;
  estimatedConsumption: number;
  estimatedAmount: number;
}

interface GenerationProgress {
  total: number;
  processed: number;
  successful: number;
  failed: number;
  currentMeter: string;
  estimatedTimeRemaining: number;
}

interface BillResult {
  billId: number;
  meterId: number;
  meterSerialNo: string;
  customerName: string;
  amount: number;
  status: string;
}

interface FailureResult {
  meterId: number;
  meterSerialNo: string;
  customerName: string;
  errorReason: string;
}

interface GenerationResults {
  successCount: number;
  failureCount: number;
  totalAmount: number;
  averageAmount: number;
  successfulBills: BillResult[];
  failedBills: FailureResult[];
}

type PageState = "form" | "preview" | "generating" | "results";

export default function BulkGenerateBillsPage() {
  const router = useRouter();
  const [pageState, setPageState] = useState<PageState>("form");
  const [meterPreviews, setMeterPreviews] = useState<MeterPreview[]>([]);
  const [totalMeters, setTotalMeters] = useState(0);
  const [totalEstimatedAmount, setTotalEstimatedAmount] = useState(0);
  const [progress, setProgress] = useState<GenerationProgress | null>(null);
  const [results, setResults] = useState<GenerationResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [cancelRequested, setCancelRequested] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors },
  } = useForm<BulkGenerationFormData>({
    defaultValues: {
      dryRun: true,
      applySubsidies: true,
      applySolarCredits: true,
      skipExisting: true,
      utilityType: "ALL",
      customerType: "ALL",
      specificMeters: [],
    },
  });

  const watchedFields = watch();

  // Auto-set due date
  useEffect(() => {
    if (watchedFields.billingPeriodEnd) {
      const endDate = new Date(watchedFields.billingPeriodEnd);
      const dueDate = new Date(endDate);
      dueDate.setDate(dueDate.getDate() + 30);
      setValue("dueDate", dueDate.toISOString().split("T")[0]);
    }
  }, [watchedFields.billingPeriodEnd, setValue]);

  const useCurrentMonth = () => {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    setValue("billingPeriodStart", firstDay.toISOString().split("T")[0]);
    setValue("billingPeriodEnd", lastDay.toISOString().split("T")[0]);
  };

  const getPeriodSummary = () => {
    if (!watchedFields.billingPeriodStart || !watchedFields.billingPeriodEnd) {
      return "";
    }

    const start = new Date(watchedFields.billingPeriodStart);
    const end = new Date(watchedFields.billingPeriodEnd);
    const days = Math.ceil(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)
    );

    return `${start.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })} - ${end.toLocaleDateString("en-US", {
      month: "long",
      day: "numeric",
      year: "numeric",
    })} (${days} days)`;
  };

  const handlePreview = async (data: BulkGenerationFormData) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch(`${API_BASE_URL}/api/v1/bills/bulk`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...data,
          dryRun: true,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to preview meters");
      }

      const result = await response.json();

      setMeterPreviews(result.data.meters.slice(0, 50));
      setTotalMeters(result.data.totalCount);
      setTotalEstimatedAmount(result.data.totalEstimatedAmount);
      setPageState("preview");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to preview meters");
      console.error("Error previewing meters:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleStartGeneration = async () => {
    try {
      setIsGenerating(true);
      setCancelRequested(false);
      setPageState("generating");
      setError(null);

      const formData = watchedFields;
      const totalToProcess = totalMeters;
      let processed = 0;
      const batchSize = 50;
      const successfulBills: BillResult[] = [];
      const failedBills: FailureResult[] = [];

      // Process in batches
      for (let offset = 0; offset < totalToProcess; offset += batchSize) {
        if (cancelRequested) {
          throw new Error("Generation cancelled by user");
        }

        const startTime = Date.now();

        const response = await fetch(`${API_BASE_URL}/api/v1/bills/bulk`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            ...formData,
            dryRun: false,
            offset,
            limit: batchSize,
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || "Failed to generate bills");
        }

        const result = await response.json();

        successfulBills.push(...result.data.successfulBills);
        failedBills.push(...result.data.failedBills);
        processed += result.data.processedCount;

        const elapsedTime = Date.now() - startTime;
        const remainingBatches = Math.ceil(
          (totalToProcess - processed) / batchSize
        );
        const estimatedTimeRemaining = (elapsedTime / 1000) * remainingBatches;

        setProgress({
          total: totalToProcess,
          processed,
          successful: successfulBills.length,
          failed: failedBills.length,
          currentMeter: result.data.currentMeter || "",
          estimatedTimeRemaining,
        });
      }

      // Set final results
      const totalAmount = successfulBills.reduce(
        (sum, bill) => sum + bill.amount,
        0
      );
      const averageAmount =
        successfulBills.length > 0 ? totalAmount / successfulBills.length : 0;

      setResults({
        successCount: successfulBills.length,
        failureCount: failedBills.length,
        totalAmount,
        averageAmount,
        successfulBills,
        failedBills,
      });

      setPageState("results");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate bills");
      console.error("Error generating bills:", err);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCancel = () => {
    setCancelRequested(true);
  };

  const handleRetryFailed = async () => {
    if (!results) return;

    // Extract failed meter IDs and retry
    const failedMeterIds = results.failedBills.map((f) => f.meterId);
    setValue("specificMeters", failedMeterIds);
    setPageState("form");
  };

  const downloadCSV = (data: any[], filename: string) => {
    if (data.length === 0) return;

    const headers = Object.keys(data[0]);
    const csvContent = [
      headers.join(","),
      ...data.map((row) =>
        headers.map((header) => JSON.stringify(row[header] || "")).join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "LKR",
    }).format(amount);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}m ${remainingSeconds}s`;
  };

  const resetForm = () => {
    reset();
    setPageState("form");
    setMeterPreviews([]);
    setTotalMeters(0);
    setTotalEstimatedAmount(0);
    setProgress(null);
    setResults(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back to Bills
          </button>
          <h1 className="text-3xl font-bold text-gray-900">
            Bulk Bill Generation
          </h1>
          <p className="text-gray-600 mt-1">
            Generate bills for multiple meters for a billing period
          </p>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-start">
              <ExclamationCircleIcon className="w-5 h-5 text-red-600 mt-0.5 mr-3" />
              <div>
                <h3 className="text-sm font-medium text-red-900">Error</h3>
                <p className="text-sm text-red-700 mt-1">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Configuration Form */}
        {pageState === "form" && (
          <form onSubmit={handleSubmit(handlePreview)}>
            {/* Billing Period Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Billing Period
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Start Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("billingPeriodStart", {
                      required: "Start date is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.billingPeriodStart && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.billingPeriodStart.message}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    End Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    {...register("billingPeriodEnd", {
                      required: "End date is required",
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {errors.billingPeriodEnd && (
                    <p className="mt-1 text-sm text-red-600">
                      {errors.billingPeriodEnd.message}
                    </p>
                  )}
                </div>
              </div>

              <button
                type="button"
                onClick={useCurrentMonth}
                className="mb-4 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
              >
                Use Current Month
              </button>

              {getPeriodSummary() && (
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm text-blue-900">
                    <ClockIcon className="w-4 h-4 inline mr-2" />
                    Period: {getPeriodSummary()}
                  </p>
                </div>
              )}
            </div>

            {/* Filters Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Filters
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Utility Type
                  </label>
                  <select
                    {...register("utilityType")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Utilities</option>
                    <option value="ELECTRICITY">Electricity</option>
                    <option value="WATER">Water</option>
                    <option value="GAS">Gas</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Customer Type
                  </label>
                  <select
                    {...register("customerType")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="ALL">All Customers</option>
                    <option value="RESIDENTIAL">Residential</option>
                    <option value="COMMERCIAL">Commercial</option>
                    <option value="INDUSTRIAL">Industrial</option>
                    <option value="GOVERNMENT">Government</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geographic Area (Optional)
                  </label>
                  <select
                    {...register("geoAreaId")}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="">All Areas</option>
                    {/* Add options dynamically from API */}
                  </select>
                </div>
              </div>
            </div>

            {/* Due Date Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Due Date
              </h2>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Due Date <span className="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  {...register("dueDate", { required: "Due date is required" })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.dueDate && (
                  <p className="mt-1 text-sm text-red-600">
                    {errors.dueDate.message}
                  </p>
                )}
                <p className="mt-1 text-sm text-gray-500">
                  Default: 30 days from billing end date
                </p>
              </div>
            </div>

            {/* Options Section */}
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Options
              </h2>

              <div className="space-y-3">
                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register("dryRun")}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Dry Run (Preview without generating)
                    </span>
                    <p className="text-sm text-gray-600">
                      Calculate bills but don't save to database
                    </p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register("applySubsidies")}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Apply Subsidies
                    </span>
                    <p className="text-sm text-gray-600">
                      Apply subsidies for eligible customers
                    </p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register("applySolarCredits")}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Apply Solar Credits
                    </span>
                    <p className="text-sm text-gray-600">
                      Apply solar export credits for eligible meters
                    </p>
                  </div>
                </label>

                <label className="flex items-start">
                  <input
                    type="checkbox"
                    {...register("skipExisting")}
                    className="mt-1 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="ml-3">
                    <span className="text-sm font-medium text-gray-900">
                      Skip meters with existing bills in period
                    </span>
                    <p className="text-sm text-gray-600">
                      Don't generate bills for meters that already have bills in
                      this period
                    </p>
                  </div>
                </label>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Loading...
                    </>
                  ) : (
                    <>
                      <DocumentPlusIcon className="w-5 h-5" />
                      Preview Meters
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => router.back()}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}

        {/* Preview Section */}
        {pageState === "preview" && (
          <div>
            <div className="bg-white rounded-lg shadow p-6 mb-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Meters to be Billed
              </h2>

              {/* Summary */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <p className="text-sm text-blue-600">Total Meters</p>
                  <p className="text-3xl font-bold text-blue-600">
                    {totalMeters}
                  </p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <p className="text-sm text-green-600">
                    Estimated Total Amount
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatCurrency(totalEstimatedAmount)}
                  </p>
                </div>
              </div>

              {/* Meters Table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Meter Serial
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Customer
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Last Reading
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Est. Consumption
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                        Est. Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {meterPreviews.map((meter) => (
                      <tr key={meter.meterId}>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">
                          {meter.meterSerialNo}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900">
                          {meter.customerName}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {new Date(meter.lastReadingDate).toLocaleDateString()}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-900 text-right">
                          {meter.estimatedConsumption.toFixed(2)} units
                        </td>
                        <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                          {formatCurrency(meter.estimatedAmount)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {meterPreviews.length < totalMeters && (
                <p className="mt-4 text-sm text-gray-600 text-center">
                  Showing first 50 meters. Total: {totalMeters} meters
                </p>
              )}
            </div>

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex gap-3">
                <button
                  onClick={handleStartGeneration}
                  disabled={watchedFields.dryRun}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <PlayIcon className="w-5 h-5" />
                  Start Generation
                </button>

                <button
                  onClick={() => setPageState("form")}
                  className="px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  Back to Form
                </button>
              </div>

              {watchedFields.dryRun && (
                <p className="mt-3 text-sm text-orange-600">
                  <ExclamationCircleIcon className="w-4 h-4 inline mr-1" />
                  Dry run is enabled. Uncheck it in the form to generate actual
                  bills.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Generation Progress Section */}
        {pageState === "generating" && progress && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Generating Bills...
            </h2>

            {/* Progress Bar */}
            <div className="mb-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>
                  Progress: {progress.processed} / {progress.total}
                </span>
                <span>
                  {Math.round((progress.processed / progress.total) * 100)}%
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3">
                <div
                  className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                  style={{
                    width: `${(progress.processed / progress.total) * 100}%`,
                  }}
                ></div>
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-green-50 p-4 rounded-lg">
                <p className="text-sm text-green-600">Successful</p>
                <p className="text-2xl font-bold text-green-600">
                  {progress.successful}
                </p>
              </div>
              <div className="bg-red-50 p-4 rounded-lg">
                <p className="text-sm text-red-600">Failed</p>
                <p className="text-2xl font-bold text-red-600">
                  {progress.failed}
                </p>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-600">Est. Time Remaining</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatTime(progress.estimatedTimeRemaining)}
                </p>
              </div>
            </div>

            {/* Current Meter */}
            {progress.currentMeter && (
              <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mb-6">
                <p className="text-sm text-gray-600">Currently processing:</p>
                <p className="font-medium text-gray-900">
                  {progress.currentMeter}
                </p>
              </div>
            )}

            {/* Cancel Button */}
            <button
              onClick={handleCancel}
              disabled={cancelRequested}
              className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <StopIcon className="w-5 h-5" />
              {cancelRequested ? "Cancelling..." : "Cancel Generation"}
            </button>
          </div>
        )}

        {/* Results Section */}
        {pageState === "results" && results && (
          <div>
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">
                      Successfully Generated
                    </p>
                    <p className="text-3xl font-bold text-green-600">
                      {results.successCount}
                    </p>
                  </div>
                  <CheckCircleIcon className="w-12 h-12 text-green-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Failed</p>
                    <p className="text-3xl font-bold text-red-600">
                      {results.failureCount}
                    </p>
                  </div>
                  <ExclamationCircleIcon className="w-12 h-12 text-red-600" />
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div>
                  <p className="text-sm text-gray-600">Total Amount</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {formatCurrency(results.totalAmount)}
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div>
                  <p className="text-sm text-gray-600">Average Bill</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(results.averageAmount)}
                  </p>
                </div>
              </div>
            </div>

            {/* Success Table */}
            {results.successfulBills.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Successfully Generated Bills
                  </h2>
                  <button
                    onClick={() =>
                      downloadCSV(
                        results.successfulBills,
                        "successful-bills.csv"
                      )
                    }
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                  >
                    <ArrowDownTrayIcon className="w-4 h-4" />
                    Download CSV
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Bill ID
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Meter
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                          Amount
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Status
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.successfulBills.slice(0, 50).map((bill) => (
                        <tr key={bill.billId}>
                          <td className="px-4 py-3 text-sm font-medium text-blue-600">
                            <a
                              href={`/dashboard/bills/${bill.billId}`}
                              className="hover:underline"
                            >
                              #{bill.billId}
                            </a>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {bill.meterSerialNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {bill.customerName}
                          </td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                            {formatCurrency(bill.amount)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                              {bill.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {results.successfulBills.length > 50 && (
                  <p className="mt-4 text-sm text-gray-600 text-center">
                    Showing first 50 bills. Total:{" "}
                    {results.successfulBills.length} bills
                  </p>
                )}
              </div>
            )}

            {/* Failures Table */}
            {results.failedBills.length > 0 && (
              <div className="bg-white rounded-lg shadow p-6 mb-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Failed Bills
                  </h2>
                  <div className="flex gap-2">
                    <button
                      onClick={handleRetryFailed}
                      className="flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                    >
                      <ArrowPathIcon className="w-4 h-4" />
                      Retry Failed
                    </button>
                    <button
                      onClick={() =>
                        downloadCSV(results.failedBills, "failed-bills.csv")
                      }
                      className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm font-medium"
                    >
                      <ArrowDownTrayIcon className="w-4 h-4" />
                      Download CSV
                    </button>
                  </div>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Meter
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Customer
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                          Error Reason
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {results.failedBills.map((failure) => (
                        <tr key={failure.meterId}>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {failure.meterSerialNo}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {failure.customerName}
                          </td>
                          <td className="px-4 py-3 text-sm text-red-600">
                            {failure.errorReason}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => router.push(`/dashboard/bills?status=UNPAID`)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium"
                >
                  View Generated Bills
                </button>

                <button
                  onClick={resetForm}
                  className="flex items-center gap-2 px-6 py-3 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                >
                  <DocumentPlusIcon className="w-5 h-5" />
                  Start New Run
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

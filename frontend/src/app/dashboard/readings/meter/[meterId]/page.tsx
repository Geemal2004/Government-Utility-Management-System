"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  Plus,
  Download,
  FileText,
  Calendar,
  MapPin,
  User,
  Zap,
  TrendingUp,
  TrendingDown,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { readingsApi } from "@/lib/api/readings";
import { lookupApi } from "@/lib/api/lookup";
import {
  MeterReading,
  ReadingSource,
  ConsumptionSummary,
} from "@/types/reading";
import { Meter } from "@/types/connection";
import { PaginationMeta } from "@/types/customer";
import { useToast } from "@/components/ui/toast";

interface MeterWithDetails extends Meter {
  serviceConnection?: {
    connectionId: number;
    customer?: {
      customerId: number;
      fullName: string;
    };
    connectionAddress?: {
      line1: string;
      city: string;
      postalCode: string;
    };
  };
  utilityType?: {
    utilityTypeId: number;
    name: string;
    unit: string;
  };
}

export default function MeterHistoryPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const meterId = Number(params.meterId);

  // State
  const [meter, setMeter] = useState<MeterWithDetails | null>(null);
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [consumptionSummary, setConsumptionSummary] =
    useState<ConsumptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  // Date range for chart
  const [startDate, setStartDate] = useState(() => {
    const date = new Date();
    date.setMonth(date.getMonth() - 6); // Last 6 months
    return date.toISOString().split("T")[0];
  });
  const [endDate, setEndDate] = useState(
    () => new Date().toISOString().split("T")[0]
  );

  /**
   * Fetch meter details
   */
  useEffect(() => {
    const fetchMeter = async () => {
      try {
        const response = await lookupApi.getMeterById(meterId);
        if (response.success) {
          setMeter(response.data as MeterWithDetails);
        }
      } catch (err) {
        console.error("Error fetching meter:", err);
      }
    };

    if (meterId) {
      fetchMeter();
    }
  }, [meterId]);

  /**
   * Fetch readings
   */
  useEffect(() => {
    const fetchReadings = async () => {
      try {
        setLoading(true);
        setError(null);

        const response = await readingsApi.getByMeter(meterId, {
          page,
          limit: 20,
          sortBy: "readingDate",
          order: "DESC",
          startDate,
          endDate,
        });

        if (response.success) {
          setReadings(response.data.items);
          setMeta(response.data.meta);
        } else {
          setError(response.error || "Failed to fetch readings");
        }
      } catch (err) {
        console.error("Error fetching readings:", err);
        setError("Failed to fetch readings. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    if (meterId) {
      fetchReadings();
    }
  }, [meterId, page, startDate, endDate]);

  /**
   * Fetch consumption summary
   */
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const response = await readingsApi.getConsumptionSummary(
          meterId,
          startDate,
          endDate
        );
        if (response.success) {
          setConsumptionSummary(response.data);
        }
      } catch (err) {
        console.error("Error fetching consumption summary:", err);
      }
    };

    if (meterId) {
      fetchSummary();
    }
  }, [meterId, startDate, endDate]);

  /**
   * Prepare chart data
   */
  const chartData = useMemo(() => {
    return readings
      .slice()
      .reverse()
      .map((reading) => ({
        date: new Date(reading.readingDate).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
        }),
        consumption: reading.consumption || 0,
        reading: reading.importReading,
        isAbnormal:
          reading.consumption &&
          consumptionSummary &&
          Math.abs(
            reading.consumption - consumptionSummary.averageConsumption
          ) >
            consumptionSummary.averageConsumption * 0.5,
      }));
  }, [readings, consumptionSummary]);

  /**
   * Calculate statistics
   */
  const statistics = useMemo(() => {
    if (readings.length === 0) {
      return {
        totalConsumption: 0,
        averageConsumption: 0,
        highestConsumption: 0,
        lowestConsumption: 0,
        readingCount: 0,
        last30DaysConsumption: 0,
      };
    }

    const consumptions = readings
      .map((r) => r.consumption || 0)
      .filter((c) => c > 0);
    const totalConsumption = consumptions.reduce((sum, c) => sum + c, 0);

    // Last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const last30Days = readings.filter(
      (r) => new Date(r.readingDate) >= thirtyDaysAgo
    );
    const last30DaysConsumption = last30Days.reduce(
      (sum, r) => sum + (r.consumption || 0),
      0
    );

    return {
      totalConsumption,
      averageConsumption:
        consumptions.length > 0 ? totalConsumption / consumptions.length : 0,
      highestConsumption:
        consumptions.length > 0 ? Math.max(...consumptions) : 0,
      lowestConsumption:
        consumptions.length > 0 ? Math.min(...consumptions) : 0,
      readingCount: readings.length,
      last30DaysConsumption,
    };
  }, [readings]);

  /**
   * Export to CSV
   */
  const handleExport = async () => {
    try {
      const blob = await readingsApi.exportToCsv({
        meterId,
        startDate,
        endDate,
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meter-${meter?.meterSerialNo || meterId}-history-${
        new Date().toISOString().split("T")[0]
      }.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast("success", "Success", "Readings exported successfully");
    } catch (err) {
      console.error("Error exporting readings:", err);
      addToast("error", "Error", "Failed to export readings");
    }
  };

  /**
   * Get badge color for reading source
   */
  const getSourceBadgeColor = (source: ReadingSource) => {
    switch (source) {
      case ReadingSource.MANUAL:
        return "bg-blue-100 text-blue-800";
      case ReadingSource.AUTOMATIC:
        return "bg-green-100 text-green-800";
      case ReadingSource.ESTIMATED:
        return "bg-yellow-100 text-yellow-800";
      case ReadingSource.CORRECTED:
        return "bg-purple-100 text-purple-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (!meterId) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Invalid Meter ID
          </h2>
          <p className="text-gray-600 mb-4">
            The meter ID provided is not valid.
          </p>
          <Link
            href="/dashboard/readings"
            className="text-blue-600 hover:text-blue-800"
          >
            Return to Readings
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/readings"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Meter Reading History
            </h1>
            <p className="text-gray-600">
              {meter?.meterSerialNo || `Meter #${meterId}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Download className="h-5 w-5" />
            Export History
          </button>
          <Link
            href="/dashboard/readings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Reading
          </Link>
        </div>
      </div>

      {/* 1. Meter Info Card */}
      {meter && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Meter Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-600 mb-1">Meter Serial Number</p>
              <p className="text-lg font-semibold text-gray-900">
                {meter.meterSerialNo}
              </p>
            </div>

            {meter.serviceConnection?.customer && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <User className="h-4 w-4" />
                  Customer
                </p>
                <Link
                  href={`/dashboard/customers/${meter.serviceConnection.customer.customerId}`}
                  className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                >
                  {meter.serviceConnection.customer.fullName}
                </Link>
              </div>
            )}

            {meter.serviceConnection?.connectionAddress && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  Connection Address
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {meter.serviceConnection.connectionAddress.line1}
                </p>
                <p className="text-sm text-gray-600">
                  {meter.serviceConnection.connectionAddress.city},{" "}
                  {meter.serviceConnection.connectionAddress.postalCode}
                </p>
              </div>
            )}

            {meter.utilityType && (
              <div>
                <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                  <Zap className="h-4 w-4" />
                  Utility Type
                </p>
                <p className="text-lg font-semibold text-gray-900">
                  {meter.utilityType.name}
                </p>
              </div>
            )}

            <div>
              <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                Installation Date
              </p>
              <p className="text-lg font-semibold text-gray-900">
                {new Date(meter.installationDate).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </p>
            </div>

            <div>
              <p className="text-sm text-gray-600 mb-1">Meter Type</p>
              <p className="text-lg font-semibold text-gray-900">
                {meter.isSmartMeter ? "Smart Meter" : "Standard Meter"}
              </p>
            </div>

            {readings.length > 0 && (
              <>
                <div>
                  <p className="text-sm text-gray-600 mb-1">
                    Last Reading Date
                  </p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatDate(readings[0].readingDate)}
                  </p>
                </div>

                <div>
                  <p className="text-sm text-gray-600 mb-1">Current Reading</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {readings[0].importReading.toLocaleString()}
                  </p>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* 4. Summary Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-blue-600" />
            </div>
            <p className="text-sm text-gray-600">Total Consumption</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.totalConsumption.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {meter?.utilityType?.unit || "units"}
          </p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-green-100 rounded-lg">
              <Activity className="h-5 w-5 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">Average</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.averageConsumption.toFixed(2)}
          </p>
          <p className="text-xs text-gray-500 mt-1">per reading</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-red-100 rounded-lg">
              <TrendingUp className="h-5 w-5 text-red-600" />
            </div>
            <p className="text-sm text-gray-600">Highest</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.highestConsumption.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">single reading</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <TrendingDown className="h-5 w-5 text-yellow-600" />
            </div>
            <p className="text-sm text-gray-600">Lowest</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.lowestConsumption.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">single reading</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-5 w-5 text-purple-600" />
            </div>
            <p className="text-sm text-gray-600">Total Readings</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.readingCount}
          </p>
          <p className="text-xs text-gray-500 mt-1">in period</p>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Calendar className="h-5 w-5 text-indigo-600" />
            </div>
            <p className="text-sm text-gray-600">Last 30 Days</p>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {statistics.last30DaysConsumption.toLocaleString()}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {meter?.utilityType?.unit || "units"}
          </p>
        </div>
      </div>

      {/* Date Range Selector */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-gray-400" />
            <label className="text-sm font-medium text-gray-700">From:</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <div className="flex items-center gap-2">
            <label className="text-sm font-medium text-gray-700">To:</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              max={new Date().toISOString().split("T")[0]}
              className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={() => {
              const date = new Date();
              date.setMonth(date.getMonth() - 6);
              setStartDate(date.toISOString().split("T")[0]);
              setEndDate(new Date().toISOString().split("T")[0]);
              setPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Last 6 Months
          </button>

          <button
            onClick={() => {
              const date = new Date();
              date.setFullYear(date.getFullYear() - 1);
              setStartDate(date.toISOString().split("T")[0]);
              setEndDate(new Date().toISOString().split("T")[0]);
              setPage(1);
            }}
            className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800 underline"
          >
            Last Year
          </button>
        </div>
      </div>

      {/* 2. Consumption Chart */}
      {chartData.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Consumption Trend
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis
                label={{
                  value: meter?.utilityType?.unit || "Units",
                  angle: -90,
                  position: "insideLeft",
                }}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "0.5rem",
                }}
              />
              <Legend />
              {consumptionSummary && (
                <ReferenceLine
                  y={consumptionSummary.averageConsumption}
                  label="Average"
                  stroke="#9ca3af"
                  strokeDasharray="5 5"
                />
              )}
              <Line
                type="monotone"
                dataKey="consumption"
                stroke="#3b82f6"
                strokeWidth={2}
                name="Consumption"
                dot={(props: any) => {
                  const { cx, cy, payload } = props;
                  return (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={payload.isAbnormal ? 6 : 4}
                      fill={payload.isAbnormal ? "#ef4444" : "#3b82f6"}
                      stroke="white"
                      strokeWidth={2}
                    />
                  );
                }}
              />
            </LineChart>
          </ResponsiveContainer>
          <div className="mt-4 flex items-center gap-4 text-sm text-gray-600">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500"></div>
              <span>Normal Reading</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500"></div>
              <span>Abnormal Reading (&gt;50% deviation)</span>
            </div>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {/* 3. Readings Timeline Table */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading readings...</span>
        </div>
      ) : readings.length === 0 ? (
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No readings found
          </h3>
          <p className="text-gray-600 mb-4">
            No readings found for the selected date range
          </p>
          <Link
            href="/dashboard/readings/new"
            className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
          >
            <Plus className="h-5 w-5" />
            Add First Reading
          </Link>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Reading History
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date & Time
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Consumption
                  </th>
                  <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reader
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {readings.map((reading) => (
                  <tr
                    key={reading.readingId}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      router.push(`/dashboard/readings/${reading.readingId}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDate(reading.readingDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      {reading.importReading.toLocaleString()}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${
                        reading.consumption && reading.consumption < 0
                          ? "text-red-600 font-semibold"
                          : ""
                      }`}
                    >
                      {reading.consumption !== null ? (
                        <span
                          className={
                            reading.consumption < 0
                              ? "bg-red-100 px-2 py-1 rounded"
                              : ""
                          }
                        >
                          {reading.consumption.toLocaleString()}
                        </span>
                      ) : (
                        "-"
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getSourceBadgeColor(
                          reading.readingSource
                        )}`}
                      >
                        {reading.readingSource}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.reader?.employee
                        ? `${reading.reader.employee.firstName} ${reading.reader.employee.lastName}`
                        : "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                      <Link
                        href={`/dashboard/readings/${reading.readingId}`}
                        className="text-blue-600 hover:text-blue-900 font-medium"
                        onClick={(e) => e.stopPropagation()}
                      >
                        View Details
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {meta && meta.totalPages > 1 && (
            <div className="bg-gray-50 px-6 py-3 flex items-center justify-between border-t border-gray-200">
              <div className="text-sm text-gray-700">
                Showing{" "}
                <span className="font-medium">
                  {(meta.page - 1) * meta.limit + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium">
                  {Math.min(meta.page * meta.limit, meta.total)}
                </span>{" "}
                of <span className="font-medium">{meta.total}</span> results
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={!meta.hasPreviousPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={!meta.hasNextPage}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

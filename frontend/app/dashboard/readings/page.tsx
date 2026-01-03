"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  Search,
  Plus,
  Download,
  Upload,
  Eye,
  Pencil,
  Trash2,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Activity,
  Gauge,
  AlertTriangle,
  Clock,
  Calendar,
  Filter,
  X,
  FileSpreadsheet,
} from "lucide-react";
import { readingsApi } from "@/lib/api/readings";
import { MeterReading, ReadingSource, AnomalyResult } from "@/types/reading";
import { PaginationMeta } from "@/types/customer";
import { useToast } from "@/components/ui/toast";

// Threshold for high consumption (percentage above average)
const HIGH_CONSUMPTION_THRESHOLD = 150;

export default function ReadingsPage() {
  // State
  const [readings, setReadings] = useState<MeterReading[]>([]);
  const [meta, setMeta] = useState<PaginationMeta | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [readingSource, setReadingSource] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);

  // Statistics
  const [stats, setStats] = useState({
    totalReadingsToday: 0,
    averageConsumption: 0,
    metersPendingReading: 0,
    abnormalReadingsCount: 0,
  });
  const [anomalies, setAnomalies] = useState<AnomalyResult[]>([]);

  // Import/Export state
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);

  const { addToast } = useToast();

  /**
   * Fetch readings from API
   */
  const fetchReadings = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: Record<string, unknown> = {
        page,
        limit: 10,
        sortBy: "readingDate",
        order: "DESC" as const,
      };

      if (search) params.search = search;
      if (readingSource) params.readingSource = readingSource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const response = await readingsApi.getAll(params);

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
  }, [page, search, readingSource, startDate, endDate]);

  /**
   * Fetch statistics (simplified - using available data)
   */
  const fetchStats = useCallback(async () => {
    try {
      // Get today's date range
      const today = new Date().toISOString().split("T")[0];
      // Get last 30 days for anomalies
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      const startDate = thirtyDaysAgo.toISOString().split("T")[0];

      // Get today's readings count
      const todayResponse = await readingsApi.getAll({
        startDate: today,
        endDate: today,
        limit: 1,
      });

      // Get anomalies with date range (last 30 days)
      const anomalyResponse = await readingsApi.detectAnomalies(
        startDate,
        today,
        undefined // use default threshold
      );

      if (todayResponse.success) {
        setStats((prev) => ({
          ...prev,
          totalReadingsToday: todayResponse.data.meta.total,
        }));
      }

      if (anomalyResponse.success && Array.isArray(anomalyResponse.data)) {
        setAnomalies(anomalyResponse.data);
        setStats((prev) => ({
          ...prev,
          abnormalReadingsCount: anomalyResponse.data.length,
        }));
      }
    } catch (err) {
      console.error("Error fetching stats:", err);
    }
  }, []);

  useEffect(() => {
    fetchReadings();
  }, [fetchReadings]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  /**
   * Handle search form submit
   */
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchReadings();
  };

  /**
   * Reset all filters
   */
  const resetFilters = () => {
    setSearch("");
    setReadingSource("");
    setStartDate("");
    setEndDate("");
    setPage(1);
  };

  /**
   * Handle delete reading
   */
  const handleDelete = async (readingId: number) => {
    if (
      !confirm(
        "Are you sure you want to delete this reading? This action cannot be undone.",
      )
    ) {
      return;
    }

    try {
      setDeleting(readingId);
      const response = await readingsApi.delete(readingId);

      if (response.success) {
        addToast("success", "Success", "Reading deleted successfully");
        fetchReadings();
      } else {
        addToast(
          "error",
          "Error",
          response.error || "Failed to delete reading",
        );
      }
    } catch (err) {
      console.error("Error deleting reading:", err);
      addToast("error", "Error", "Failed to delete reading. Please try again.");
    } finally {
      setDeleting(null);
    }
  };

  /**
   * Handle CSV export
   */
  const handleExport = async () => {
    try {
      setExporting(true);
      const params: Record<string, unknown> = {};
      if (readingSource) params.readingSource = readingSource;
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const blob = await readingsApi.exportToCsv(params);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `meter-readings-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      addToast("success", "Success", "Readings exported successfully");
    } catch (err) {
      console.error("Error exporting readings:", err);
      addToast(
        "error",
        "Error",
        "Failed to export readings. Please try again.",
      );
    } finally {
      setExporting(false);
    }
  };

  /**
   * Handle CSV import
   */
  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setImporting(true);
      const response = await readingsApi.importFromCsv(file);

      if (response.success) {
        const { totalRows, successCount, errorCount } = response.data;
        addToast(
          successCount > 0 ? "success" : "error",
          "Import Complete",
          `Imported ${successCount} of ${totalRows} readings. ${errorCount} errors.`,
        );
        fetchReadings();
      } else {
        addToast(
          "error",
          "Error",
          response.error || "Failed to import readings",
        );
      }
    } catch (err) {
      console.error("Error importing readings:", err);
      addToast(
        "error",
        "Error",
        "Failed to import readings. Please check the file format.",
      );
    } finally {
      setImporting(false);
      // Reset file input
      e.target.value = "";
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
   * Get consumption cell styling
   */
  const getConsumptionStyle = (
    consumption: number | null,
    averageConsumption: number,
  ) => {
    if (consumption === null) return "";
    if (consumption < 0) return "bg-red-100 text-red-800 font-semibold";
    if (
      averageConsumption > 0 &&
      consumption > averageConsumption * (HIGH_CONSUMPTION_THRESHOLD / 100)
    ) {
      return "text-red-600 font-semibold";
    }
    return "";
  };

  /**
   * Check if reading is anomalous
   */
  const isAnomalous = (readingId: number) => {
    return anomalies.some((a) => a.readingId === readingId);
  };

  /**
   * Format date for display
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /**
   * Format datetime for display
   */
  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Meter Readings</h1>
          <p className="text-gray-600">
            Manage meter readings and consumption data
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Import Button */}
          <label className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors cursor-pointer">
            {importing ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Upload className="h-5 w-5" />
            )}
            Import CSV
            <input
              type="file"
              accept=".csv"
              onChange={handleImport}
              disabled={importing}
              className="hidden"
            />
          </label>

          {/* Export Button */}
          <button
            onClick={handleExport}
            disabled={exporting}
            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Download className="h-5 w-5" />
            )}
            Export CSV
          </button>

          {/* Add Reading Button */}
          <Link
            href="/dashboard/readings/new"
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Reading
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-blue-100 rounded-lg">
              <Gauge className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Readings Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.totalReadingsToday}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-green-100 rounded-lg">
              <Activity className="h-6 w-6 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Avg. Consumption</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.averageConsumption.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-yellow-100 rounded-lg">
              <Clock className="h-6 w-6 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Pending Meters</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.metersPendingReading}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-red-100 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Abnormal Readings</p>
              <p className="text-2xl font-bold text-gray-900">
                {stats.abnormalReadingsCount}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="space-y-4">
          {/* Main Search Row */}
          <div className="flex flex-wrap gap-4">
            <div className="flex-1 min-w-[200px]">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search by meter serial no. or customer name..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            <select
              value={readingSource}
              onChange={(e) => {
                setReadingSource(e.target.value);
                setPage(1);
              }}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Sources</option>
              <option value="MANUAL">Manual</option>
              <option value="AUTOMATIC">Automatic</option>
              <option value="ESTIMATED">Estimated</option>
              <option value="CORRECTED">Corrected</option>
            </select>

            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`inline-flex items-center gap-2 px-4 py-2 border rounded-lg transition-colors ${
                showFilters
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-gray-300 text-gray-700 hover:bg-gray-50"
              }`}
            >
              <Filter className="h-5 w-5" />
              Filters
              {(startDate || endDate) && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full">
                  {[startDate, endDate].filter(Boolean).length}
                </span>
              )}
            </button>

            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Search
            </button>
          </div>

          {/* Extended Filters */}
          {showFilters && (
            <div className="flex flex-wrap gap-4 pt-4 border-t border-gray-200">
              <div className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-gray-400" />
                <label className="text-sm text-gray-600">From:</label>
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
                <label className="text-sm text-gray-600">To:</label>
                <input
                  type="date"
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setPage(1);
                  }}
                  className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {(search || readingSource || startDate || endDate) && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </button>
              )}
            </div>
          )}
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchReadings}
            className="ml-auto text-red-600 hover:text-red-800 underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className="bg-white rounded-lg shadow p-8 flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
          <span className="ml-3 text-gray-600">Loading readings...</span>
        </div>
      ) : readings.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <FileSpreadsheet className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No readings found
          </h3>
          <p className="text-gray-600 mb-4">
            {search || readingSource || startDate || endDate
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first meter reading"}
          </p>
          {!search && !readingSource && !startDate && !endDate && (
            <Link
              href="/dashboard/readings/new"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-5 w-5" />
              Add Reading
            </Link>
          )}
        </div>
      ) : (
        /* Data Table */
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meter
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Import
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Previous
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
                    className={`hover:bg-gray-50 ${
                      isAnomalous(reading.readingId) ? "bg-red-50" : ""
                    }`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div className="flex items-center gap-2">
                        #{reading.readingId}
                        {isAnomalous(reading.readingId) && (
                          <span title="Anomalous reading">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {reading.meter?.meterSerialNo ||
                          `Meter #${reading.meterId}`}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {reading.meter?.serviceConnection?.customer?.fullName ||
                        "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDateTime(reading.readingDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 text-right font-mono">
                      {reading.importReading.toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-right font-mono">
                      {reading.previousReading?.toLocaleString() || "-"}
                    </td>
                    <td
                      className={`px-6 py-4 whitespace-nowrap text-sm text-right font-mono ${getConsumptionStyle(
                        reading.consumption,
                        stats.averageConsumption,
                      )}`}
                    >
                      {reading.consumption !== null ? (
                        <span
                          className={`inline-flex px-2 py-1 rounded ${
                            reading.consumption < 0
                              ? "bg-red-100 text-red-800"
                              : ""
                          }`}
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
                          reading.readingSource,
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
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/readings/${reading.readingId}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/readings/${reading.readingId}/edit`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() => handleDelete(reading.readingId)}
                          disabled={deleting === reading.readingId}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === reading.readingId ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Trash2 className="h-4 w-4" />
                          )}
                        </button>
                      </div>
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
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <span className="px-4 py-2 text-sm">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <button
                  onClick={() =>
                    setPage((p) => Math.min(meta.totalPages, p + 1))
                  }
                  disabled={!meta.hasNextPage}
                  className="p-2 border border-gray-300 rounded-lg hover:bg-gray-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-sm font-medium text-gray-700 mb-3">Legend</h3>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
              MANUAL
            </span>
            <span className="text-gray-600">Manual reading</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
              AUTOMATIC
            </span>
            <span className="text-gray-600">Automatic/Smart meter</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
              ESTIMATED
            </span>
            <span className="text-gray-600">Estimated reading</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">
              CORRECTED
            </span>
            <span className="text-gray-600">Corrected reading</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-red-600 font-semibold">Red text</span>
            <span className="text-gray-600">
              High consumption (&gt;150% of avg)
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="inline-flex px-2 py-1 bg-red-100 text-red-800 rounded">
              -100
            </span>
            <span className="text-gray-600">Negative consumption</span>
          </div>
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-500" />
            <span className="text-gray-600">Anomalous reading</span>
          </div>
        </div>
      </div>
    </div>
  );
}

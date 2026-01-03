"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  ChevronLeft,
  ChevronRight,
  Zap,
  Droplets,
  Flame,
  Loader2,
  AlertCircle,
  Cable,
  ChevronDown,
} from "lucide-react";
import { connectionsApi } from "@/lib/api/connections";
import {
  ServiceConnection,
  ConnectionStatus,
  ConnectionQueryParams,
} from "@/types/connection";
import { PaginatedResponse } from "@/types/customer";
import { useToast } from "@/components/ui/toast";

export default function ConnectionsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [connections, setConnections] = useState<ServiceConnection[]>([]);
  const [meta, setMeta] = useState<
    PaginatedResponse<ServiceConnection>["meta"] | null
  >(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [utilityType, setUtilityType] = useState<string>("");
  const [status, setStatus] = useState<string>("");
  const [city, setCity] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  // Get unique cities from connections for filter dropdown
  const [cities, setCities] = useState<string[]>([]);

  const fetchConnections = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: ConnectionQueryParams = {
        page,
        limit,
        sortBy: "connectionId",
        order: "DESC",
      };

      if (utilityType) params.utilityTypeId = parseInt(utilityType);
      if (status) params.connectionStatus = status as ConnectionStatus;
      if (city) params.city = city;

      const response = await connectionsApi.getAll(params);

      if (response.success && response.data) {
        setConnections(response.data.items);
        setMeta(response.data.meta);

        // Extract unique cities for the filter
        const uniqueCities = Array.from(
          new Set(
            response.data.items
              .map((c) => c.connectionAddress?.city)
              .filter((c): c is string => !!c),
          ),
        ).sort();
        setCities((prev) => {
          const combined = Array.from(new Set([...prev, ...uniqueCities]));
          return combined.sort();
        });
      } else {
        setError(response.error || "Failed to fetch connections");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch connections";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [page, limit, utilityType, status, city]);

  useEffect(() => {
    fetchConnections();
  }, [fetchConnections]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchConnections();
  };

  const handleStatusChange = async (
    connectionId: number,
    newStatus: ConnectionStatus,
  ) => {
    try {
      setUpdatingStatus(connectionId);
      const response = await connectionsApi.updateStatus(
        connectionId,
        newStatus,
      );

      if (response.success) {
        addToast(
          "success",
          "Status Updated",
          `Connection status changed to ${newStatus}`,
        );
        fetchConnections();
      } else {
        addToast(
          "error",
          "Update Failed",
          response.error || "Failed to update status",
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      addToast("error", "Update Failed", errorMessage);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusBadgeColor = (connectionStatus: ConnectionStatus) => {
    switch (connectionStatus) {
      case ConnectionStatus.ACTIVE:
        return "bg-green-100 text-green-800";
      case ConnectionStatus.INACTIVE:
        return "bg-gray-100 text-gray-800";
      case ConnectionStatus.SUSPENDED:
        return "bg-yellow-100 text-yellow-800";
      case ConnectionStatus.DISCONNECTED:
        return "bg-red-100 text-red-800";
      case ConnectionStatus.PENDING:
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUtilityIcon = (utilityName?: string) => {
    switch (utilityName?.toUpperCase()) {
      case "ELECTRICITY":
        return <Zap className="h-4 w-4 text-yellow-500" />;
      case "WATER":
        return <Droplets className="h-4 w-4 text-blue-500" />;
      case "GAS":
        return <Flame className="h-4 w-4 text-orange-500" />;
      default:
        return <Cable className="h-4 w-4 text-gray-500" />;
    }
  };

  const getUtilityBadgeColor = (utilityName?: string) => {
    switch (utilityName?.toUpperCase()) {
      case "ELECTRICITY":
        return "bg-yellow-50 text-yellow-700 border-yellow-200";
      case "WATER":
        return "bg-blue-50 text-blue-700 border-blue-200";
      case "GAS":
        return "bg-orange-50 text-orange-700 border-orange-200";
      default:
        return "bg-gray-50 text-gray-700 border-gray-200";
    }
  };

  // Filter connections by search term (client-side for customer name/connection ID)
  const filteredConnections = connections.filter((connection) => {
    if (!search) return true;
    const searchLower = search.toLowerCase();
    const customerName = connection.customer?.fullName?.toLowerCase() || "";
    const connectionId = connection.connectionId.toString();
    return customerName.includes(searchLower) || connectionId.includes(search);
  });

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Service Connections
          </h1>
          <p className="text-gray-600">
            Manage utility service connections for customers
          </p>
        </div>
        <Link
          href="/dashboard/connections/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Connection
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          {/* Search Input */}
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by customer name or connection ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Utility Type Filter */}
          <select
            value={utilityType}
            onChange={(e) => {
              setUtilityType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Utility Types</option>
            <option value="1">Electricity</option>
            <option value="2">Water</option>
            <option value="3">Gas</option>
          </select>

          {/* Status Filter */}
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active</option>
            <option value="INACTIVE">Inactive</option>
            <option value="SUSPENDED">Suspended</option>
            <option value="DISCONNECTED">Disconnected</option>
            <option value="PENDING">Pending</option>
          </select>

          {/* City Filter */}
          <select
            value={city}
            onChange={(e) => {
              setCity(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Cities</option>
            {cities.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            Search
          </button>
        </form>
      </div>

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4 flex items-center gap-3">
          <AlertCircle className="h-5 w-5 text-red-500" />
          <p className="text-red-700">{error}</p>
          <button
            onClick={fetchConnections}
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
          <span className="ml-3 text-gray-600">Loading connections...</span>
        </div>
      ) : filteredConnections.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Cable className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No connections found
          </h3>
          <p className="text-gray-600 mb-4">
            {search || utilityType || status || city
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first service connection"}
          </p>
          {!search && !utilityType && !status && !city && (
            <Link
              href="/dashboard/connections/new"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-5 w-5" />
              Add Connection
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
                    Connection ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Utility Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meter Serial No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address (City)
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredConnections.map((connection) => (
                  <tr
                    key={connection.connectionId}
                    className="hover:bg-gray-50"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      #{connection.connectionId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {connection.customer?.fullName || "Unknown Customer"}
                      </div>
                      <div className="text-xs text-gray-500">
                        ID: {connection.customerId}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div
                        className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${getUtilityBadgeColor(connection.utilityType?.name)}`}
                      >
                        {getUtilityIcon(connection.utilityType?.name)}
                        <span className="text-sm font-medium">
                          {connection.utilityType?.name || "Unknown"}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {connection.meter?.meterSerialNo || (
                        <span className="text-gray-400 italic">
                          Not assigned
                        </span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">
                        {connection.connectionAddress?.city || "-"}
                      </div>
                      <div className="text-xs text-gray-500 truncate max-w-[200px]">
                        {connection.connectionAddress?.line1 || ""}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {/* Status Badge with Dropdown */}
                      <div className="relative inline-block">
                        {updatingStatus === connection.connectionId ? (
                          <div className="flex items-center gap-2">
                            <Loader2 className="h-4 w-4 animate-spin text-blue-600" />
                            <span className="text-sm text-gray-500">
                              Updating...
                            </span>
                          </div>
                        ) : (
                          <div className="group relative">
                            <button
                              className={`inline-flex items-center gap-1 px-3 py-1 text-xs font-semibold rounded-full ${getStatusBadgeColor(connection.connectionStatus)}`}
                            >
                              {connection.connectionStatus}
                              <ChevronDown className="h-3 w-3" />
                            </button>
                            <div className="absolute left-0 mt-1 w-40 bg-white border border-gray-200 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-10">
                              <div className="py-1">
                                {Object.values(ConnectionStatus).map(
                                  (statusOption) => (
                                    <button
                                      key={statusOption}
                                      onClick={() =>
                                        handleStatusChange(
                                          connection.connectionId,
                                          statusOption,
                                        )
                                      }
                                      disabled={
                                        statusOption ===
                                        connection.connectionStatus
                                      }
                                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                                        statusOption ===
                                        connection.connectionStatus
                                          ? "bg-gray-50 font-medium"
                                          : ""
                                      }`}
                                    >
                                      <span
                                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                                          statusOption ===
                                          ConnectionStatus.ACTIVE
                                            ? "bg-green-500"
                                            : statusOption ===
                                                ConnectionStatus.INACTIVE
                                              ? "bg-gray-500"
                                              : statusOption ===
                                                  ConnectionStatus.SUSPENDED
                                                ? "bg-yellow-500"
                                                : statusOption ===
                                                    ConnectionStatus.DISCONNECTED
                                                  ? "bg-red-500"
                                                  : "bg-blue-500"
                                        }`}
                                      />
                                      {statusOption}
                                    </button>
                                  ),
                                )}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/connections/${connection.connectionId}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View Details"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/connections/${connection.connectionId}/edit`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
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
    </div>
  );
}

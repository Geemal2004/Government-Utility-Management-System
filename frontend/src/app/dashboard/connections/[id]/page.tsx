"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Zap,
  Droplets,
  Flame,
  User,
  MapPin,
  Gauge,
  DollarSign,
  Calendar,
  Loader2,
  AlertCircle,
  Cable,
  ChevronDown,
  Power,
  FileText,
  Activity,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
} from "lucide-react";
import { connectionsApi } from "@/lib/api/connections";
import { ServiceConnection, ConnectionStatus } from "@/types/connection";
import { useToast } from "@/components/ui/toast";

export default function ConnectionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [connection, setConnection] = useState<ServiceConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [showStatusDropdown, setShowStatusDropdown] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);

  const connectionId = Number(params.id);

  const fetchConnection = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await connectionsApi.getById(connectionId);

      if (response.success && response.data) {
        setConnection(response.data);
      } else {
        setError(response.error || "Failed to fetch connection");
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch connection";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connectionId]);

  useEffect(() => {
    if (connectionId) {
      fetchConnection();
    }
  }, [connectionId, fetchConnection]);

  const handleStatusChange = async (newStatus: ConnectionStatus) => {
    if (!connection) return;

    const confirmMessage =
      newStatus === ConnectionStatus.DISCONNECTED
        ? "Are you sure you want to disconnect this connection? This will mark it as disconnected."
        : `Are you sure you want to change the status to ${newStatus}?`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setUpdatingStatus(true);
      setShowStatusDropdown(false);
      const response = await connectionsApi.updateStatus(
        connectionId,
        newStatus
      );

      if (response.success) {
        addToast(
          "success",
          "Status Updated",
          `Connection status changed to ${newStatus}`
        );
        fetchConnection();
      } else {
        addToast(
          "error",
          "Update Failed",
          response.error || "Failed to update status"
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update status";
      addToast("error", "Update Failed", errorMessage);
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleDisconnect = async () => {
    if (!connection) return;

    if (
      !confirm(
        "Are you sure you want to disconnect this service connection? This action will mark the connection as DISCONNECTED."
      )
    ) {
      return;
    }

    try {
      setDisconnecting(true);
      const response = await connectionsApi.delete(connectionId);

      if (response.success) {
        addToast(
          "success",
          "Connection Disconnected",
          "Service connection has been disconnected successfully"
        );
        router.push("/dashboard/connections");
      } else {
        addToast(
          "error",
          "Disconnect Failed",
          response.error || "Failed to disconnect"
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to disconnect";
      addToast("error", "Disconnect Failed", errorMessage);
    } finally {
      setDisconnecting(false);
    }
  };

  const getStatusBadge = (status: ConnectionStatus) => {
    const config = {
      [ConnectionStatus.ACTIVE]: {
        color: "bg-green-100 text-green-800 border-green-200",
        icon: <CheckCircle className="h-4 w-4" />,
      },
      [ConnectionStatus.INACTIVE]: {
        color: "bg-gray-100 text-gray-800 border-gray-200",
        icon: <XCircle className="h-4 w-4" />,
      },
      [ConnectionStatus.SUSPENDED]: {
        color: "bg-yellow-100 text-yellow-800 border-yellow-200",
        icon: <AlertTriangle className="h-4 w-4" />,
      },
      [ConnectionStatus.DISCONNECTED]: {
        color: "bg-red-100 text-red-800 border-red-200",
        icon: <Power className="h-4 w-4" />,
      },
      [ConnectionStatus.PENDING]: {
        color: "bg-blue-100 text-blue-800 border-blue-200",
        icon: <Clock className="h-4 w-4" />,
      },
    };

    const statusConfig = config[status] || config[ConnectionStatus.PENDING];

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm font-semibold rounded-full border ${statusConfig.color}`}
      >
        {statusConfig.icon}
        {status}
      </span>
    );
  };

  const getUtilityIcon = (utilityName?: string) => {
    switch (utilityName?.toUpperCase()) {
      case "ELECTRICITY":
        return <Zap className="h-6 w-6 text-yellow-500" />;
      case "WATER":
        return <Droplets className="h-6 w-6 text-blue-500" />;
      case "GAS":
        return <Flame className="h-6 w-6 text-orange-500" />;
      default:
        return <Cable className="h-6 w-6 text-gray-500" />;
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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">
          Loading connection details...
        </span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Connection
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/connections"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Connections
          </Link>
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <Cable className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Connection Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The connection you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dashboard/connections"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Connections
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/connections"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div className="flex items-center gap-3">
            <div
              className={`p-3 rounded-lg border ${getUtilityBadgeColor(
                connection.utilityType?.name
              )}`}
            >
              {getUtilityIcon(connection.utilityType?.name)}
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Connection #{connection.connectionId}
              </h1>
              <p className="text-gray-600">
                {connection.utilityType?.name || "Unknown"} Service Connection
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href={`/dashboard/connections/${connection.connectionId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>

          {/* Status Change Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowStatusDropdown(!showStatusDropdown)}
              disabled={updatingStatus}
              className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              {updatingStatus ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Activity className="h-4 w-4" />
              )}
              Change Status
              <ChevronDown className="h-4 w-4" />
            </button>
            {showStatusDropdown && (
              <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
                <div className="py-1">
                  {Object.values(ConnectionStatus).map((status) => (
                    <button
                      key={status}
                      onClick={() => handleStatusChange(status)}
                      disabled={status === connection.connectionStatus}
                      className={`w-full text-left px-4 py-2 text-sm hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed ${
                        status === connection.connectionStatus
                          ? "bg-gray-50 font-medium"
                          : ""
                      }`}
                    >
                      <span
                        className={`inline-block w-2 h-2 rounded-full mr-2 ${
                          status === ConnectionStatus.ACTIVE
                            ? "bg-green-500"
                            : status === ConnectionStatus.INACTIVE
                            ? "bg-gray-500"
                            : status === ConnectionStatus.SUSPENDED
                            ? "bg-yellow-500"
                            : status === ConnectionStatus.DISCONNECTED
                            ? "bg-red-500"
                            : "bg-blue-500"
                        }`}
                      />
                      {status}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <button
            onClick={handleDisconnect}
            disabled={
              disconnecting ||
              connection.connectionStatus === ConnectionStatus.DISCONNECTED
            }
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {disconnecting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Power className="h-4 w-4" />
            )}
            Disconnect
          </button>
        </div>
      </div>

      {/* Status Banner */}
      <div
        className={`p-4 rounded-lg border ${
          connection.connectionStatus === ConnectionStatus.ACTIVE
            ? "bg-green-50 border-green-200"
            : connection.connectionStatus === ConnectionStatus.PENDING
            ? "bg-blue-50 border-blue-200"
            : connection.connectionStatus === ConnectionStatus.SUSPENDED
            ? "bg-yellow-50 border-yellow-200"
            : connection.connectionStatus === ConnectionStatus.DISCONNECTED
            ? "bg-red-50 border-red-200"
            : "bg-gray-50 border-gray-200"
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-700">
              Current Status:
            </span>
            {getStatusBadge(connection.connectionStatus)}
          </div>
          <div className="flex items-center gap-4">
            <Link
              href={`/dashboard/billing?connectionId=${connection.connectionId}`}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
            >
              <FileText className="h-4 w-4" />
              View Billing History
            </Link>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Connection Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Cable className="h-5 w-5 text-gray-400" />
              Connection Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">Connection ID</label>
                <p className="font-medium text-gray-900">
                  #{connection.connectionId}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Status</label>
                <p className="mt-1">
                  {getStatusBadge(connection.connectionStatus)}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Utility Type</label>
                <div
                  className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border mt-1 ${getUtilityBadgeColor(
                    connection.utilityType?.name
                  )}`}
                >
                  {getUtilityIcon(connection.utilityType?.name)}
                  <span className="font-medium">
                    {connection.utilityType?.name || "Unknown"}
                  </span>
                </div>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Connection Address ID
                </label>
                <p className="font-medium text-gray-900">
                  #{connection.connectionAddressId}
                </p>
              </div>
            </div>
          </div>

          {/* Customer Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Customer Information
            </h2>
            {connection.customer ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">Customer Name</label>
                  <p className="font-medium text-gray-900">
                    {connection.customer.fullName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Customer ID</label>
                  <p>
                    <Link
                      href={`/dashboard/customers/${connection.customer.customerId}`}
                      className="text-blue-600 hover:text-blue-800 font-medium"
                    >
                      #{connection.customer.customerId}
                    </Link>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Customer Type</label>
                  <p>
                    <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                      {connection.customer.customerType}
                    </span>
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Email</label>
                  <p className="font-medium text-gray-900">
                    {connection.customer.email || "-"}
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">
                Customer information not available
              </p>
            )}
          </div>

          {/* Meter Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Gauge className="h-5 w-5 text-gray-400" />
                Meter Information
              </h2>
              {!connection.meter && (
                <Link
                  href={`/dashboard/connections/${connection.connectionId}/assign-meter`}
                  className="text-sm text-blue-600 hover:text-blue-800"
                >
                  Assign Meter
                </Link>
              )}
            </div>
            {connection.meter ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm text-gray-500">
                    Meter Serial Number
                  </label>
                  <p className="font-medium text-gray-900">
                    {connection.meter.meterSerialNo}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">
                    Installation Date
                  </label>
                  <p className="font-medium text-gray-900">
                    {formatDate(connection.meter.installationDate)}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Smart Meter</label>
                  <p>
                    {connection.meter.isSmartMeter ? (
                      <span className="inline-flex items-center gap-1 text-green-600 font-medium">
                        <CheckCircle className="h-4 w-4" />
                        Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-gray-600 font-medium">
                        <XCircle className="h-4 w-4" />
                        No
                      </span>
                    )}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Meter Status</label>
                  <p>
                    <span
                      className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        connection.meter.status === "ACTIVE"
                          ? "bg-green-100 text-green-800"
                          : connection.meter.status === "FAULTY"
                          ? "bg-red-100 text-red-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {connection.meter.status}
                    </span>
                  </p>
                </div>
                <div className="col-span-2">
                  <Link
                    href={`/dashboard/readings?meterId=${connection.meter.meterId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <Activity className="h-4 w-4" />
                    View Meter Readings
                  </Link>
                </div>
              </div>
            ) : (
              <div className="text-center py-6 bg-gray-50 rounded-lg">
                <Gauge className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                <p className="text-gray-500 mb-2">
                  No meter assigned to this connection
                </p>
                <Link
                  href={`/dashboard/connections/${connection.connectionId}/assign-meter`}
                  className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                >
                  Assign a Meter
                </Link>
              </div>
            )}
          </div>

          {/* Address Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Address Information
            </h2>
            {connection.connectionAddress ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="text-sm text-gray-500">Full Address</label>
                  <p className="font-medium text-gray-900">
                    {connection.connectionAddress.line1}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">City</label>
                  <p className="font-medium text-gray-900">
                    {connection.connectionAddress.city}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Postal Code</label>
                  <p className="font-medium text-gray-900">
                    {connection.connectionAddress.postalCode}
                  </p>
                </div>
                {connection.connectionAddress.geoArea && (
                  <div className="col-span-2">
                    <label className="text-sm text-gray-500">
                      Geographic Area
                    </label>
                    <p className="font-medium text-gray-900">
                      {connection.connectionAddress.geoArea.areaName} (
                      {connection.connectionAddress.geoArea.areaCode})
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <p className="text-gray-500">Address information not available</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Tariff Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-gray-400" />
              Tariff Information
            </h2>
            {connection.tariffCategory ? (
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Category Name</label>
                  <p className="font-medium text-gray-900">
                    {connection.tariffCategory.categoryName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Tariff Code</label>
                  <p className="font-medium text-gray-900">
                    {connection.tariffCategory.categoryCode}
                  </p>
                </div>
                {connection.tariffCategory.description && (
                  <div>
                    <label className="text-sm text-gray-500">Description</label>
                    <p className="text-sm text-gray-700">
                      {connection.tariffCategory.description}
                    </p>
                  </div>
                )}
                <div className="pt-2">
                  <Link
                    href={`/dashboard/tariffs/${connection.tariffCategory.tariffCategoryId}`}
                    className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    View Tariff Details
                  </Link>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">Tariff information not available</p>
            )}
          </div>

          {/* Network Node */}
          {connection.networkNode && (
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <Activity className="h-5 w-5 text-gray-400" />
                Network Node
              </h2>
              <div className="space-y-3">
                <div>
                  <label className="text-sm text-gray-500">Node Name</label>
                  <p className="font-medium text-gray-900">
                    {connection.networkNode.nodeName}
                  </p>
                </div>
                <div>
                  <label className="text-sm text-gray-500">Node Type</label>
                  <p className="font-medium text-gray-900">
                    {connection.networkNode.nodeType}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Quick Actions
            </h2>
            <div className="space-y-2">
              <Link
                href={`/dashboard/connections/${connection.connectionId}/edit`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <Pencil className="h-4 w-4" />
                Edit Connection
              </Link>
              {!connection.meter && (
                <Link
                  href={`/dashboard/connections/${connection.connectionId}/assign-meter`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Gauge className="h-4 w-4" />
                  Assign Meter
                </Link>
              )}
              <Link
                href={`/dashboard/billing?connectionId=${connection.connectionId}`}
                className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
              >
                <FileText className="h-4 w-4" />
                Billing History
              </Link>
              {connection.meter && (
                <Link
                  href={`/dashboard/readings?meterId=${connection.meter.meterId}`}
                  className="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <Activity className="h-4 w-4" />
                  Meter Readings
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

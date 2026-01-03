"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import {
  ArrowLeft,
  Loader2,
  Save,
  Zap,
  Droplets,
  Flame,
  User,
  MapPin,
  Gauge,
  Network,
  Cable,
  AlertCircle,
  Activity,
} from "lucide-react";
import { connectionsApi } from "@/lib/api/connections";
import { lookupApi, GeoArea } from "@/lib/api/lookup";
import {
  ServiceConnection,
  UpdateConnectionDto,
  UtilityTypeDetails,
  TariffCategory,
  Meter,
  NetworkNode,
  ConnectionStatus,
} from "@/types/connection";
import { useToast } from "@/components/ui/toast";

interface FormData {
  tariffCategoryId: number | null;
  meterId: number | null;
  nodeId: number | null;
  connectionStatus: ConnectionStatus;
  connectionAddress: {
    line1: string;
    city: string;
    postalCode: string;
    geoAreaId: number | null;
  };
}

export default function EditConnectionPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const connectionId = Number(params.id);

  const [connection, setConnection] = useState<ServiceConnection | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Lookup data
  const [tariffCategories, setTariffCategories] = useState<TariffCategory[]>(
    [],
  );
  const [availableMeters, setAvailableMeters] = useState<Meter[]>([]);
  const [geoAreas, setGeoAreas] = useState<GeoArea[]>([]);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);

  const {
    register,
    handleSubmit,
    control,
    reset,
    formState: { errors, isDirty },
  } = useForm<FormData>({
    defaultValues: {
      tariffCategoryId: null,
      meterId: null,
      nodeId: null,
      connectionStatus: ConnectionStatus.PENDING,
      connectionAddress: {
        line1: "",
        city: "",
        postalCode: "",
        geoAreaId: null,
      },
    },
  });

  // Fetch connection and lookup data
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [connectionRes, geoAreasRes] = await Promise.all([
        connectionsApi.getById(connectionId),
        lookupApi.getGeoAreas(),
      ]);

      if (!connectionRes.success || !connectionRes.data) {
        setError(connectionRes.error || "Failed to fetch connection");
        return;
      }

      const conn = connectionRes.data;
      setConnection(conn);

      if (geoAreasRes.success && geoAreasRes.data) {
        setGeoAreas(geoAreasRes.data);
      }

      // Fetch tariff categories, meters, and nodes based on utility type
      const [tariffRes, metersRes, nodesRes] = await Promise.all([
        lookupApi.getTariffCategories(conn.utilityTypeId),
        lookupApi.getAvailableMeters(conn.utilityTypeId),
        lookupApi.getNetworkNodes(conn.utilityTypeId),
      ]);

      if (tariffRes.success && tariffRes.data) {
        setTariffCategories(tariffRes.data);
      }

      if (metersRes.success && metersRes.data) {
        // Include currently assigned meter in the list
        const meters = metersRes.data;
        if (
          conn.meter &&
          !meters.find((m) => m.meterId === conn.meter?.meterId)
        ) {
          meters.unshift(conn.meter);
        }
        setAvailableMeters(meters);
      }

      if (nodesRes.success && nodesRes.data) {
        setNetworkNodes(nodesRes.data);
      }

      // Set form values with existing data
      reset({
        tariffCategoryId: conn.tariffCategoryId,
        meterId: conn.meterId,
        nodeId: conn.nodeId,
        connectionStatus: conn.connectionStatus,
        connectionAddress: {
          line1: conn.connectionAddress?.line1 || "",
          city: conn.connectionAddress?.city || "",
          postalCode: conn.connectionAddress?.postalCode || "",
          geoAreaId: conn.connectionAddress?.geoAreaId || null,
        },
      });
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to fetch connection";
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [connectionId, reset]);

  useEffect(() => {
    if (connectionId) {
      fetchData();
    }
  }, [connectionId, fetchData]);

  const getUtilityIcon = (utilityName?: string) => {
    switch (utilityName?.toUpperCase()) {
      case "ELECTRICITY":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "WATER":
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case "GAS":
        return <Flame className="h-5 w-5 text-orange-500" />;
      default:
        return <Cable className="h-5 w-5 text-gray-500" />;
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

  const onSubmit = async (data: FormData) => {
    if (!data.tariffCategoryId) {
      addToast("error", "Validation Error", "Please select a tariff category");
      return;
    }

    try {
      setSubmitting(true);

      const updateDto: UpdateConnectionDto = {
        tariffCategoryId: data.tariffCategoryId,
        connectionStatus: data.connectionStatus,
        connectionAddress: {
          line1: data.connectionAddress.line1,
          city: data.connectionAddress.city,
          postalCode: data.connectionAddress.postalCode,
        },
      };

      if (data.connectionAddress.geoAreaId) {
        updateDto.connectionAddress!.geoAreaId =
          data.connectionAddress.geoAreaId;
      }

      if (data.meterId) {
        updateDto.meterId = data.meterId;
      }

      if (data.nodeId) {
        updateDto.nodeId = data.nodeId;
      }

      const response = await connectionsApi.update(connectionId, updateDto);

      if (response.success) {
        addToast(
          "success",
          "Connection Updated",
          `Service connection #${connectionId} has been updated successfully`,
        );
        router.push(`/dashboard/connections/${connectionId}`);
      } else {
        addToast(
          "error",
          "Update Failed",
          response.error || "Failed to update connection",
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to update connection";
      addToast("error", "Update Failed", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading connection data...</span>
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
            The connection you&apos;re trying to edit doesn&apos;t exist.
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
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/connections/${connectionId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Edit Connection #{connectionId}
          </h1>
          <p className="text-gray-600">Update service connection details</p>
        </div>
      </div>

      {/* Read-Only Information */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h2 className="text-sm font-medium text-gray-500 mb-4 uppercase tracking-wide">
          Read-Only Information
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Customer Info */}
          <div className="flex items-start gap-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <User className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Customer</p>
              <p className="font-medium text-gray-900">
                {connection.customer?.fullName || "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                {connection.customer?.customerType} • ID: #
                {connection.customerId}
              </p>
            </div>
          </div>

          {/* Utility Type */}
          <div className="flex items-start gap-3">
            <div
              className={`p-2 rounded-full border ${getUtilityBadgeColor(connection.utilityType?.name)}`}
            >
              {getUtilityIcon(connection.utilityType?.name)}
            </div>
            <div>
              <p className="text-sm text-gray-500">Utility Type</p>
              <p className="font-medium text-gray-900">
                {connection.utilityType?.name || "Unknown"}
              </p>
              <p className="text-sm text-gray-500">
                Unit: {connection.utilityType?.unit || "N/A"}
              </p>
            </div>
          </div>
        </div>
        <p className="mt-4 text-xs text-gray-500">
          Customer and utility type cannot be changed. Create a new connection
          if needed.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Connection Status */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Activity className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Connection Status
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Status <span className="text-red-500">*</span>
            </label>
            <Controller
              name="connectionStatus"
              control={control}
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                  {Object.values(ConnectionStatus).map((status) => (
                    <label
                      key={status}
                      className={`flex items-center justify-center p-3 border-2 rounded-lg cursor-pointer transition-all ${
                        field.value === status
                          ? "border-blue-500 bg-blue-50"
                          : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="radio"
                        {...field}
                        value={status}
                        checked={field.value === status}
                        onChange={() => field.onChange(status)}
                        className="sr-only"
                      />
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
                      <span className="text-sm font-medium">{status}</span>
                    </label>
                  ))}
                </div>
              )}
            />
            {errors.connectionStatus && (
              <p className="mt-1 text-sm text-red-500">
                {errors.connectionStatus.message}
              </p>
            )}
          </div>
        </div>

        {/* Tariff Category */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Tariff Category
            </h2>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tariff Category <span className="text-red-500">*</span>
            </label>
            <Controller
              name="tariffCategoryId"
              control={control}
              rules={{ required: "Tariff category is required" }}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                    errors.tariffCategoryId
                      ? "border-red-500"
                      : "border-gray-300"
                  }`}
                >
                  <option value="">-- Select a tariff category --</option>
                  {tariffCategories.map((tc) => (
                    <option
                      key={tc.tariffCategoryId}
                      value={tc.tariffCategoryId}
                    >
                      {tc.categoryCode} - {tc.categoryName}
                      {tc.description ? ` (${tc.description})` : ""}
                    </option>
                  ))}
                </select>
              )}
            />
            {errors.tariffCategoryId && (
              <p className="mt-1 text-sm text-red-500">
                {errors.tariffCategoryId.message}
              </p>
            )}
          </div>
        </div>

        {/* Meter Assignment */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gauge className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Meter Assignment
            </h2>
            <span className="text-sm text-gray-500">(Optional)</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Assigned Meter
            </label>
            <Controller
              name="meterId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- No meter assigned --</option>
                  {availableMeters.map((meter) => (
                    <option key={meter.meterId} value={meter.meterId}>
                      {meter.meterSerialNo}{" "}
                      {meter.isSmartMeter ? "(Smart)" : "(Standard)"}
                      {meter.meterId === connection.meterId ? " - Current" : ""}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="mt-1 text-sm text-gray-500">
              Select a meter to assign or leave empty to remove meter assignment
            </p>
          </div>
        </div>

        {/* Connection Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <MapPin className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Connection Address
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Address Line 1 */}
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("connectionAddress.line1", {
                  required: "Address is required",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.connectionAddress?.line1
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="123 Main Street, Building A"
              />
              {errors.connectionAddress?.line1 && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.connectionAddress.line1.message}
                </p>
              )}
            </div>

            {/* City */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                City <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("connectionAddress.city", {
                  required: "City is required",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.connectionAddress?.city
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="Colombo"
              />
              {errors.connectionAddress?.city && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.connectionAddress.city.message}
                </p>
              )}
            </div>

            {/* Postal Code */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("connectionAddress.postalCode", {
                  required: "Postal code is required",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.connectionAddress?.postalCode
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="10100"
              />
              {errors.connectionAddress?.postalCode && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.connectionAddress.postalCode.message}
                </p>
              )}
            </div>

            {/* Geographic Area */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Geographic Area
              </label>
              <Controller
                name="connectionAddress.geoAreaId"
                control={control}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null,
                      )
                    }
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">-- Select area (optional) --</option>
                    {geoAreas.map((area) => (
                      <option key={area.geoAreaId} value={area.geoAreaId}>
                        {area.name} ({area.type})
                      </option>
                    ))}
                  </select>
                )}
              />
            </div>
          </div>
        </div>

        {/* Network Node */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Network className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Network Node
            </h2>
            <span className="text-sm text-gray-500">(Optional)</span>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Distribution Network Node
            </label>
            <Controller
              name="nodeId"
              control={control}
              render={({ field }) => (
                <select
                  {...field}
                  value={field.value || ""}
                  onChange={(e) =>
                    field.onChange(
                      e.target.value ? parseInt(e.target.value) : null,
                    )
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- No network node --</option>
                  {networkNodes.map((node) => (
                    <option key={node.nodeId} value={node.nodeId}>
                      {node.nodeName} ({node.nodeType})
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="mt-1 text-sm text-gray-500">
              Connect this service to a specific distribution network node
            </p>
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/dashboard/connections/${connectionId}`}
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting || !isDirty}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Save Changes
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

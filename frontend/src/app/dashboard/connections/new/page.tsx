"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, Controller } from "react-hook-form";
import {
  ArrowLeft,
  Loader2,
  Save,
  Search,
  Zap,
  Droplets,
  Flame,
  User,
  MapPin,
  Gauge,
  Network,
} from "lucide-react";
import { connectionsApi } from "@/lib/api/connections";
import { lookupApi, GeoArea, CustomerSummary } from "@/lib/api/lookup";
import {
  CreateConnectionDto,
  UtilityTypeDetails,
  TariffCategory,
  Meter,
  NetworkNode,
} from "@/types/connection";
import { useToast } from "@/components/ui/toast";

interface FormData {
  customerId: number | null;
  utilityTypeId: number | null;
  tariffCategoryId: number | null;
  meterId: number | null;
  nodeId: number | null;
  connectionAddress: {
    line1: string;
    city: string;
    postalCode: string;
    geoAreaId: number | null;
  };
}

export default function NewConnectionPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [submitting, setSubmitting] = useState(false);
  const [loading, setLoading] = useState(true);

  // Lookup data
  const [customers, setCustomers] = useState<CustomerSummary[]>([]);
  const [utilityTypes, setUtilityTypes] = useState<UtilityTypeDetails[]>([]);
  const [tariffCategories, setTariffCategories] = useState<TariffCategory[]>(
    []
  );
  const [availableMeters, setAvailableMeters] = useState<Meter[]>([]);
  const [geoAreas, setGeoAreas] = useState<GeoArea[]>([]);
  const [networkNodes, setNetworkNodes] = useState<NetworkNode[]>([]);

  // Search state
  const [customerSearch, setCustomerSearch] = useState("");
  const [searchingCustomers, setSearchingCustomers] = useState(false);

  // Selected customer details
  const [selectedCustomer, setSelectedCustomer] =
    useState<CustomerSummary | null>(null);

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      customerId: null,
      utilityTypeId: null,
      tariffCategoryId: null,
      meterId: null,
      nodeId: null,
      connectionAddress: {
        line1: "",
        city: "",
        postalCode: "",
        geoAreaId: null,
      },
    },
  });

  const selectedUtilityTypeId = watch("utilityTypeId");

  // Fetch initial data
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        const [utilityTypesRes, geoAreasRes, customersRes] = await Promise.all([
          lookupApi.getUtilityTypes(),
          lookupApi.getGeoAreas(),
          lookupApi.getCustomers(),
        ]);

        if (utilityTypesRes.success && utilityTypesRes.data) {
          setUtilityTypes(utilityTypesRes.data);
        }
        if (geoAreasRes.success && geoAreasRes.data) {
          setGeoAreas(geoAreasRes.data);
        }
        if (customersRes.success && customersRes.data) {
          setCustomers(customersRes.data);
        }
      } catch (error) {
        console.error("Failed to fetch initial data:", error);
        addToast("error", "Error", "Failed to load form data");
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [addToast]);

  // Fetch tariff categories when utility type changes
  useEffect(() => {
    const fetchTariffCategories = async () => {
      if (!selectedUtilityTypeId) {
        setTariffCategories([]);
        return;
      }

      try {
        const response = await lookupApi.getTariffCategories(
          selectedUtilityTypeId
        );
        if (response.success && response.data) {
          setTariffCategories(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch tariff categories:", error);
      }
    };

    fetchTariffCategories();
    // Reset tariff category when utility type changes
    setValue("tariffCategoryId", null);
  }, [selectedUtilityTypeId, setValue]);

  // Fetch available meters when utility type changes
  useEffect(() => {
    const fetchAvailableMeters = async () => {
      if (!selectedUtilityTypeId) {
        setAvailableMeters([]);
        return;
      }

      try {
        const response = await lookupApi.getAvailableMeters(
          selectedUtilityTypeId
        );
        if (response.success && response.data) {
          setAvailableMeters(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch available meters:", error);
      }
    };

    fetchAvailableMeters();
    // Reset meter when utility type changes
    setValue("meterId", null);
  }, [selectedUtilityTypeId, setValue]);

  // Fetch network nodes when utility type changes
  useEffect(() => {
    const fetchNetworkNodes = async () => {
      if (!selectedUtilityTypeId) {
        setNetworkNodes([]);
        return;
      }

      try {
        const response = await lookupApi.getNetworkNodes(selectedUtilityTypeId);
        if (response.success && response.data) {
          setNetworkNodes(response.data);
        }
      } catch (error) {
        console.error("Failed to fetch network nodes:", error);
      }
    };

    fetchNetworkNodes();
    // Reset node when utility type changes
    setValue("nodeId", null);
  }, [selectedUtilityTypeId, setValue]);

  // Search customers
  const searchCustomers = useCallback(async (search: string) => {
    if (!search || search.length < 2) {
      const response = await lookupApi.getCustomers();
      if (response.success && response.data) {
        setCustomers(response.data);
      }
      return;
    }

    setSearchingCustomers(true);
    try {
      const response = await lookupApi.getCustomers(search);
      if (response.success && response.data) {
        setCustomers(response.data);
      }
    } catch (error) {
      console.error("Failed to search customers:", error);
    } finally {
      setSearchingCustomers(false);
    }
  }, []);

  // Debounce customer search
  useEffect(() => {
    const timer = setTimeout(() => {
      searchCustomers(customerSearch);
    }, 300);

    return () => clearTimeout(timer);
  }, [customerSearch, searchCustomers]);

  const handleCustomerSelect = (customerId: number | null) => {
    setValue("customerId", customerId);
    const customer = customers.find((c) => c.customerId === customerId) || null;
    setSelectedCustomer(customer);
  };

  const getUtilityIcon = (utilityName?: string) => {
    switch (utilityName?.toUpperCase()) {
      case "ELECTRICITY":
        return <Zap className="h-5 w-5 text-yellow-500" />;
      case "WATER":
        return <Droplets className="h-5 w-5 text-blue-500" />;
      case "GAS":
        return <Flame className="h-5 w-5 text-orange-500" />;
      default:
        return null;
    }
  };

  const onSubmit = async (data: FormData) => {
    if (!data.customerId) {
      addToast("error", "Validation Error", "Please select a customer");
      return;
    }
    if (!data.utilityTypeId) {
      addToast("error", "Validation Error", "Please select a utility type");
      return;
    }
    if (!data.tariffCategoryId) {
      addToast("error", "Validation Error", "Please select a tariff category");
      return;
    }
    if (!data.connectionAddress.geoAreaId) {
      addToast("error", "Validation Error", "Please select a geographic area");
      return;
    }

    try {
      setSubmitting(true);

      const createDto: CreateConnectionDto = {
        customerId: data.customerId,
        utilityTypeId: data.utilityTypeId,
        tariffCategoryId: data.tariffCategoryId,
        connectionAddress: {
          line1: data.connectionAddress.line1,
          city: data.connectionAddress.city,
          postalCode: data.connectionAddress.postalCode,
          geoAreaId: data.connectionAddress.geoAreaId,
        },
      };

      if (data.meterId) {
        createDto.meterId = data.meterId;
      }

      if (data.nodeId) {
        createDto.nodeId = data.nodeId;
      }

      const response = await connectionsApi.create(createDto);

      if (response.success) {
        addToast(
          "success",
          "Connection Created",
          `Service connection #${response.data?.connectionId} has been created successfully`
        );
        router.push("/dashboard/connections");
      } else {
        addToast(
          "error",
          "Creation Failed",
          response.error || "Failed to create connection"
        );
      }
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "Failed to create connection";
      addToast("error", "Creation Failed", errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading form data...</span>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/connections"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Add New Connection
          </h1>
          <p className="text-gray-600">
            Create a new service connection for a customer
          </p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Customer Selection */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <User className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Customer Selection
            </h2>
          </div>

          <div className="space-y-4">
            {/* Customer Search */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Search Customer <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  value={customerSearch}
                  onChange={(e) => setCustomerSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Search by name, email, or ID..."
                />
                {searchingCustomers && (
                  <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 animate-spin text-gray-400" />
                )}
              </div>
            </div>

            {/* Customer Dropdown */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Select Customer <span className="text-red-500">*</span>
              </label>
              <Controller
                name="customerId"
                control={control}
                rules={{ required: "Customer is required" }}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value || ""}
                    onChange={(e) => {
                      const value = e.target.value
                        ? parseInt(e.target.value)
                        : null;
                      handleCustomerSelect(value);
                    }}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.customerId ? "border-red-500" : "border-gray-300"
                    }`}
                  >
                    <option value="">-- Select a customer --</option>
                    {customers.map((customer) => (
                      <option
                        key={customer.customerId}
                        value={customer.customerId}
                      >
                        {customer.fullName} ({customer.customerType}) -{" "}
                        {customer.identityRef}
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.customerId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.customerId.message}
                </p>
              )}
            </div>

            {/* Selected Customer Info */}
            {selectedCustomer && (
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-blue-100 rounded-full">
                    <User className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {selectedCustomer.fullName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {selectedCustomer.email || "No email"} •{" "}
                      {selectedCustomer.customerType}
                    </p>
                    <p className="text-xs text-gray-500">
                      ID: {selectedCustomer.identityRef}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Connection Details */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center gap-2 mb-4">
            <Zap className="h-5 w-5 text-gray-500" />
            <h2 className="text-lg font-semibold text-gray-900">
              Connection Details
            </h2>
          </div>

          <div className="space-y-4">
            {/* Utility Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Utility Type <span className="text-red-500">*</span>
              </label>
              <Controller
                name="utilityTypeId"
                control={control}
                rules={{ required: "Utility type is required" }}
                render={({ field }) => (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {utilityTypes.map((ut) => (
                      <label
                        key={ut.utilityTypeId}
                        className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                          field.value === ut.utilityTypeId
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300"
                        }`}
                      >
                        <input
                          type="radio"
                          {...field}
                          value={ut.utilityTypeId}
                          checked={field.value === ut.utilityTypeId}
                          onChange={() => field.onChange(ut.utilityTypeId)}
                          className="sr-only"
                        />
                        {getUtilityIcon(ut.name)}
                        <span className="font-medium">{ut.name}</span>
                      </label>
                    ))}
                  </div>
                )}
              />
              {errors.utilityTypeId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.utilityTypeId.message}
                </p>
              )}
            </div>

            {/* Tariff Category */}
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
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    disabled={!selectedUtilityTypeId}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed ${
                      errors.tariffCategoryId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">
                      {selectedUtilityTypeId
                        ? "-- Select a tariff category --"
                        : "-- Select utility type first --"}
                    </option>
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
        </div>

        {/* Meter Assignment (Optional) */}
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
              Available Meter
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
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={!selectedUtilityTypeId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedUtilityTypeId
                      ? "-- Select a meter (optional) --"
                      : "-- Select utility type first --"}
                  </option>
                  {availableMeters.map((meter) => (
                    <option key={meter.meterId} value={meter.meterId}>
                      {meter.meterSerialNo}{" "}
                      {meter.isSmartMeter ? "(Smart)" : "(Standard)"}
                    </option>
                  ))}
                </select>
              )}
            />
            <p className="mt-1 text-sm text-gray-500">
              Only unassigned meters for the selected utility type are shown
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
                Geographic Area <span className="text-red-500">*</span>
              </label>
              <Controller
                name="connectionAddress.geoAreaId"
                control={control}
                rules={{ required: "Geographic area is required" }}
                render={({ field }) => (
                  <select
                    {...field}
                    value={field.value || ""}
                    onChange={(e) =>
                      field.onChange(
                        e.target.value ? parseInt(e.target.value) : null
                      )
                    }
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                      errors.connectionAddress?.geoAreaId
                        ? "border-red-500"
                        : "border-gray-300"
                    }`}
                  >
                    <option value="">-- Select geographic area --</option>
                    {geoAreas.map((area) => (
                      <option key={area.geoAreaId} value={area.geoAreaId}>
                        {area.name} ({area.type})
                      </option>
                    ))}
                  </select>
                )}
              />
              {errors.connectionAddress?.geoAreaId && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.connectionAddress.geoAreaId.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Network Node (Optional) */}
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
                      e.target.value ? parseInt(e.target.value) : null
                    )
                  }
                  disabled={!selectedUtilityTypeId}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                >
                  <option value="">
                    {selectedUtilityTypeId
                      ? "-- Select a network node (optional) --"
                      : "-- Select utility type first --"}
                  </option>
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
            href="/dashboard/connections"
            className="px-6 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Save className="h-4 w-4" />
                Create Connection
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}

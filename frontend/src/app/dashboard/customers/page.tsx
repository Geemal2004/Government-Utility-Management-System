"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  Plus,
  Eye,
  Pencil,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Users,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { customersApi, CustomersQueryParams } from "@/lib/api/customers";
import { Customer, CustomerType, PaginatedResponse } from "@/types/customer";
import { useToast } from "@/components/ui/toast";

export default function CustomersPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState<PaginatedResponse<Customer>["meta"] | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<number | null>(null);

  // Filters
  const [search, setSearch] = useState("");
  const [customerType, setCustomerType] = useState<string>("");
  const [page, setPage] = useState(1);
  const [limit] = useState(10);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params: CustomersQueryParams = {
        page,
        limit,
        sortBy: "customerId",
        order: "DESC",
      };

      if (search) params.search = search;
      if (customerType) params.customerType = customerType;

      const response = await customersApi.getAll(params);

      console.log("Customers API response:", response);
      console.log("Response success:", response.success);
      console.log("Response data:", response.data);

      if (response.success && response.data) {
        // Response.data is PaginatedResponse<Customer> with items and meta
        const paginatedData = response.data as any;

        let items: Customer[] = [];
        let metaData = null;

        if (Array.isArray(paginatedData)) {
          // Direct array response
          items = paginatedData;
        } else if (paginatedData.items && Array.isArray(paginatedData.items)) {
          // Standard paginated response
          items = paginatedData.items;
          metaData = paginatedData.meta;
        } else if (paginatedData.data) {
          // Double nested (shouldn't happen but handle it)
          const nested = paginatedData.data;
          if (Array.isArray(nested)) {
            items = nested;
          } else if (nested.items) {
            items = nested.items;
            metaData = nested.meta;
          }
        }

        console.log("Setting customers:", items);
        console.log("Setting meta:", metaData);

        setCustomers(Array.isArray(items) ? items : []);
        setMeta(
          metaData || {
            total: items.length,
            page,
            limit,
            totalPages: 1,
            hasNextPage: false,
            hasPreviousPage: false,
          }
        );
      } else {
        setError(response.error || "Failed to fetch customers");
        setCustomers([]);
      }
    } catch (err: any) {
      console.error("Fetch customers error:", err);
      setError(err.response?.data?.message || "Failed to fetch customers");
      setCustomers([]);
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, customerType]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchCustomers();
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Are you sure you want to delete customer "${name}"?`)) {
      return;
    }

    try {
      setDeleting(id);
      const response = await customersApi.delete(id);

      if (response.success) {
        addToast(
          "success",
          "Customer Deleted",
          `${name} has been deleted successfully`
        );
        fetchCustomers();
      } else {
        addToast("error", "Delete Failed", response.error);
      }
    } catch (err: any) {
      addToast(
        "error",
        "Delete Failed",
        err.response?.data?.message || "Failed to delete customer"
      );
    } finally {
      setDeleting(null);
    }
  };

  const getTypeBadgeColor = (type: CustomerType) => {
    switch (type) {
      case CustomerType.RESIDENTIAL:
        return "bg-blue-100 text-blue-800";
      case CustomerType.COMMERCIAL:
        return "bg-green-100 text-green-800";
      case CustomerType.INDUSTRIAL:
        return "bg-purple-100 text-purple-800";
      case CustomerType.GOVERNMENT:
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Customers</h1>
          <p className="text-gray-600">
            Manage customer accounts and information
          </p>
        </div>
        <Link
          href="/dashboard/customers/new"
          className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white hover:bg-blue-700 transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Customer
        </Link>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <form onSubmit={handleSearch} className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          <select
            value={customerType}
            onChange={(e) => {
              setCustomerType(e.target.value);
              setPage(1);
            }}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="">All Types</option>
            <option value="RESIDENTIAL">Residential</option>
            <option value="COMMERCIAL">Commercial</option>
            <option value="INDUSTRIAL">Industrial</option>
            <option value="GOVERNMENT">Government</option>
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
            onClick={fetchCustomers}
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
          <span className="ml-3 text-gray-600">Loading customers...</span>
        </div>
      ) : !customers || customers.length === 0 ? (
        /* Empty State */
        <div className="bg-white rounded-lg shadow p-8 text-center">
          <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No customers found
          </h3>
          <p className="text-gray-600 mb-4">
            {search || customerType
              ? "Try adjusting your search or filter criteria"
              : "Get started by adding your first customer"}
          </p>
          {!search && !customerType && (
            <Link
              href="/dashboard/customers/new"
              className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-5 w-5" />
              Add Customer
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
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Identity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Registration Date
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {customers.map((customer) => (
                  <tr key={customer.customerId} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      #{customer.customerId}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {customer.fullName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {customer.email || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(
                          customer.customerType
                        )}`}
                      >
                        {customer.customerType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <span className="text-gray-400">
                        {customer.identityType}:
                      </span>{" "}
                      {customer.identityRef}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(customer.registrationDate)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/dashboard/customers/${customer.customerId}`}
                          className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="View"
                        >
                          <Eye className="h-4 w-4" />
                        </Link>
                        <Link
                          href={`/dashboard/customers/${customer.customerId}/edit`}
                          className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Pencil className="h-4 w-4" />
                        </Link>
                        <button
                          onClick={() =>
                            handleDelete(customer.customerId, customer.fullName)
                          }
                          disabled={deleting === customer.customerId}
                          className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50"
                          title="Delete"
                        >
                          {deleting === customer.customerId ? (
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
    </div>
  );
}

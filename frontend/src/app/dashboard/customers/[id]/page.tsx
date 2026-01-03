"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  User,
  Mail,
  Phone,
  MapPin,
  Calendar,
  CreditCard,
  Loader2,
  AlertCircle,
} from "lucide-react";
import { customersApi } from "@/lib/api/customers";
import { Customer, CustomerType } from "@/types/customer";
import { useToast } from "@/components/ui/toast";

export default function CustomerDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const customerId = Number(params.id);

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await customersApi.getById(customerId);

        if (response.success) {
          setCustomer(response.data);
        } else {
          setError(response.error || "Failed to fetch customer");
        }
      } catch (err: any) {
        setError(err.response?.data?.message || "Failed to fetch customer");
      } finally {
        setLoading(false);
      }
    };

    if (customerId) {
      fetchCustomer();
    }
  }, [customerId]);

  const handleDelete = async () => {
    if (!customer) return;

    if (
      !confirm(
        `Are you sure you want to delete customer "${customer.fullName}"? This action cannot be undone.`
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const response = await customersApi.delete(customerId);

      if (response.success) {
        addToast(
          "success",
          "Customer Deleted",
          `${customer.fullName} has been deleted successfully`
        );
        router.push("/dashboard/customers");
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
      setDeleting(false);
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
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading customer details...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-lg font-medium text-red-800 mb-2">
            Error Loading Customer
          </h3>
          <p className="text-red-600 mb-4">{error}</p>
          <Link
            href="/dashboard/customers"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  if (!customer) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6 text-center">
          <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            Customer Not Found
          </h3>
          <p className="text-gray-600 mb-4">
            The customer you&apos;re looking for doesn&apos;t exist.
          </p>
          <Link
            href="/dashboard/customers"
            className="text-blue-600 hover:text-blue-800 underline"
          >
            Back to Customers
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/customers"
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {customer.fullName}
            </h1>
            <p className="text-gray-600">Customer ID: #{customer.customerId}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={`/dashboard/customers/${customer.customerId}/edit`}
            className="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <Pencil className="h-4 w-4" />
            Edit
          </Link>
          <button
            onClick={handleDelete}
            disabled={deleting}
            className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
          >
            {deleting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Trash2 className="h-4 w-4" />
            )}
            Delete
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Info */}
        <div className="lg:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="h-5 w-5 text-gray-400" />
              Personal Information
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-500">First Name</label>
                <p className="font-medium text-gray-900">
                  {customer.firstName}
                </p>
              </div>
              {customer.middleName && (
                <div>
                  <label className="text-sm text-gray-500">Middle Name</label>
                  <p className="font-medium text-gray-900">
                    {customer.middleName}
                  </p>
                </div>
              )}
              <div>
                <label className="text-sm text-gray-500">Last Name</label>
                <p className="font-medium text-gray-900">{customer.lastName}</p>
              </div>
              <div>
                <label className="text-sm text-gray-500">Customer Type</label>
                <p>
                  <span
                    className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getTypeBadgeColor(
                      customer.customerType
                    )}`}
                  >
                    {customer.customerType}
                  </span>
                </p>
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Mail className="h-5 w-5 text-gray-400" />
              Contact Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-sm text-gray-500">Email Address</label>
                <p className="font-medium text-gray-900">
                  {customer.email || "-"}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500 flex items-center gap-1">
                  <Phone className="h-4 w-4" />
                  Phone Numbers
                </label>
                {customer.phoneNumbers && customer.phoneNumbers.length > 0 ? (
                  <div className="flex flex-wrap gap-2 mt-1">
                    {customer.phoneNumbers.map((phone, index) => (
                      <span
                        key={index}
                        className="inline-flex px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm"
                      >
                        {phone}
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No phone numbers</p>
                )}
              </div>
            </div>
          </div>

          {/* Address */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <MapPin className="h-5 w-5 text-gray-400" />
              Address
            </h2>
            {customer.address ? (
              <div className="space-y-2">
                <p className="font-medium text-gray-900">
                  {customer.address.line1}
                </p>
                <p className="text-gray-600">
                  Postal Code: {customer.address.postalCode}
                </p>
              </div>
            ) : (
              <p className="text-gray-500">No address on file</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Identity Information */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-gray-400" />
              Identity
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">Identity Type</label>
                <p className="font-medium text-gray-900">
                  {customer.identityType}
                </p>
              </div>
              <div>
                <label className="text-sm text-gray-500">
                  Identity Reference
                </label>
                <p className="font-medium text-gray-900">
                  {customer.identityRef}
                </p>
              </div>
            </div>
          </div>

          {/* Registration Info */}
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-gray-400" />
              Registration
            </h2>
            <div className="space-y-3">
              <div>
                <label className="text-sm text-gray-500">
                  Registration Date
                </label>
                <p className="font-medium text-gray-900">
                  {formatDate(customer.registrationDate)}
                </p>
              </div>
              {customer.employeeId && (
                <div>
                  <label className="text-sm text-gray-500">Registered By</label>
                  <p className="font-medium text-gray-900">
                    Employee #{customer.employeeId}
                  </p>
                </div>
              )}
              {customer.tariffCategoryId && (
                <div>
                  <label className="text-sm text-gray-500">
                    Tariff Category
                  </label>
                  <p className="font-medium text-gray-900">
                    Category #{customer.tariffCategoryId}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

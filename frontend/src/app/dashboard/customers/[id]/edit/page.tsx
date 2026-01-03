"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { useForm, useFieldArray } from "react-hook-form";
import { ArrowLeft, Plus, Trash2, Loader2, Save } from "lucide-react";
import { customersApi } from "@/lib/api/customers";
import {
  Customer,
  UpdateCustomerDto,
  CustomerType,
  IdentityType,
} from "@/types/customer";
import { useToast } from "@/components/ui/toast";

interface FormData {
  firstName: string;
  middleName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  customerType: CustomerType;
  identityType: IdentityType;
  address: {
    line1: string;
    postalCode: string;
  };
  phoneNumbers: { value: string }[];
}

export default function EditCustomerPage() {
  const params = useParams();
  const router = useRouter();
  const { addToast } = useToast();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const customerId = Number(params.id);

  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    defaultValues: {
      firstName: "",
      middleName: "",
      lastName: "",
      email: "",
      password: "",
      confirmPassword: "",
      customerType: CustomerType.RESIDENTIAL,
      identityType: IdentityType.NIC,
      address: {
        line1: "",
        postalCode: "",
      },
      phoneNumbers: [{ value: "" }],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phoneNumbers",
  });

  const password = watch("password");

  useEffect(() => {
    const fetchCustomer = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await customersApi.getById(customerId);

        if (response.success) {
          const customer = response.data;
          reset({
            firstName: customer.firstName,
            middleName: customer.middleName || "",
            lastName: customer.lastName,
            email: customer.email || "",
            password: "",
            confirmPassword: "",
            customerType: customer.customerType,
            identityType: customer.identityType,
            address: {
              line1: customer.address?.line1 || "",
              postalCode: customer.address?.postalCode || "",
            },
            phoneNumbers:
              customer.phoneNumbers && customer.phoneNumbers.length > 0
                ? customer.phoneNumbers.map((p) => ({ value: p }))
                : [{ value: "" }],
          });
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
  }, [customerId, reset]);

  const onSubmit = async (data: FormData) => {
    try {
      setSubmitting(true);

      const updateDto: UpdateCustomerDto = {
        firstName: data.firstName,
        lastName: data.lastName,
        customerType: data.customerType,
        identityType: data.identityType,
        address: {
          line1: data.address.line1,
          postalCode: data.address.postalCode,
        },
      };

      if (data.middleName) {
        updateDto.middleName = data.middleName;
      }

      if (data.email) {
        updateDto.email = data.email;
      }

      if (data.password) {
        updateDto.password = data.password;
      }

      const phoneNumbers = data.phoneNumbers
        .map((p) => p.value.trim())
        .filter((p) => p.length > 0);

      updateDto.phoneNumbers = phoneNumbers;

      const response = await customersApi.update(customerId, updateDto);

      if (response.success) {
        addToast(
          "success",
          "Customer Updated",
          `${data.firstName} ${data.lastName} has been updated successfully`
        );
        router.push(`/dashboard/customers/${customerId}`);
      } else {
        addToast(
          "error",
          "Update Failed",
          response.error || "Failed to update customer"
        );
      }
    } catch (err: any) {
      addToast(
        "error",
        "Update Failed",
        err.response?.data?.message || "Failed to update customer"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        <span className="ml-3 text-gray-600">Loading customer data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-4xl mx-auto">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
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

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href={`/dashboard/customers/${customerId}`}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Edit Customer</h1>
          <p className="text-gray-600">Update customer information</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* Personal Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Personal Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                First Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("firstName", {
                  required: "First name is required",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.firstName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="John"
              />
              {errors.firstName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.firstName.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Middle Name
              </label>
              <input
                type="text"
                {...register("middleName")}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="William"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Last Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("lastName", { required: "Last name is required" })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.lastName ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="Doe"
              />
              {errors.lastName && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.lastName.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                {...register("email", {
                  pattern: {
                    value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                    message: "Invalid email address",
                  },
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.email ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="john.doe@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.email.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Customer Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("customerType", {
                  required: "Customer type is required",
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="RESIDENTIAL">Residential</option>
                <option value="COMMERCIAL">Commercial</option>
                <option value="INDUSTRIAL">Industrial</option>
                <option value="GOVERNMENT">Government</option>
              </select>
            </div>
          </div>
        </div>

        {/* Identity Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Identity Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identity Type <span className="text-red-500">*</span>
              </label>
              <select
                {...register("identityType", {
                  required: "Identity type is required",
                })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="NIC">NIC (National Identity Card)</option>
                <option value="PASSPORT">Passport</option>
                <option value="DRIVING_LICENSE">Driving License</option>
                <option value="BUSINESS_REG">Business Registration</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Identity Reference
              </label>
              <p className="px-4 py-2 bg-gray-100 rounded-lg text-gray-600">
                Identity reference cannot be changed
              </p>
            </div>
          </div>
        </div>

        {/* Password (Optional) */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Change Password (Optional)
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Leave blank to keep the current password
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                {...register("password", {
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.password ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.password.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                {...register("confirmPassword", {
                  validate: (value) =>
                    !password || value === password || "Passwords do not match",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.confirmPassword ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="••••••••"
              />
              {errors.confirmPassword && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Address</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address Line 1 <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("address.line1", {
                  required: "Address is required",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address?.line1 ? "border-red-500" : "border-gray-300"
                }`}
                placeholder="123 Main Street, Apartment 4B"
              />
              {errors.address?.line1 && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.address.line1.message}
                </p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Postal Code <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("address.postalCode", {
                  required: "Postal code is required",
                })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
                  errors.address?.postalCode
                    ? "border-red-500"
                    : "border-gray-300"
                }`}
                placeholder="10100"
              />
              {errors.address?.postalCode && (
                <p className="mt-1 text-sm text-red-500">
                  {errors.address.postalCode.message}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Phone Numbers */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Phone Numbers
            </h2>
            <button
              type="button"
              onClick={() => append({ value: "" })}
              className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-800"
            >
              <Plus className="h-4 w-4" />
              Add Phone
            </button>
          </div>
          <div className="space-y-3">
            {fields.map((field, index) => (
              <div key={field.id} className="flex items-center gap-2">
                <input
                  type="tel"
                  {...register(`phoneNumbers.${index}.value`)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="+1234567890"
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(index)}
                    className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Actions */}
        <div className="flex items-center justify-end gap-4">
          <Link
            href={`/dashboard/customers/${customerId}`}
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

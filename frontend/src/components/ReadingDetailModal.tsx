"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  X,
  Loader2,
  AlertCircle,
  Calendar,
  Activity,
  User,
  MapPin,
  Zap,
  TrendingUp,
  FileText,
  Edit,
  Trash2,
  Download,
  CheckCircle,
  Clock,
} from "lucide-react";
import { readingsApi } from "@/lib/api/readings";
import { MeterReading, ReadingSource } from "@/types/reading";
import { useToast } from "./ui/toast";

interface ReadingDetailModalProps {
  readingId: number | null;
  isOpen: boolean;
  onClose: () => void;
  onDeleted?: () => void;
  onEdit?: () => void;
  userRole?: "Admin" | "Manager" | "FieldOfficer" | "Cashier" | "MeterReader";
}

export default function ReadingDetailModal({
  readingId,
  isOpen,
  onClose,
  onDeleted,
  onEdit,
  userRole = "MeterReader",
}: ReadingDetailModalProps) {
  const { addToast } = useToast();
  const [reading, setReading] = useState<MeterReading | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Check if user can edit/delete
  const canEdit = userRole === "Admin" || userRole === "Manager";

  /**
   * Fetch reading details
   */
  useEffect(() => {
    if (!isOpen || !readingId) {
      setReading(null);
      setError(null);
      return;
    }

    const fetchReading = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await readingsApi.getById(readingId);

        if (response.success) {
          setReading(response.data);
        } else {
          setError(response.error || "Failed to fetch reading details");
        }
      } catch (err) {
        console.error("Error fetching reading:", err);
        setError("Failed to fetch reading details. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchReading();
  }, [readingId, isOpen]);

  /**
   * Handle delete reading
   */
  const handleDelete = async () => {
    if (!reading) return;

    if (
      !confirm(
        "Are you sure you want to delete this reading? This action cannot be undone."
      )
    ) {
      return;
    }

    try {
      setDeleting(true);
      const response = await readingsApi.delete(reading.readingId);

      if (response.success) {
        addToast("success", "Success", "Reading deleted successfully");
        onDeleted?.();
        onClose();
      } else {
        addToast(
          "error",
          "Error",
          response.error || "Failed to delete reading"
        );
      }
    } catch (err) {
      console.error("Error deleting reading:", err);
      addToast("error", "Error", "Failed to delete reading. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  /**
   * Get source badge color and icon
   */
  const getSourceBadge = (source: ReadingSource) => {
    switch (source) {
      case ReadingSource.MANUAL:
        return {
          color: "bg-blue-100 text-blue-800",
          icon: <User className="h-4 w-4" />,
          label: "Manual Reading",
        };
      case ReadingSource.AUTOMATIC:
        return {
          color: "bg-green-100 text-green-800",
          icon: <Zap className="h-4 w-4" />,
          label: "Automatic/Smart Meter",
        };
      case ReadingSource.ESTIMATED:
        return {
          color: "bg-yellow-100 text-yellow-800",
          icon: <TrendingUp className="h-4 w-4" />,
          label: "Estimated",
        };
      case ReadingSource.CORRECTED:
        return {
          color: "bg-purple-100 text-purple-800",
          icon: <Edit className="h-4 w-4" />,
          label: "Corrected",
        };
      default:
        return {
          color: "bg-gray-100 text-gray-800",
          icon: <FileText className="h-4 w-4" />,
          label: source,
        };
    }
  };

  /**
   * Format date
   */
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  /**
   * Format date for display
   */
  const formatShortDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  if (!isOpen) return null;

  const sourceBadge = reading
    ? getSourceBadge(reading.readingSource)
    : { color: "", icon: null, label: "" };

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 z-40 transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          <div
            className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 border-b border-gray-200 bg-white rounded-t-lg">
              <div>
                <h2 className="text-xl font-bold text-gray-900">
                  Reading Details
                </h2>
                {reading && (
                  <p className="text-sm text-gray-600">
                    Reading ID: #{reading.readingId}
                  </p>
                )}
              </div>
              <button
                onClick={onClose}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {loading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
                  <span className="ml-3 text-gray-600">Loading details...</span>
                </div>
              ) : error ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h3 className="font-medium text-red-900 mb-1">Error</h3>
                    <p className="text-red-700">{error}</p>
                  </div>
                </div>
              ) : reading ? (
                <div className="space-y-6">
                  {/* 1. Reading Information */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Activity className="h-5 w-5 text-blue-600" />
                      Reading Information
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Reading ID</p>
                        <p className="text-lg font-semibold text-gray-900">
                          #{reading.readingId}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Reading Date & Time
                        </p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatDate(reading.readingDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">
                          Reading Source
                        </p>
                        <div
                          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full ${sourceBadge.color}`}
                        >
                          {sourceBadge.icon}
                          <span className="font-medium">
                            {sourceBadge.label}
                          </span>
                        </div>
                      </div>
                      {reading.gpsLatitude && reading.gpsLongitude && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1 flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            GPS Location
                          </p>
                          <p className="text-sm text-gray-900">
                            {reading.gpsLatitude.toFixed(6)},{" "}
                            {reading.gpsLongitude.toFixed(6)}
                          </p>
                        </div>
                      )}
                      {reading.isValidated && (
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Validation Status
                          </p>
                          <div className="inline-flex items-center gap-2 text-green-600">
                            <CheckCircle className="h-5 w-5" />
                            <span className="font-medium">Validated</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* 2. Meter & Customer */}
                  {reading.meter && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Zap className="h-5 w-5 text-blue-600" />
                        Meter & Customer
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Meter Serial No
                          </p>
                          <Link
                            href={`/dashboard/readings/meter/${reading.meter.meterId}`}
                            className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                          >
                            {reading.meter.meterSerialNo}
                          </Link>
                        </div>
                        {reading.meter.serviceConnection?.customer && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Customer Name
                            </p>
                            <Link
                              href={`/dashboard/customers/${reading.meter.serviceConnection.customer.customerId}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                            >
                              {
                                reading.meter.serviceConnection.customer
                                  .fullName
                              }
                            </Link>
                          </div>
                        )}
                        {reading.meter.serviceConnection && (
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Connection ID
                            </p>
                            <Link
                              href={`/dashboard/connections/${reading.meter.serviceConnection.connectionId}`}
                              className="text-lg font-semibold text-blue-600 hover:text-blue-800"
                            >
                              #{reading.meter.serviceConnection.connectionId}
                            </Link>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* 3. Readings & Consumption */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-blue-600" />
                      Readings & Consumption
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="bg-white rounded-lg p-4 border border-gray-200">
                        <p className="text-sm text-gray-600 mb-1">
                          Current Import Reading
                        </p>
                        <p className="text-3xl font-bold text-gray-900">
                          {reading.importReading.toLocaleString()}
                        </p>
                      </div>

                      {reading.previousReading !== null && (
                        <div className="bg-white rounded-lg p-4 border border-gray-200">
                          <p className="text-sm text-gray-600 mb-1">
                            Previous Reading
                          </p>
                          <p className="text-3xl font-bold text-gray-600">
                            {reading.previousReading.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {reading.consumption !== null && (
                        <div
                          className={`bg-white rounded-lg p-4 border-2 ${
                            reading.consumption < 0
                              ? "border-red-300 bg-red-50"
                              : "border-green-300 bg-green-50"
                          }`}
                        >
                          <p className="text-sm text-gray-600 mb-1">
                            Consumption
                          </p>
                          <p
                            className={`text-4xl font-bold ${
                              reading.consumption < 0
                                ? "text-red-600"
                                : "text-green-600"
                            }`}
                          >
                            {reading.consumption.toLocaleString()}
                          </p>
                        </div>
                      )}

                      {reading.exportReading !== null && (
                        <>
                          <div className="bg-white rounded-lg p-4 border border-gray-200">
                            <p className="text-sm text-gray-600 mb-1">
                              Export Reading (Solar)
                            </p>
                            <p className="text-2xl font-bold text-orange-600">
                              {reading.exportReading.toLocaleString()}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* 4. Reader Information */}
                  {reading.reader?.employee && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <User className="h-5 w-5 text-blue-600" />
                        Reader Information
                      </h3>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Reader Name
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            {reading.reader.employee.firstName}{" "}
                            {reading.reader.employee.lastName}
                          </p>
                        </div>
                        <div>
                          <p className="text-sm text-gray-600 mb-1">
                            Employee ID
                          </p>
                          <p className="text-lg font-semibold text-gray-900">
                            #{reading.reader.employee.employeeId}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Notes */}
                  {reading.notes && (
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <h3 className="text-sm font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                        <FileText className="h-4 w-4" />
                        Notes/Comments
                      </h3>
                      <p className="text-yellow-800">{reading.notes}</p>
                    </div>
                  )}

                  {/* 5. Audit Trail */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-600" />
                      Audit Trail
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Created At</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(reading.createdAt)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Updated At</p>
                        <p className="text-sm text-gray-900">
                          {formatDate(reading.updatedAt)}
                        </p>
                      </div>
                      {reading.validatedBy && reading.validationDate && (
                        <>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Validated By
                            </p>
                            <p className="text-sm text-gray-900">
                              Employee #{reading.validatedBy}
                            </p>
                          </div>
                          <div>
                            <p className="text-sm text-gray-600 mb-1">
                              Validation Date
                            </p>
                            <p className="text-sm text-gray-900">
                              {formatDate(reading.validationDate)}
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Image (if available) */}
                  {reading.imageUrl && (
                    <div className="bg-gray-50 rounded-lg p-6">
                      <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Reading Image
                      </h3>
                      <img
                        src={reading.imageUrl}
                        alt="Reading"
                        className="max-w-full rounded-lg border border-gray-200"
                      />
                    </div>
                  )}
                </div>
              ) : null}
            </div>

            {/* Footer Actions */}
            {reading && (
              <div className="sticky bottom-0 flex items-center justify-end gap-3 px-6 py-4 border-t border-gray-200 bg-gray-50 rounded-b-lg">
                <button
                  onClick={onClose}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-200 rounded-lg transition-colors"
                >
                  Close
                </button>

                {canEdit && (
                  <>
                    <button
                      onClick={() => {
                        onEdit?.();
                        onClose();
                      }}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                      Edit/Correct
                    </button>

                    <button
                      onClick={handleDelete}
                      disabled={deleting}
                      className="inline-flex items-center gap-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                      {deleting ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Deleting...
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}

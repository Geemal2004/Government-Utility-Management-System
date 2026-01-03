"use client";

import { useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  Upload,
  Download,
  FileSpreadsheet,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  X,
  Loader2,
  FileText,
  Info,
} from "lucide-react";
import { readingsApi } from "@/lib/api/readings";
import { useToast } from "@/components/ui/toast";

interface PreviewRow {
  rowNumber: number;
  meterSerialNo: string;
  readingDate: string;
  importReading: string;
  exportReading: string;
  readingSource: string;
  status: "valid" | "warning" | "error";
  errors: string[];
  warnings: string[];
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  warningCount: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

export default function ImportReadingsPage() {
  const router = useRouter();
  const { addToast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // State
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [previewData, setPreviewData] = useState<PreviewRow[]>([]);
  const [isValidating, setIsValidating] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  // Options
  const [stopOnError, setStopOnError] = useState(false);
  const [overrideExisting, setOverrideExisting] = useState(false);

  /**
   * Handle drag events
   */
  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragging(false);

      const files = e.dataTransfer.files;
      if (files.length > 0) {
        const file = files[0];
        if (file.type === "text/csv" || file.name.endsWith(".csv")) {
          handleFileSelect(file);
        } else {
          addToast("error", "Invalid File", "Please select a CSV file");
        }
      }
    },
    [addToast]
  );

  /**
   * Handle file selection
   */
  const handleFileSelect = useCallback((selectedFile: File) => {
    setFile(selectedFile);
    setPreviewData([]);
    setImportResult(null);
    validateFile(selectedFile);
  }, []);

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  /**
   * Validate file and show preview
   */
  const validateFile = async (file: File) => {
    setIsValidating(true);
    try {
      const text = await file.text();
      const lines = text.split("\n").filter((line) => line.trim());

      if (lines.length < 2) {
        addToast(
          "error",
          "Invalid File",
          "CSV file is empty or has no data rows"
        );
        setFile(null);
        return;
      }

      // Parse header
      const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
      const requiredHeaders = [
        "meter serial no",
        "reading date",
        "import reading",
        "reading source",
      ];

      const missingHeaders = requiredHeaders.filter(
        (h) => !headers.includes(h)
      );
      if (missingHeaders.length > 0) {
        addToast(
          "error",
          "Invalid Format",
          `Missing required columns: ${missingHeaders.join(", ")}`
        );
        setFile(null);
        return;
      }

      // Parse and validate rows (preview first 10)
      const preview: PreviewRow[] = [];
      const maxPreview = Math.min(lines.length - 1, 10);

      for (let i = 1; i <= maxPreview; i++) {
        const values = lines[i].split(",").map((v) => v.trim());
        const row: PreviewRow = {
          rowNumber: i,
          meterSerialNo: values[0] || "",
          readingDate: values[1] || "",
          importReading: values[2] || "",
          exportReading: values[3] || "",
          readingSource: values[4] || "MANUAL",
          status: "valid",
          errors: [],
          warnings: [],
        };

        // Validate row
        if (!row.meterSerialNo) {
          row.errors.push("Meter Serial No is required");
        }
        if (!row.readingDate) {
          row.errors.push("Reading Date is required");
        } else {
          const date = new Date(row.readingDate);
          if (isNaN(date.getTime())) {
            row.errors.push("Invalid date format");
          } else if (date > new Date()) {
            row.errors.push("Date cannot be in the future");
          }
        }
        if (!row.importReading) {
          row.errors.push("Import Reading is required");
        } else if (isNaN(Number(row.importReading))) {
          row.errors.push("Import Reading must be a number");
        } else if (Number(row.importReading) < 0) {
          row.errors.push("Import Reading cannot be negative");
        }

        const validSources = ["MANUAL", "AUTOMATIC", "ESTIMATED", "CORRECTED"];
        if (
          row.readingSource &&
          !validSources.includes(row.readingSource.toUpperCase())
        ) {
          row.errors.push(
            `Invalid Reading Source. Must be one of: ${validSources.join(", ")}`
          );
        }

        if (row.exportReading && isNaN(Number(row.exportReading))) {
          row.errors.push("Export Reading must be a number");
        }

        // Set status
        if (row.errors.length > 0) {
          row.status = "error";
        } else if (row.warnings.length > 0) {
          row.status = "warning";
        }

        preview.push(row);
      }

      setPreviewData(preview);
    } catch (err) {
      console.error("Error validating file:", err);
      addToast("error", "Error", "Failed to read CSV file");
      setFile(null);
    } finally {
      setIsValidating(false);
    }
  };

  /**
   * Download CSV template
   */
  const downloadTemplate = () => {
    const template = `Meter Serial No,Reading Date,Import Reading,Export Reading,Reading Source
MTR-001,2024-01-15 10:30:00,1234.56,,MANUAL
MTR-002,2024-01-15 11:00:00,5678.90,12.34,AUTOMATIC
MTR-003,2024-01-15 11:30:00,9012.34,,ESTIMATED`;

    const blob = new Blob([template], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "meter-readings-template.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);

    addToast("success", "Success", "Template downloaded successfully");
  };

  /**
   * Import readings
   */
  const handleImport = async () => {
    if (!file) return;

    const hasErrors = previewData.some((row) => row.status === "error");
    if (hasErrors && stopOnError) {
      addToast(
        "error",
        "Validation Failed",
        "Please fix all errors before importing"
      );
      return;
    }

    try {
      setIsImporting(true);
      setImportProgress(0);

      // Simulate progress (since backend returns result immediately)
      const progressInterval = setInterval(() => {
        setImportProgress((prev) => Math.min(prev + 10, 90));
      }, 200);

      const response = await readingsApi.importFromCsv(file);

      clearInterval(progressInterval);
      setImportProgress(100);

      if (response.success) {
        const result: ImportResult = {
          totalRows: response.data.totalRows,
          successCount: response.data.successCount,
          errorCount: response.data.errorCount,
          warningCount: 0,
          errors: response.data.errors,
        };
        setImportResult(result);

        if (result.errorCount === 0) {
          addToast(
            "success",
            "Import Complete",
            `Successfully imported ${result.successCount} readings`
          );
          setTimeout(() => {
            router.push("/dashboard/readings");
          }, 2000);
        } else {
          addToast(
            "warning",
            "Import Complete with Errors",
            `Imported ${result.successCount} readings. ${result.errorCount} failed.`
          );
        }
      } else {
        addToast(
          "error",
          "Import Failed",
          response.error || "Failed to import readings"
        );
      }
    } catch (err) {
      console.error("Error importing readings:", err);
      addToast(
        "error",
        "Error",
        "Failed to import readings. Please try again."
      );
    } finally {
      setIsImporting(false);
    }
  };

  /**
   * Download error log
   */
  const downloadErrorLog = () => {
    if (!importResult) return;

    const log = importResult.errors
      .map((e) => `Row ${e.row}: ${e.error}`)
      .join("\n");
    const blob = new Blob([log], { type: "text/plain" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `import-errors-${
      new Date().toISOString().split("T")[0]
    }.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  };

  /**
   * Get status icon
   */
  const getStatusIcon = (status: "valid" | "warning" | "error") => {
    switch (status) {
      case "valid":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "warning":
        return <AlertTriangle className="h-5 w-5 text-yellow-500" />;
      case "error":
        return <AlertCircle className="h-5 w-5 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center gap-4">
        <Link
          href="/dashboard/readings"
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Import Meter Readings
          </h1>
          <p className="text-gray-600">
            Bulk import meter readings from CSV file
          </p>
        </div>
      </div>

      {/* 2. CSV Format Instructions */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-6">
        <div className="flex items-start gap-3">
          <Info className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h3 className="font-semibold text-blue-900 mb-2">
              CSV Format Requirements
            </h3>
            <div className="space-y-3 text-sm text-blue-800">
              <div>
                <p className="font-medium mb-1">Required Columns:</p>
                <ul className="list-disc list-inside space-y-1 ml-2">
                  <li>
                    <strong>Meter Serial No</strong> - The meter serial number
                  </li>
                  <li>
                    <strong>Reading Date</strong> - Format: YYYY-MM-DD HH:MM:SS
                    (e.g., 2024-01-15 10:30:00)
                  </li>
                  <li>
                    <strong>Import Reading</strong> - Numeric value (required)
                  </li>
                  <li>
                    <strong>Export Reading</strong> - Numeric value (optional,
                    for solar)
                  </li>
                  <li>
                    <strong>Reading Source</strong> - MANUAL, AUTOMATIC,
                    ESTIMATED, or CORRECTED
                  </li>
                </ul>
              </div>
              <div>
                <p className="font-medium mb-1">Example Rows:</p>
                <div className="bg-white rounded p-3 font-mono text-xs overflow-x-auto">
                  <div>MTR-001,2024-01-15 10:30:00,1234.56,,MANUAL</div>
                  <div>MTR-002,2024-01-15 11:00:00,5678.90,12.34,AUTOMATIC</div>
                </div>
              </div>
            </div>
            <button
              onClick={downloadTemplate}
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Download className="h-4 w-4" />
              Download Template
            </button>
          </div>
        </div>
      </div>

      {/* 1. File Upload Section */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
          <FileSpreadsheet className="h-5 w-5 text-blue-600" />
          Upload CSV File
        </h2>

        {!file ? (
          <div
            onDragEnter={handleDragEnter}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            className={`border-2 border-dashed rounded-lg p-12 text-center transition-colors ${
              isDragging
                ? "border-blue-500 bg-blue-50"
                : "border-gray-300 hover:border-gray-400"
            }`}
          >
            <Upload
              className={`h-12 w-12 mx-auto mb-4 ${
                isDragging ? "text-blue-500" : "text-gray-400"
              }`}
            />
            <p className="text-lg font-medium text-gray-900 mb-2">
              {isDragging ? "Drop CSV file here" : "Drag & drop CSV file here"}
            </p>
            <p className="text-gray-600 mb-4">or</p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="inline-flex items-center gap-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="h-5 w-5" />
              Browse Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".csv"
              onChange={handleFileInputChange}
              className="hidden"
            />
            <p className="text-sm text-gray-500 mt-4">
              Accepts CSV files only (max 10MB)
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Selected File Info */}
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
              <div className="flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-green-600" />
                <div>
                  <p className="font-medium text-gray-900">{file.name}</p>
                  <p className="text-sm text-gray-600">
                    {(file.size / 1024).toFixed(2)} KB
                  </p>
                </div>
              </div>
              <button
                onClick={() => {
                  setFile(null);
                  setPreviewData([]);
                  setImportResult(null);
                }}
                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Validation Loading */}
            {isValidating && (
              <div className="flex items-center gap-3 p-4 bg-blue-50 rounded-lg">
                <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
                <span className="text-blue-900">Validating CSV file...</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* 3. Preview Section */}
      {previewData.length > 0 && !importResult && (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">
              Preview & Validation
            </h2>
            <p className="text-sm text-gray-600">
              Showing first {previewData.length} rows
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Row
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Meter Serial No
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reading Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Import Reading
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Source
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Issues
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {previewData.map((row) => (
                  <tr
                    key={row.rowNumber}
                    className={
                      row.status === "error"
                        ? "bg-red-50"
                        : row.status === "warning"
                        ? "bg-yellow-50"
                        : ""
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.rowNumber}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {getStatusIcon(row.status)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.meterSerialNo || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.readingDate || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.importReading || "-"}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {row.readingSource || "-"}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      {row.errors.length > 0 && (
                        <ul className="list-disc list-inside text-red-600">
                          {row.errors.map((error, idx) => (
                            <li key={idx}>{error}</li>
                          ))}
                        </ul>
                      )}
                      {row.warnings.length > 0 && (
                        <ul className="list-disc list-inside text-yellow-600">
                          {row.warnings.map((warning, idx) => (
                            <li key={idx}>{warning}</li>
                          ))}
                        </ul>
                      )}
                      {row.errors.length === 0 && row.warnings.length === 0 && (
                        <span className="text-green-600">Valid</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Validation Summary */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <CheckCircle className="h-4 w-4 text-green-500" />
                <span className="text-gray-700">
                  Valid:{" "}
                  {previewData.filter((r) => r.status === "valid").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-yellow-500" />
                <span className="text-gray-700">
                  Warnings:{" "}
                  {previewData.filter((r) => r.status === "warning").length}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-red-500" />
                <span className="text-gray-700">
                  Errors:{" "}
                  {previewData.filter((r) => r.status === "error").length}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. Import Options */}
      {previewData.length > 0 && !importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Import Options
          </h2>
          <div className="space-y-3">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={stopOnError}
                onChange={(e) => setStopOnError(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Stop on first error
                </span>
                <p className="text-xs text-gray-600">
                  Import will stop if any row has an error
                </p>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={overrideExisting}
                onChange={(e) => setOverrideExisting(e.target.checked)}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <div>
                <span className="text-sm font-medium text-gray-900">
                  Override existing readings
                </span>
                <p className="text-xs text-gray-600">
                  Replace existing readings for the same meter and date
                </p>
              </div>
            </label>
          </div>
        </div>
      )}

      {/* 5. Import Progress */}
      {isImporting && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Import Progress
          </h2>
          <div className="space-y-4">
            <div className="relative pt-1">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-gray-700">
                  Processing readings...
                </span>
                <span className="text-sm font-medium text-blue-600">
                  {importProgress}%
                </span>
              </div>
              <div className="overflow-hidden h-2 text-xs flex rounded bg-gray-200">
                <div
                  style={{ width: `${importProgress}%` }}
                  className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-blue-600 transition-all duration-500"
                ></div>
              </div>
            </div>
            <div className="flex items-center gap-3 text-gray-600">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <span>Please wait while we process your readings...</span>
            </div>
          </div>
        </div>
      )}

      {/* Import Results */}
      {importResult && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Import Results
          </h2>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                  <span className="text-sm text-green-700">
                    Successfully Imported
                  </span>
                </div>
                <p className="text-3xl font-bold text-green-900">
                  {importResult.successCount}
                </p>
              </div>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertCircle className="h-6 w-6 text-red-600" />
                  <span className="text-sm text-red-700">Failed</span>
                </div>
                <p className="text-3xl font-bold text-red-900">
                  {importResult.errorCount}
                </p>
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <div className="flex items-center gap-3 mb-2">
                  <AlertTriangle className="h-6 w-6 text-yellow-600" />
                  <span className="text-sm text-yellow-700">Warnings</span>
                </div>
                <p className="text-3xl font-bold text-yellow-900">
                  {importResult.warningCount}
                </p>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900">Error Details</h3>
                  <button
                    onClick={downloadErrorLog}
                    className="inline-flex items-center gap-2 px-3 py-1 text-sm text-blue-600 hover:text-blue-800"
                  >
                    <Download className="h-4 w-4" />
                    Download Error Log
                  </button>
                </div>
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 max-h-60 overflow-y-auto">
                  <ul className="space-y-2 text-sm">
                    {importResult.errors.slice(0, 10).map((error, idx) => (
                      <li key={idx} className="text-red-700">
                        <strong>Row {error.row}:</strong> {error.error}
                      </li>
                    ))}
                    {importResult.errors.length > 10 && (
                      <li className="text-red-600 italic">
                        ... and {importResult.errors.length - 10} more errors
                      </li>
                    )}
                  </ul>
                </div>
              </div>
            )}

            <div className="flex items-center justify-end gap-4">
              <Link
                href="/dashboard/readings"
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                View Readings
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* 6. Action Buttons */}
      {previewData.length > 0 && !importResult && !isImporting && (
        <div className="flex items-center justify-end gap-4 bg-white rounded-lg shadow p-6">
          <Link
            href="/dashboard/readings"
            className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </Link>

          <button
            onClick={() => validateFile(file!)}
            disabled={isValidating}
            className="px-6 py-2 border border-blue-600 text-blue-600 rounded-lg hover:bg-blue-50 transition-colors disabled:opacity-50"
          >
            {isValidating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Validating...
              </>
            ) : (
              "Re-validate CSV"
            )}
          </button>

          <button
            onClick={handleImport}
            disabled={
              isImporting ||
              (stopOnError && previewData.some((row) => row.status === "error"))
            }
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isImporting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin inline mr-2" />
                Importing...
              </>
            ) : (
              "Import Readings"
            )}
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Reading Source Enum
 */
export enum ReadingSource {
  MANUAL = "MANUAL",
  AUTOMATIC = "AUTOMATIC",
  ESTIMATED = "ESTIMATED",
  CORRECTED = "CORRECTED",
}

/**
 * Meter Reading Interface
 */
export interface MeterReading {
  readingId: number;
  meterId: number;
  readerId: number | null;
  readingDate: string;
  importReading: number;
  exportReading: number | null;
  previousReading: number | null;
  consumption: number | null;
  readingSource: ReadingSource;
  isValidated: boolean;
  validatedBy: number | null;
  validationDate: string | null;
  notes: string | null;
  imageUrl: string | null;
  gpsLatitude: number | null;
  gpsLongitude: number | null;
  createdAt: string;
  updatedAt: string;
  // Related entities (populated from joins)
  meter?: {
    meterId: number;
    meterSerialNo: string;
    utilityTypeId: number;
    serviceConnection?: {
      connectionId: number;
      customer?: {
        customerId: number;
        firstName: string;
        lastName: string;
        fullName: string;
      };
    };
  };
  reader?: {
    readerId: number;
    employee?: {
      employeeId: number;
      firstName: string;
      lastName: string;
    };
  };
}

/**
 * Create Meter Reading DTO
 */
export interface CreateMeterReadingDto {
  meterId: number;
  readerId?: number;
  readingDate: string;
  importReading: number;
  exportReading?: number;
  readingSource?: ReadingSource;
  notes?: string;
  imageUrl?: string;
  gpsLatitude?: number;
  gpsLongitude?: number;
}

/**
 * Update Meter Reading DTO
 */
export interface UpdateMeterReadingDto {
  importReading?: number;
  exportReading?: number;
  readingSource?: ReadingSource;
  notes?: string;
  imageUrl?: string;
  isValidated?: boolean;
  validatedBy?: number;
}

/**
 * Bulk Create Meter Reading DTO
 */
export interface BulkCreateMeterReadingDto {
  readings: CreateMeterReadingDto[];
}

/**
 * Reading Validation Result
 */
export interface ReadingValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
}

/**
 * Consumption Summary
 */
export interface ConsumptionSummary {
  meterId: number;
  meterSerialNo: string;
  totalConsumption: number;
  averageConsumption: number;
  readingCount: number;
  firstReadingDate: string;
  lastReadingDate: string;
}

/**
 * Anomaly Detection Result
 */
export interface AnomalyResult {
  readingId: number;
  meterId: number;
  meterSerialNo: string;
  readingDate: string;
  consumption: number;
  expectedConsumption: number;
  deviationPercentage: number;
  anomalyType: "HIGH" | "LOW" | "NEGATIVE";
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
}

/**
 * Readings Query Parameters
 */
export interface ReadingsQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  meterId?: number;
  readerId?: number;
  readingSource?: ReadingSource;
  startDate?: string;
  endDate?: string;
  isValidated?: boolean;
  search?: string;
}

/**
 * CSV Import Result
 */
export interface CsvImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{
    row: number;
    error: string;
  }>;
}

/**
 * Reading Statistics
 */
export interface ReadingStatistics {
  totalReadingsToday: number;
  totalReadingsThisMonth: number;
  averageConsumption: number;
  metersPendingReading: number;
  abnormalReadingsCount: number;
  estimatedReadingsCount: number;
}

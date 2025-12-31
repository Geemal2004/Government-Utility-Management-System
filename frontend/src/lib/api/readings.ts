import apiClient from "../api-client";
import {
  MeterReading,
  CreateMeterReadingDto,
  UpdateMeterReadingDto,
  BulkCreateMeterReadingDto,
  ReadingValidationResult,
  ConsumptionSummary,
  AnomalyResult,
  ReadingsQueryParams,
  CsvImportResult,
} from "@/types/reading";
import { PaginatedResponse, ApiResponse } from "@/types/customer";

export const readingsApi = {
  /**
   * Get all readings with pagination and filtering
   */
  async getAll(
    params: ReadingsQueryParams = {},
  ): Promise<ApiResponse<PaginatedResponse<MeterReading>>> {
    const response = await apiClient.get("/readings", { params });
    return response.data;
  },

  /**
   * Get a single reading by ID
   */
  async getById(id: number): Promise<ApiResponse<MeterReading>> {
    const response = await apiClient.get(`/readings/${id}`);
    return response.data;
  },

  /**
   * Get readings by meter ID
   */
  async getByMeter(
    meterId: number,
    params: ReadingsQueryParams = {},
  ): Promise<ApiResponse<PaginatedResponse<MeterReading>>> {
    const response = await apiClient.get(`/readings/meter/${meterId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Get latest reading for a meter
   */
  async getLatestByMeter(meterId: number): Promise<ApiResponse<MeterReading>> {
    const response = await apiClient.get(`/readings/meter/${meterId}/latest`);
    return response.data;
  },

  /**
   * Get readings by reader ID
   */
  async getByReader(
    readerId: number,
    params: ReadingsQueryParams = {},
  ): Promise<ApiResponse<PaginatedResponse<MeterReading>>> {
    const response = await apiClient.get(`/readings/reader/${readerId}`, {
      params,
    });
    return response.data;
  },

  /**
   * Create a new reading
   */
  async create(
    data: CreateMeterReadingDto,
  ): Promise<ApiResponse<MeterReading>> {
    const response = await apiClient.post("/readings", data);
    return response.data;
  },

  /**
   * Create multiple readings in bulk
   */
  async createBulk(
    data: BulkCreateMeterReadingDto,
  ): Promise<ApiResponse<{ created: MeterReading[]; errors: string[] }>> {
    const response = await apiClient.post("/readings/bulk", data);
    return response.data;
  },

  /**
   * Update a reading
   */
  async update(
    id: number,
    data: UpdateMeterReadingDto,
  ): Promise<ApiResponse<MeterReading>> {
    const response = await apiClient.put(`/readings/${id}`, data);
    return response.data;
  },

  /**
   * Delete a reading
   */
  async delete(id: number): Promise<ApiResponse<void>> {
    const response = await apiClient.delete(`/readings/${id}`);
    return response.data;
  },

  /**
   * Validate a reading
   */
  async validate(
    id: number,
    validatedBy: number,
  ): Promise<ApiResponse<MeterReading>> {
    const response = await apiClient.post(`/readings/${id}/validate`, {
      validatedBy,
    });
    return response.data;
  },

  /**
   * Get validation result for a reading (dry run)
   */
  async getValidation(
    id: number,
  ): Promise<ApiResponse<ReadingValidationResult>> {
    const response = await apiClient.get(`/readings/${id}/validation`);
    return response.data;
  },

  /**
   * Get consumption summary for a meter
   */
  async getConsumptionSummary(
    meterId: number,
    startDate?: string,
    endDate?: string,
  ): Promise<ApiResponse<ConsumptionSummary>> {
    const params: Record<string, string> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    const response = await apiClient.get(
      `/readings/meter/${meterId}/consumption`,
      {
        params,
      },
    );
    return response.data;
  },

  /**
   * Get estimated reading for a meter
   */
  async getEstimate(
    meterId: number,
  ): Promise<ApiResponse<{ estimatedReading: number }>> {
    const response = await apiClient.get(`/readings/meter/${meterId}/estimate`);
    return response.data;
  },

  /**
   * Export readings to CSV
   */
  async exportToCsv(params: ReadingsQueryParams = {}): Promise<Blob> {
    const response = await apiClient.get("/readings/export", {
      params,
      responseType: "blob",
    });
    return response.data;
  },

  /**
   * Import readings from CSV
   */
  async importFromCsv(file: File): Promise<ApiResponse<CsvImportResult>> {
    const formData = new FormData();
    formData.append("file", file);
    const response = await apiClient.post("/readings/import", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  /**
   * Detect anomalies in readings
   */
  async detectAnomalies(
    startDate?: string,
    endDate?: string,
    threshold?: number,
  ): Promise<ApiResponse<AnomalyResult[]>> {
    const params: Record<string, string | number> = {};
    if (startDate) params.startDate = startDate;
    if (endDate) params.endDate = endDate;
    if (threshold) params.threshold = threshold;
    const response = await apiClient.get("/readings/anomalies", { params });
    return response.data;
  },
};

export default readingsApi;

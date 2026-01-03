import apiClient from "../api-client";
import {
  ServiceConnection,
  CreateConnectionDto,
  UpdateConnectionDto,
  ConnectionQueryParams,
  ConnectionStats,
  ConnectionStatus,
} from "@/types/connection";
import { PaginatedResponse, ApiResponse } from "@/types/customer";

export const connectionsApi = {
  /**
   * Get all connections with pagination and filtering
   */
  async getAll(
    params: ConnectionQueryParams = {},
  ): Promise<ApiResponse<PaginatedResponse<ServiceConnection>>> {
    const response = await apiClient.get("/connections", { params });
    return response.data;
  },

  /**
   * Get a single connection by ID
   */
  async getById(id: number): Promise<ApiResponse<ServiceConnection>> {
    const response = await apiClient.get(`/connections/${id}`);
    return response.data;
  },

  /**
   * Get all connections for a customer
   */
  async getByCustomerId(
    customerId: number,
  ): Promise<ApiResponse<ServiceConnection[]>> {
    const response = await apiClient.get(`/connections/customer/${customerId}`);
    return response.data;
  },

  /**
   * Get connection statistics for a customer
   */
  async getCustomerStats(
    customerId: number,
  ): Promise<ApiResponse<ConnectionStats>> {
    const response = await apiClient.get(
      `/connections/customer/${customerId}/stats`,
    );
    return response.data;
  },

  /**
   * Create a new connection
   */
  async create(
    data: CreateConnectionDto,
  ): Promise<ApiResponse<ServiceConnection>> {
    const response = await apiClient.post("/connections", data);
    return response.data;
  },

  /**
   * Update an existing connection
   */
  async update(
    id: number,
    data: UpdateConnectionDto,
  ): Promise<ApiResponse<ServiceConnection>> {
    const response = await apiClient.put(`/connections/${id}`, data);
    return response.data;
  },

  /**
   * Update connection status
   */
  async updateStatus(
    id: number,
    status: ConnectionStatus,
  ): Promise<ApiResponse<ServiceConnection>> {
    const response = await apiClient.patch(`/connections/${id}/status`, {
      status,
    });
    return response.data;
  },

  /**
   * Assign meter to connection
   */
  async assignMeter(
    id: number,
    meterId: number,
  ): Promise<ApiResponse<ServiceConnection>> {
    const response = await apiClient.patch(`/connections/${id}/assign-meter`, {
      meterId,
    });
    return response.data;
  },

  /**
   * Deactivate a connection (soft delete)
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/connections/${id}`);
    return response.data;
  },
};

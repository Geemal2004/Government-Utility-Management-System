import apiClient from "../api-client";
import { ApiResponse } from "@/types/customer";
import {
  UtilityTypeDetails,
  TariffCategory,
  Meter,
  NetworkNode,
} from "@/types/connection";

/**
 * Geographic Area type
 */
export interface GeoArea {
  geoAreaId: number;
  name: string;
  type: string;
  parentGeoAreaId: number | null;
}

/**
 * Customer summary for dropdown selection
 */
export interface CustomerSummary {
  customerId: number;
  fullName: string;
  email: string | null;
  customerType: string;
  identityRef: string;
}

export const lookupApi = {
  /**
   * Get all utility types
   */
  async getUtilityTypes(): Promise<ApiResponse<UtilityTypeDetails[]>> {
    const response = await apiClient.get("/lookup/utility-types");
    return response.data;
  },

  /**
   * Get tariff categories, optionally filtered by utility type
   */
  async getTariffCategories(
    utilityTypeId?: number,
  ): Promise<ApiResponse<TariffCategory[]>> {
    const params = utilityTypeId ? { utilityTypeId } : {};
    const response = await apiClient.get("/lookup/tariff-categories", {
      params,
    });
    return response.data;
  },

  /**
   * Get available (unassigned) meters, optionally filtered by utility type
   */
  async getAvailableMeters(
    utilityTypeId?: number,
  ): Promise<ApiResponse<Meter[]>> {
    const params = utilityTypeId ? { utilityTypeId } : {};
    const response = await apiClient.get("/lookup/meters/available", {
      params,
    });
    return response.data;
  },

  /**
   * Get all meters, optionally filtered by utility type
   */
  async getMeters(utilityTypeId?: number): Promise<ApiResponse<Meter[]>> {
    const params = utilityTypeId ? { utilityTypeId } : {};
    const response = await apiClient.get("/lookup/meters", { params });
    return response.data;
  },

  /**
   * Get a specific meter by ID with full details
   */
  async getMeterById(meterId: number): Promise<ApiResponse<Meter>> {
    const response = await apiClient.get(`/lookup/meters/${meterId}`);
    return response.data;
  },

  /**
   * Get geographic areas
   */
  async getGeoAreas(): Promise<ApiResponse<GeoArea[]>> {
    const response = await apiClient.get("/lookup/geo-areas");
    return response.data;
  },

  /**
   * Get network nodes, optionally filtered by utility type
   */
  async getNetworkNodes(
    utilityTypeId?: number,
  ): Promise<ApiResponse<NetworkNode[]>> {
    const params = utilityTypeId ? { utilityTypeId } : {};
    const response = await apiClient.get("/lookup/network-nodes", { params });
    return response.data;
  },

  /**
   * Get customers for selection dropdown
   */
  async getCustomers(search?: string): Promise<ApiResponse<CustomerSummary[]>> {
    const params = search ? { search, limit: 50 } : { limit: 50 };
    const response = await apiClient.get("/lookup/customers", { params });
    return response.data;
  },
};

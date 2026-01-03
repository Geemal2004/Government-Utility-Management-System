import apiClient from '../api-client';

// Types for billing API
export interface CreateBillDto {
  meterId: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  applySubsidy?: boolean;
  applySolarCredit?: boolean;
}

export interface UpdateBillDto {
  dueDate?: string;
  status?: string;
  notes?: string;
}

export interface BulkBillGenerationDto {
  billingPeriodStart: string;
  billingPeriodEnd: string;
  dueDate: string;
  utilityType?: string;
  customerType?: string;
  specificMeters?: number[];
  geoAreaId?: number;
  dryRun?: boolean;
  applySubsidies?: boolean;
  applySolarCredits?: boolean;
  skipExisting?: boolean;
  offset?: number;
  limit?: number;
}

export interface BillFilterDto {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  status?: string;
  utilityType?: string;
  customerType?: string;
  customerId?: number;
  meterId?: number;
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
}

export interface CalculateBillDto {
  meterId: number;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  applySubsidy?: boolean;
  applySolarCredit?: boolean;
}

/**
 * Billing API client
 * Provides methods for managing bills, calculations, and bulk operations
 */
export const billingApi = {
  /**
   * Calculate bill preview without saving
   */
  calculate: async (data: CalculateBillDto) => {
    const response = await apiClient.post('/bills/calculate', data);
    return response.data;
  },

  /**
   * Create a new bill
   */
  create: async (data: CreateBillDto) => {
    const response = await apiClient.post('/bills', data);
    return response.data;
  },

  /**
   * Bulk bill generation
   */
  createBulk: async (data: BulkBillGenerationDto) => {
    const response = await apiClient.post('/bills/bulk', data);
    return response.data;
  },

  /**
   * Get all bills with pagination and filtering
   */
  getAll: async (filters?: BillFilterDto) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/bills?${params.toString()}`);
    return response.data;
  },

  /**
   * Get a single bill by ID
   */
  getById: async (id: number) => {
    const response = await apiClient.get(`/bills/${id}`);
    return response.data;
  },

  /**
   * Get bills by meter ID
   */
  getByMeter: async (meterId: number, params?: any) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/bills/meter/${meterId}?${queryParams.toString()}`);
    return response.data;
  },

  /**
   * Get bills by customer ID
   */
  getByCustomer: async (customerId: number) => {
    const response = await apiClient.get(`/bills/customer/${customerId}`);
    return response.data;
  },

  /**
   * Get billing summary and statistics
   */
  getSummary: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/bills/summary?${params.toString()}`);
    return response.data;
  },

  /**
   * Update an existing bill
   */
  update: async (id: number, data: UpdateBillDto) => {
    const response = await apiClient.put(`/bills/${id}`, data);
    return response.data;
  },

  /**
   * Recalculate a bill
   */
  recalculate: async (id: number) => {
    const response = await apiClient.post(`/bills/${id}/recalculate`);
    return response.data;
  },

  /**
   * Void a bill
   */
  void: async (id: number, reason: string) => {
    const response = await apiClient.post(`/bills/${id}/void`, { reason });
    return response.data;
  },

  /**
   * Download bill as PDF
   */
  downloadPDF: async (id: number) => {
    const response = await apiClient.get(`/bills/${id}/download`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Export bills to CSV
   */
  export: async (filters?: any) => {
    const params = new URLSearchParams();
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, String(value));
        }
      });
    }
    const response = await apiClient.get(`/bills/export?${params.toString()}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  /**
   * Get overdue bills
   */
  getOverdue: async (limit?: number) => {
    const params = limit ? `?limit=${limit}` : '';
    const response = await apiClient.get(`/bills/overdue${params}`);
    return response.data;
  },

  /**
   * Send payment reminder for a bill
   */
  sendReminder: async (id: number) => {
    const response = await apiClient.post(`/bills/${id}/send-reminder`);
    return response.data;
  },
};

export default billingApi;

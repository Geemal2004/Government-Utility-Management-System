import apiClient from '../api-client';

export interface WorkOrder {
  workOrderId: number;
  openedTs: string;
  scheduledStartTs?: string;
  scheduledEndTs?: string;
  closedTs?: string;
  workOrderStatus: string;
  resolutionNotes?: string;
  assetId?: number;
  requestId?: number;
  geoAreaId: number;
  asset?: any;
  request?: any;
  geoArea?: any;
  totalLaborCost?: number;
  totalItemCost?: number;
  totalCost?: number;
  durationHours?: number;
  laborEntries?: any[];
  itemUsages?: any[];
}

export interface CreateWorkOrderDto {
  openedTs: string;
  scheduledStartTs?: string;
  scheduledEndTs?: string;
  workOrderStatus: string;
  resolutionNotes?: string;
  assetId?: number;
  requestId?: number;
  geoAreaId: number;
  assignedEmployeeIds?: number[];
}

export interface WorkOrderFilter {
  status?: string;
  assetId?: number;
  requestId?: number;
  geoAreaId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export const workOrdersApi = {
  // Get all work orders with filters
  async getAll(filters?: WorkOrderFilter) {
    const response = await apiClient.get('/work-orders', { params: filters });
    return response.data;
  },

  // Get work order by ID
  async getById(id: number) {
    const response = await apiClient.get(`/work-orders/${id}`);
    return response.data;
  },

  // Create work order
  async create(data: CreateWorkOrderDto) {
    const response = await apiClient.post('/work-orders', data);
    return response.data;
  },

  // Update work order
  async update(id: number, data: Partial<CreateWorkOrderDto>) {
    const response = await apiClient.patch(`/work-orders/${id}`, data);
    return response.data;
  },

  // Update work order status
  async updateStatus(id: number, status: string, notes?: string) {
    const response = await apiClient.patch(`/work-orders/${id}/status`, { status, notes });
    return response.data;
  },

  // Complete work order
  async complete(id: number, resolutionNotes: string) {
    const response = await apiClient.post(`/work-orders/${id}/complete`, { resolutionNotes });
    return response.data;
  },

  // Cancel work order
  async cancel(id: number, reason: string) {
    const response = await apiClient.post(`/work-orders/${id}/cancel`, { reason });
    return response.data;
  },

  // Get statistics
  async getStatistics(filters?: any) {
    const response = await apiClient.get('/work-orders/statistics', { params: filters });
    return response.data;
  },
};

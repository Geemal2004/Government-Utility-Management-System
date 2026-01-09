import apiClient from '../api-client';

export interface Complaint {
  complaintId: number;
  customerId: number;
  assignedEmployeeId?: number;
  complaintType: string;
  createdDate: string;
  resolvedDate?: string;
  status: string;
  description: string;
  customer?: any;
  assignedEmployee?: any;
  resolutionTimeHours?: number;
}

export interface CreateComplaintDto {
  customerId: number;
  complaintType: string;
  description: string;
}

export interface ComplaintFilter {
  status?: string;
  customerId?: number;
  assignedEmployeeId?: number;
  complaintType?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export const complaintsApi = {
  async getAll(filters?: ComplaintFilter) {
    const response = await apiClient.get('/complaints', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await apiClient.get(`/complaints/${id}`);
    return response.data;
  },

  async create(data: CreateComplaintDto) {
    const response = await apiClient.post('/complaints', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateComplaintDto>) {
    const response = await apiClient.patch(`/complaints/${id}`, data);
    return response.data;
  },

  async assign(id: number, employeeId: number) {
    const response = await apiClient.patch(`/complaints/${id}/assign`, { employeeId });
    return response.data;
  },

  async resolve(id: number) {
    const response = await apiClient.patch(`/complaints/${id}/resolve`);
    return response.data;
  },

  async close(id: number) {
    const response = await apiClient.patch(`/complaints/${id}/close`);
    return response.data;
  },
};

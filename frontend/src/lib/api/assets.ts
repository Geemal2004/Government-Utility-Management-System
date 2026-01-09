import apiClient from '../api-client';

export interface Asset {
  assetId: number;
  name: string;
  assetType: string;
  status: string;
  utilityTypeId: number;
  utilityType?: any;
  totalWorkOrders?: number;
  lastMaintenanceDate?: string;
}

export interface CreateAssetDto {
  name: string;
  assetType: string;
  status: string;
  utilityTypeId: number;
}

export interface AssetFilter {
  search?: string;
  assetType?: string;
  status?: string;
  utilityTypeId?: number;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export const assetsApi = {
  async getAll(filters?: AssetFilter) {
    const response = await apiClient.get('/assets', { params: filters });
    return response.data;
  },

  async getById(id: number) {
    const response = await apiClient.get(`/assets/${id}`);
    return response.data;
  },

  async create(data: CreateAssetDto) {
    const response = await apiClient.post('/assets', data);
    return response.data;
  },

  async update(id: number, data: Partial<CreateAssetDto>) {
    const response = await apiClient.patch(`/assets/${id}`, data);
    return response.data;
  },

  async delete(id: number) {
    const response = await apiClient.delete(`/assets/${id}`);
    return response.data;
  },
};

import apiClient from '../api-client';
import {
  Customer,
  CreateCustomerDto,
  UpdateCustomerDto,
  PaginatedResponse,
  ApiResponse,
} from '@/types/customer';

export interface CustomersQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
  customerType?: string;
  search?: string;
}

export const customersApi = {
  /**
   * Get all customers with pagination and filtering
   */
  async getAll(
    params: CustomersQueryParams = {}
  ): Promise<ApiResponse<PaginatedResponse<Customer>>> {
    const response = await apiClient.get('/customers', { params });
    return response.data;
  },

  /**
   * Get a single customer by ID
   */
  async getById(id: number): Promise<ApiResponse<Customer>> {
    const response = await apiClient.get(`/customers/${id}`);
    return response.data;
  },

  /**
   * Get a customer by identity reference
   */
  async getByIdentityRef(identityRef: string): Promise<ApiResponse<Customer>> {
    const response = await apiClient.get(`/customers/identity/${identityRef}`);
    return response.data;
  },

  /**
   * Create a new customer
   */
  async create(data: CreateCustomerDto): Promise<ApiResponse<Customer>> {
    const response = await apiClient.post('/customers', data);
    return response.data;
  },

  /**
   * Update an existing customer
   */
  async update(
    id: number,
    data: UpdateCustomerDto
  ): Promise<ApiResponse<Customer>> {
    const response = await apiClient.put(`/customers/${id}`, data);
    return response.data;
  },

  /**
   * Delete a customer
   */
  async delete(id: number): Promise<ApiResponse<null>> {
    const response = await apiClient.delete(`/customers/${id}`);
    return response.data;
  },

  /**
   * Get customer count by type
   */
  async getCountByType(): Promise<
    ApiResponse<{ type: string; count: number }[]>
  > {
    const response = await apiClient.get('/customers/stats/count-by-type');
    return response.data;
  },
};

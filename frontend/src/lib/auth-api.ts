import apiClient, { setAuthToken, removeAuthToken, getAuthToken } from './api-client';
import { ApiResponse, LoginRequest, LoginResponse, Employee } from '@/types';

/**
 * Authentication API functions
 */
export const authApi = {
  /**
   * Login with username/email and password
   */
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    const response = await apiClient.post<ApiResponse<LoginResponse>>('/auth/login', credentials);
    
    console.log('Login response:', response.data);
    console.log('Login data:', response.data.data);
    console.log('Access token:', response.data.data?.accessToken);
    
    if (response.data.success && response.data.data?.accessToken) {
      setAuthToken(response.data.data.accessToken);
      return response.data.data;
    }
    
    throw new Error('Login failed - no access token received');
  },

  /**
   * Get current user profile
   */
  getProfile: async (): Promise<Employee> => {
    const response = await apiClient.get<ApiResponse<Employee>>('/auth/profile');
    
    if (response.data.success && response.data.data) {
      return response.data.data;
    }
    
    throw new Error(response.data.message || 'Failed to get profile');
  },

  /**
   * Logout user
   */
  logout: (): void => {
    removeAuthToken();
  },

  /**
   * Check if user is logged in
   */
  isLoggedIn: (): boolean => {
    return !!getAuthToken();
  },
};

export default authApi;

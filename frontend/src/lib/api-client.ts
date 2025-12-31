import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import Cookies from 'js-cookie';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
const TOKEN_KEY = 'auth_token';

/**
 * Create axios instance with default configuration
 */
const apiClient: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

/**
 * Request interceptor to add auth token
 */
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = Cookies.get(TOKEN_KEY);
    console.log('API Request:', config.url);
    console.log('Token found:', token ? `${token.substring(0, 20)}...` : 'No token');
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set');
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * Response interceptor to handle errors
 */
apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (error.response?.status === 401) {
      // Clear token and redirect to login on 401
      Cookies.remove(TOKEN_KEY);
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

/**
 * Set auth token
 */
export const setAuthToken = (token: string): void => {
  console.log('Setting auth token:', token ? token.substring(0, 20) + '...' : 'No token');
  Cookies.set(TOKEN_KEY, token, { 
    expires: 1, // 1 day
    path: '/',
    sameSite: 'lax'
  });
  const verifyToken = Cookies.get(TOKEN_KEY);
  console.log('Cookie set. Verifying:', verifyToken ? verifyToken.substring(0, 20) + '...' : 'No token');
};

/**
 * Get auth token
 */
export const getAuthToken = (): string | undefined => {
  return Cookies.get(TOKEN_KEY);
};

/**
 * Remove auth token
 */
export const removeAuthToken = (): void => {
  Cookies.remove(TOKEN_KEY);
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

export default apiClient;

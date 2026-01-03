/**
 * API Response wrapper type
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export * from "./customer";
export * from "./connection";
export * from "./reading";

/**
 * Paginated response type
 */
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

/**
 * Employee type (from API)
 */
export interface Employee {
  employeeId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  employeeNo: string;
  designation: string;
  role: string;
  departmentId: number;
  email: string;
  username: string;
  lastLoginAt: string | null;
}

/**
 * Login request type
 */
export interface LoginRequest {
  usernameOrEmail: string;
  password: string;
}

/**
 * Login response type
 */
export interface LoginResponse {
  accessToken: string;
  tokenType: string;
  employee: Employee;
}

/**
 * User roles
 */
export type UserRole =
  | "Manager"
  | "FieldOfficer"
  | "Cashier"
  | "Admin"
  | "MeterReader";

/**
 * Auth state type
 */
export interface AuthState {
  isAuthenticated: boolean;
  employee: Employee | null;
  token: string | null;
}

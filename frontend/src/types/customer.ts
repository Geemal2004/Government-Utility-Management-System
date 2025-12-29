export enum CustomerType {
  RESIDENTIAL = 'RESIDENTIAL',
  COMMERCIAL = 'COMMERCIAL',
  INDUSTRIAL = 'INDUSTRIAL',
  GOVERNMENT = 'GOVERNMENT',
}

export enum IdentityType {
  NIC = 'NIC',
  PASSPORT = 'PASSPORT',
  DRIVING_LICENSE = 'DRIVING_LICENSE',
  BUSINESS_REG = 'BUSINESS_REG',
}

export interface CustomerAddress {
  customerAddressId: number;
  postalCode: string;
  line1: string;
}

export interface Customer {
  customerId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string | null;
  customerType: CustomerType;
  registrationDate: string;
  identityType: IdentityType;
  identityRef: string;
  tariffCategoryId: number | null;
  employeeId: number | null;
  address: CustomerAddress;
  phoneNumbers: string[];
}

export interface CreateCustomerDto {
  firstName: string;
  middleName?: string;
  lastName: string;
  email?: string;
  password: string;
  customerType: CustomerType;
  identityType: IdentityType;
  identityRef: string;
  address: {
    postalCode: string;
    line1: string;
  };
  phoneNumbers?: string[];
  tariffCategoryId?: number;
}

export interface UpdateCustomerDto {
  firstName?: string;
  middleName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  customerType?: CustomerType;
  identityType?: IdentityType;
  address?: {
    postalCode: string;
    line1: string;
  };
  phoneNumbers?: string[];
  tariffCategoryId?: number;
}

export interface PaginationMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

export interface PaginatedResponse<T> {
  items: T[];
  meta: PaginationMeta;
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  error?: string;
}

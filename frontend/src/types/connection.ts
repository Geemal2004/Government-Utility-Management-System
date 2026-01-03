/**
 * Connection status enum
 */
export enum ConnectionStatus {
  ACTIVE = "ACTIVE",
  INACTIVE = "INACTIVE",
  SUSPENDED = "SUSPENDED",
  DISCONNECTED = "DISCONNECTED",
  PENDING = "PENDING",
}

/**
 * Utility type enum
 */
export enum UtilityType {
  ELECTRICITY = "ELECTRICITY",
  WATER = "WATER",
  GAS = "GAS",
}

/**
 * Utility type details
 */
export interface UtilityTypeDetails {
  utilityTypeId: number;
  name: string;
  unit: string;
  description: string | null;
}

/**
 * Tariff category details
 */
export interface TariffCategory {
  tariffCategoryId: number;
  categoryCode: string;
  categoryName: string;
  description: string | null;
}

/**
 * Meter details
 */
export interface Meter {
  meterId: number;
  meterSerialNo: string;
  utilityTypeId: number;
  installationDate: string;
  isSmartMeter: boolean;
  status: string;
}

/**
 * Connection address details
 */
export interface ConnectionAddress {
  connectionAddressId: number;
  line1: string;
  city: string;
  postalCode: string;
  geoAreaId: number | null;
  geoArea?: {
    geoAreaId: number;
    areaName: string;
    areaCode: string;
  } | null;
}

/**
 * Customer summary for connection
 */
export interface ConnectionCustomer {
  customerId: number;
  firstName: string;
  middleName: string | null;
  lastName: string;
  fullName: string;
  email: string | null;
  customerType: string;
}

/**
 * Network node details
 */
export interface NetworkNode {
  nodeId: number;
  nodeName: string;
  nodeType: string;
}

/**
 * Service Connection type
 */
export interface ServiceConnection {
  connectionId: number;
  customerId: number;
  utilityTypeId: number;
  tariffCategoryId: number;
  connectionStatus: ConnectionStatus;
  meterId: number | null;
  connectionAddressId: number;
  nodeId: number | null;
  customer?: ConnectionCustomer;
  utilityType?: UtilityTypeDetails;
  tariffCategory?: TariffCategory;
  meter?: Meter | null;
  connectionAddress?: ConnectionAddress;
  networkNode?: NetworkNode | null;
}

/**
 * Create connection DTO
 */
export interface CreateConnectionDto {
  customerId: number;
  utilityTypeId: number;
  tariffCategoryId: number;
  connectionAddress: {
    line1: string;
    city: string;
    postalCode: string;
    geoAreaId: number;
  };
  meterId?: number;
  nodeId?: number;
}

/**
 * Update connection DTO
 */
export interface UpdateConnectionDto {
  utilityTypeId?: number;
  tariffCategoryId?: number;
  connectionAddress?: {
    line1: string;
    city: string;
    postalCode: string;
    geoAreaId?: number;
  };
  connectionStatus?: ConnectionStatus;
  meterId?: number;
  nodeId?: number;
}

/**
 * Connection query parameters
 */
export interface ConnectionQueryParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: "ASC" | "DESC";
  customerId?: number;
  utilityTypeId?: number;
  connectionStatus?: ConnectionStatus;
  city?: string;
  search?: string;
}

/**
 * Connection statistics
 */
export interface ConnectionStats {
  total: number;
  active: number;
  pending: number;
  suspended: number;
  disconnected: number;
  byUtilityType: {
    utilityTypeId: number;
    utilityTypeName: string;
    count: number;
  }[];
}

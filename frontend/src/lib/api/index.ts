/**
 * Central API exports
 * Import all API modules here for easy access throughout the application
 */

export { customersApi } from './customers';
export { connectionsApi } from './connections';
export { lookupApi } from './lookup';
export { readingsApi } from './readings';
export { billingApi } from './billing';
export { workOrdersApi } from './work-orders';
export { assetsApi } from './assets';
export { complaintsApi } from './complaints';

// Re-export types
export type { CustomersQueryParams } from './customers';
export type {
  CreateBillDto,
  UpdateBillDto,
  BulkBillGenerationDto,
  BillFilterDto,
  CalculateBillDto,
} from './billing';

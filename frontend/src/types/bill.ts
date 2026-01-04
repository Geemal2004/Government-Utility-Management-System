export enum BillStatus {
  PAID = 'PAID',
  UNPAID = 'UNPAID',
  OVERDUE = 'OVERDUE',
  PARTIAL = 'PARTIAL',
  VOIDED = 'VOIDED',
}

export enum UtilityType {
  ELECTRICITY = 'Electricity',
  WATER = 'Water',
  GAS = 'Natural Gas',
}

export interface Bill {
  billId: number;
  billDate: string;
  dueDate: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalAmount: number;
  paidAmount: number;
  outstandingAmount: number;
  status: BillStatus;
  customer: {
    customerId: number;
    firstName: string;
    middleName?: string;
    lastName: string;
  };
  meter: {
    meterId: number;
    meterSerialNo: string;
    utilityType: string;
  };
}

export interface BillSummary {
  totalBills: number;
  totalAmount: number;
  totalOutstanding: number;
  overdueCount: number;
  paidCount: number;
  unpaidCount: number;
}

export interface BillFilters {
  search?: string;
  utilityType?: string;
  status?: BillStatus | 'All';
  customerId?: number;
  startDate?: string;
  endDate?: string;
  page?: number;
  limit?: number;
  sortBy?: string;
  order?: 'ASC' | 'DESC';
}

export interface PaginatedResponse<T> {
  success: boolean;
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

import type { TransactionDirection } from '../../transaction/domain/transaction-direction.js';

export interface ReportFilter {
  companyId: string;
  from?: Date;
  to?: Date;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  employeeId?: string;
  tripId?: string;
  transactionNumber?: string;
  direction?: TransactionDirection;
  status?: string;
  category?: string;
  referenceType?: string;
  includeArchived: boolean;
}

export interface ReportFilterQueryInput {
  from?: Date;
  to?: Date;
  branchId?: string;
  warehouseId?: string;
  vehicleId?: string;
  employeeId?: string;
  tripId?: string;
  transactionNumber?: string;
  direction?: TransactionDirection;
  status?: string;
  category?: string;
  referenceType?: string;
  includeArchived?: boolean;
}

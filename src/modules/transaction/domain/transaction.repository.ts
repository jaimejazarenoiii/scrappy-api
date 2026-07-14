import type { TransactionEntity } from './transaction.entity.js';
import type { TransactionItemEntity } from './transaction-item.entity.js';
import type { TransactionAttachmentEntity } from './transaction-attachment.entity.js';
import type { TransactionDirection } from './transaction-direction.js';
import type { TransactionStatus } from './transaction-status.js';
import type { TransactionLocationType } from './transaction-location-type.js';
import type { TransactionItemUnit } from './transaction-item-unit.js';

export interface NewTransactionItemInput {
  id: string;
  materialName: string;
  weight: number;
  unit: TransactionItemUnit;
  price: number;
  total: number;
  notes?: string | null;
}

export interface CreateTransactionInput {
  id: string;
  companyId: string;
  createdByUserId: string;
  transactionNumber: string;
  direction: TransactionDirection;
  partyName: string;
  partyContactNumber?: string | null;
  transactionDate: Date;
  locationType: TransactionLocationType;
  branchId?: string | null;
  warehouseId?: string | null;
  outsideLocationName?: string | null;
  outsideAddress?: string | null;
  tripId?: string | null;
  notes?: string | null;
  assignedEmployeeIds: string[];
  items: NewTransactionItemInput[];
}

export interface UpdateTransactionInput {
  direction?: TransactionDirection;
  status?: TransactionStatus;
  partyName?: string;
  partyContactNumber?: string | null;
  transactionDate?: Date;
  locationType?: TransactionLocationType;
  branchId?: string | null;
  warehouseId?: string | null;
  outsideLocationName?: string | null;
  outsideAddress?: string | null;
  tripId?: string | null;
  notes?: string | null;
  updatedByUserId?: string | null;
  assignedEmployeeIds?: string[];
  submittedAt?: Date | null;
  submittedByUserId?: string | null;
  paidAt?: Date | null;
  paidByUserId?: string | null;
  cancelledByUserId?: string | null;
  reopenedAt?: Date | null;
  reopenedByUserId?: string | null;
  reopenReason?: string | null;
}

export interface CancelTransactionInput {
  cancellationReason?: string | null;
  updatedByUserId?: string | null;
  cancelledByUserId?: string | null;
}

export interface ListTransactionsQuery {
  page: number;
  limit: number;
  sortBy?: 'transactionDate' | 'createdAt' | 'status';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  transactionNumber?: string;
  direction?: TransactionDirection;
  status?: TransactionStatus;
  locationType?: TransactionLocationType;
  branchId?: string;
  warehouseId?: string;
  tripId?: string;
  fromDate?: Date;
  toDate?: Date;
  includeArchived?: boolean;
}

export interface TransactionAssignmentView {
  transactionId: string;
  employeeId: string;
  assignedAt: Date;
}

export interface TripOutboundItemLine {
  materialName: string;
  unit: TransactionItemUnit;
  weight: number;
}

export interface TransactionDetail {
  transaction: TransactionEntity;
  items: TransactionItemEntity[];
  attachments: TransactionAttachmentEntity[];
  assignments: TransactionAssignmentView[];
}

export interface TransactionSummaryRow {
  transaction: TransactionEntity;
  itemCount: number;
  totalAmount: number;
  assignedEmployeeIds: string[];
}

export interface ListTransactionsResult {
  items: TransactionSummaryRow[];
  total: number;
}

export interface TransactionRepository {
  create(input: CreateTransactionInput): Promise<TransactionDetail>;
  findById(transactionId: string, companyId: string): Promise<TransactionEntity | null>;
  findByTransactionNumber(
    transactionNumber: string,
    companyId: string,
  ): Promise<TransactionEntity | null>;
  findByIdIncludingArchived(
    transactionId: string,
    companyId: string,
  ): Promise<TransactionEntity | null>;
  findDetailById(
    transactionId: string,
    companyId: string,
    options?: { includeArchived?: boolean },
  ): Promise<TransactionDetail | null>;
  update(
    transactionId: string,
    companyId: string,
    input: UpdateTransactionInput,
  ): Promise<TransactionDetail>;
  cancel(
    transactionId: string,
    companyId: string,
    input: CancelTransactionInput,
  ): Promise<TransactionEntity>;
  archive(transactionId: string, companyId: string): Promise<TransactionEntity>;
  isEmployeeAssigned(transactionId: string, employeeId: string): Promise<boolean>;
  listOutboundItemLinesByTrip(tripId: string, companyId: string): Promise<TripOutboundItemLine[]>;
  listByCompany(companyId: string, query: ListTransactionsQuery): Promise<ListTransactionsResult>;
  listAssigned(
    companyId: string,
    employeeId: string,
    query: ListTransactionsQuery,
  ): Promise<ListTransactionsResult>;
}

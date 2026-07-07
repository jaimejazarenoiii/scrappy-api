import type { TransactionDirection } from '../../domain/transaction-direction.js';
import type { TransactionStatus } from '../../domain/transaction-status.js';
import type { TransactionLocationType } from '../../domain/transaction-location-type.js';
import type { TransactionSummaryRow } from '../../domain/transaction.repository.js';
import {
  toDirectionLabel,
  type TransactionDirectionLabel,
} from '../../../../shared/transactions/direction-mapper.js';

export interface TransactionSummaryResponseDto {
  id: string;
  companyId: string;
  createdByUserId: string;
  updatedByUserId: string | null;
  direction: TransactionDirection;
  directionLabel: TransactionDirectionLabel;
  status: TransactionStatus;
  partyName: string;
  partyContactNumber: string | null;
  transactionDate: Date;
  locationType: TransactionLocationType;
  branchId: string | null;
  warehouseId: string | null;
  outsideLocationName: string | null;
  outsideAddress: string | null;
  tripId: string | null;
  notes: string | null;
  itemCount: number;
  totalAmount: number;
  assignedEmployeeIds: string[];
  cancellationReason: string | null;
  cancelledAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export function buildTransactionSummaryResponse(
  row: TransactionSummaryRow,
): TransactionSummaryResponseDto {
  const props = row.transaction.toPrimitives();
  return {
    ...props,
    directionLabel: toDirectionLabel(props.direction),
    itemCount: row.itemCount,
    totalAmount: row.totalAmount,
    assignedEmployeeIds: row.assignedEmployeeIds,
  };
}

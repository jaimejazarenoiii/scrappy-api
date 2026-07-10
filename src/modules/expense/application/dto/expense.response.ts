import type { ExpenseStatus } from '../../domain/expense-status.js';
import type { ExpenseContextType } from '../../domain/expense-context-type.js';
import type { ExpenseDetail, ExpenseSummaryRow } from '../../domain/expense.repository.js';
import {
  buildExpenseAttachmentResponse,
  type ExpenseAttachmentResponseDto,
} from './expense-attachment.response.js';

export interface ExpenseSummaryResponseDto {
  id: string;
  companyId: string;
  expenseNumber: string;
  expenseDate: Date;
  category: string;
  amount: number;
  description: string;
  status: ExpenseStatus;
  contextType: ExpenseContextType;
  branchId: string | null;
  warehouseId: string | null;
  vehicleId: string | null;
  tripId: string | null;
  attachmentCount: number;
  createdByEmployeeId: string | null;
  createdAt: Date;
}

export interface ExpenseDetailResponseDto extends ExpenseSummaryResponseDto {
  recordedAt: Date | null;
  cancelledAt: Date | null;
  cancellationReason: string | null;
  attachments: ExpenseAttachmentResponseDto[];
  updatedAt: Date;
  deletedAt: Date | null;
}

export function buildExpenseSummaryResponse(row: ExpenseSummaryRow): ExpenseSummaryResponseDto {
  const props = row.expense.toPrimitives();
  return {
    id: props.id,
    companyId: props.companyId,
    expenseNumber: props.expenseNumber,
    expenseDate: props.expenseDate,
    category: props.category,
    amount: props.amount,
    description: props.description,
    status: props.status,
    contextType: props.contextType,
    branchId: props.branchId,
    warehouseId: props.warehouseId,
    vehicleId: props.vehicleId,
    tripId: props.tripId,
    attachmentCount: row.attachmentCount,
    createdByEmployeeId: props.createdByEmployeeId,
    createdAt: props.createdAt,
  };
}

export function buildExpenseDetailResponse(detail: ExpenseDetail): ExpenseDetailResponseDto {
  const props = detail.expense.toPrimitives();
  return {
    ...buildExpenseSummaryResponse({
      expense: detail.expense,
      attachmentCount: detail.attachments.length,
    }),
    recordedAt: props.recordedAt,
    cancelledAt: props.cancelledAt,
    cancellationReason: props.cancellationReason,
    attachments: detail.attachments.map(buildExpenseAttachmentResponse),
    updatedAt: props.updatedAt,
    deletedAt: props.deletedAt,
  };
}

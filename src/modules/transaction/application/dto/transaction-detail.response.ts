import type { TransactionProps } from '../../domain/transaction.entity.js';
import type { TransactionDetail } from '../../domain/transaction.repository.js';
import {
  toDirectionLabel,
  type TransactionDirectionLabel,
} from '../../../../shared/transactions/direction-mapper.js';
import {
  buildTransactionItemResponse,
  type TransactionItemResponseDto,
} from './transaction-item.response.js';
import {
  buildTransactionAttachmentResponse,
  type TransactionAttachmentResponseDto,
} from './transaction-attachment.response.js';

export interface TransactionAssignmentResponseDto {
  employeeId: string;
  assignedAt: Date;
}

export interface TransactionDetailResponseDto extends TransactionProps {
  directionLabel: TransactionDirectionLabel;
  totalAmount: number;
  items: TransactionItemResponseDto[];
  attachments: TransactionAttachmentResponseDto[];
  assignedEmployeeIds: string[];
  assignments: TransactionAssignmentResponseDto[];
}

export function buildTransactionDetailResponse(
  detail: TransactionDetail,
): TransactionDetailResponseDto {
  const props = detail.transaction.toPrimitives();
  const items = detail.items.map(buildTransactionItemResponse);
  const totalAmount = Math.round(items.reduce((sum, item) => sum + item.total, 0) * 100) / 100;
  return {
    ...props,
    directionLabel: toDirectionLabel(props.direction),
    totalAmount,
    items,
    attachments: detail.attachments.map(buildTransactionAttachmentResponse),
    assignedEmployeeIds: detail.assignments.map((assignment) => assignment.employeeId),
    assignments: detail.assignments.map((assignment) => ({
      employeeId: assignment.employeeId,
      assignedAt: assignment.assignedAt,
    })),
  };
}

import type { Transaction as PrismaTransaction } from '@prisma/client';
import { TransactionEntity } from '../../domain/transaction.entity.js';

export function toTransactionDomain(record: PrismaTransaction): TransactionEntity {
  return TransactionEntity.create({
    id: record.id,
    companyId: record.companyId,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
    transactionNumber: record.transactionNumber,
    direction: record.direction,
    status: record.status,
    partyName: record.partyName,
    partyContactNumber: record.partyContactNumber,
    transactionDate: record.transactionDate,
    locationType: record.locationType,
    branchId: record.branchId,
    warehouseId: record.warehouseId,
    outsideLocationName: record.outsideLocationName,
    outsideAddress: record.outsideAddress,
    tripId: record.tripId,
    notes: record.notes,
    submittedAt: record.submittedAt,
    submittedByUserId: record.submittedByUserId,
    paidAt: record.paidAt,
    paidByUserId: record.paidByUserId,
    cancellationReason: record.cancellationReason,
    cancelledAt: record.cancelledAt,
    cancelledByUserId: record.cancelledByUserId,
    reopenedAt: record.reopenedAt,
    reopenedByUserId: record.reopenedByUserId,
    reopenReason: record.reopenReason,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

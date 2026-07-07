import type { Transaction as PrismaTransaction } from '@prisma/client';
import { TransactionEntity } from '../../domain/transaction.entity.js';

export function toTransactionDomain(record: PrismaTransaction): TransactionEntity {
  return TransactionEntity.create({
    id: record.id,
    companyId: record.companyId,
    createdByUserId: record.createdByUserId,
    updatedByUserId: record.updatedByUserId,
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
    cancellationReason: record.cancellationReason,
    cancelledAt: record.cancelledAt,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

import type { TransactionItem as PrismaTransactionItem } from '@prisma/client';
import { TransactionItemEntity } from '../../domain/transaction-item.entity.js';

export function toTransactionItemDomain(record: PrismaTransactionItem): TransactionItemEntity {
  return TransactionItemEntity.create({
    id: record.id,
    transactionId: record.transactionId,
    materialName: record.materialName,
    weight: Number(record.weight),
    unit: record.unit,
    price: Number(record.price),
    total: Number(record.total),
    notes: record.notes,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
  });
}

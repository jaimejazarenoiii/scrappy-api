import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import type {
  CreateTransactionItemInput,
  TransactionItemRepository,
  UpdateTransactionItemInput,
} from '../domain/transaction-item.repository.js';
import { toTransactionItemDomain } from './mappers/transaction-item.mapper.js';

export class TransactionItemPrismaRepository implements TransactionItemRepository {
  async create(input: CreateTransactionItemInput) {
    const record = await prisma.transactionItem.create({
      data: {
        id: input.id,
        transactionId: input.transactionId,
        materialName: input.materialName,
        weight: input.weight,
        unit: input.unit,
        price: input.price,
        total: input.total,
        notes: input.notes ?? null,
      },
    });
    return toTransactionItemDomain(record);
  }

  async findById(itemId: string, transactionId: string) {
    const record = await prisma.transactionItem.findFirst({
      where: { id: itemId, transactionId },
    });
    return record ? toTransactionItemDomain(record) : null;
  }

  async update(itemId: string, transactionId: string, input: UpdateTransactionItemInput) {
    const existing = await this.findById(itemId, transactionId);
    if (!existing) throw new ResourceNotFoundError('Transaction item not found');
    const record = await prisma.transactionItem.update({
      where: { id: itemId },
      data: {
        materialName: input.materialName,
        weight: input.weight,
        unit: input.unit,
        price: input.price,
        total: input.total,
        notes: input.notes,
      },
    });
    return toTransactionItemDomain(record);
  }

  async delete(itemId: string, transactionId: string) {
    const existing = await this.findById(itemId, transactionId);
    if (!existing) throw new ResourceNotFoundError('Transaction item not found');
    await prisma.transactionItem.delete({ where: { id: itemId } });
  }

  async listByTransaction(transactionId: string) {
    const records = await prisma.transactionItem.findMany({
      where: { transactionId },
      orderBy: { createdAt: 'asc' },
    });
    return records.map(toTransactionItemDomain);
  }

  async countByTransaction(transactionId: string) {
    return prisma.transactionItem.count({ where: { transactionId } });
  }
}

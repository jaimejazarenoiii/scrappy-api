import type { Prisma } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import type {
  MaterialSuggestion,
  PriceSuggestion,
  TransactionSuggestionRepository,
} from '../domain/transaction-suggestion.repository.js';

export class TransactionSuggestionPrismaRepository implements TransactionSuggestionRepository {
  async suggestMaterials(
    companyId: string,
    prefix: string | undefined,
    limit: number,
  ): Promise<MaterialSuggestion[]> {
    const where: Prisma.TransactionItemWhereInput = {
      transaction: { companyId, deletedAt: null },
    };
    if (prefix) {
      where.materialName = { contains: prefix, mode: 'insensitive' };
    }

    const groups = await prisma.transactionItem.groupBy({
      by: ['materialName'],
      where,
      _max: { createdAt: true },
      _count: { materialName: true },
    });

    return groups
      .map((group) => ({
        materialName: group.materialName,
        lastUsedAt: group._max.createdAt ?? new Date(0),
        usageCount: group._count.materialName,
      }))
      .sort((a, b) => {
        const diff = b.lastUsedAt.getTime() - a.lastUsedAt.getTime();
        if (diff !== 0) return diff;
        return a.materialName.localeCompare(b.materialName);
      })
      .slice(0, limit);
  }

  async suggestPrices(
    companyId: string,
    materialName: string,
    limit: number,
  ): Promise<PriceSuggestion[]> {
    const groups = await prisma.transactionItem.groupBy({
      by: ['price'],
      where: {
        materialName: { equals: materialName, mode: 'insensitive' },
        transaction: { companyId, deletedAt: null },
      },
      _max: { createdAt: true },
    });

    return groups
      .map((group) => ({
        price: Number(group.price),
        lastUsedAt: group._max.createdAt ?? new Date(0),
      }))
      .sort((a, b) => b.lastUsedAt.getTime() - a.lastUsedAt.getTime())
      .slice(0, limit);
  }
}

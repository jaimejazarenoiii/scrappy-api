import { prisma } from '../../../database/prisma.client.js';
import type { ExpenseCategoryRepository } from '../domain/expense-category.repository.js';

export class ExpenseCategoryPrismaRepository implements ExpenseCategoryRepository {
  async listByCompany(companyId: string): Promise<string[]> {
    const rows = await prisma.expenseCategory.findMany({
      where: { companyId },
      orderBy: [{ sortOrder: 'asc' }, { name: 'asc' }],
      select: { name: true },
    });
    return rows.map((row) => row.name);
  }
}

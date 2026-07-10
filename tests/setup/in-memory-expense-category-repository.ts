import { DEFAULT_EXPENSE_CATEGORIES } from '../../src/modules/expense/domain/expense-categories.js';
import type { ExpenseCategoryRepository } from '../../src/modules/expense/domain/expense-category.repository.js';

export class InMemoryExpenseCategoryRepository implements ExpenseCategoryRepository {
  private readonly byCompany = new Map<string, string[]>();

  seed(companyId: string, names: readonly string[]): void {
    this.byCompany.set(companyId, [...names]);
  }

  async listByCompany(companyId: string): Promise<string[]> {
    return this.byCompany.get(companyId) ?? [...DEFAULT_EXPENSE_CATEGORIES];
  }
}

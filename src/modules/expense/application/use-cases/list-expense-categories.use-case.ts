import {
  DEFAULT_EXPENSE_CATEGORIES,
  mergeExpenseCategories,
} from '../../domain/expense-categories.js';
import type { ExpenseCategoryRepository } from '../../domain/expense-category.repository.js';
import type { ExpenseRepository } from '../../domain/expense.repository.js';

export class ListExpenseCategoriesUseCase {
  constructor(
    private readonly expenseCategoryRepository: ExpenseCategoryRepository,
    private readonly expenseRepository: ExpenseRepository,
  ) {}

  async execute(companyId: string): Promise<string[]> {
    const [catalog, used] = await Promise.all([
      this.expenseCategoryRepository.listByCompany(companyId),
      this.expenseRepository.listDistinctCategories(companyId),
    ]);
    const base = catalog.length > 0 ? catalog : [...DEFAULT_EXPENSE_CATEGORIES];
    return mergeExpenseCategories(base, used);
  }
}

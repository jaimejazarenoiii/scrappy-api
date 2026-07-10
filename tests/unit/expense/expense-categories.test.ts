import { describe, expect, it } from 'vitest';
import {
  DEFAULT_EXPENSE_CATEGORIES,
  mergeExpenseCategories,
} from '../../../src/modules/expense/domain/expense-categories.js';

describe('mergeExpenseCategories', () => {
  it('returns defaults when no company categories exist', () => {
    expect(mergeExpenseCategories(DEFAULT_EXPENSE_CATEGORIES, [])).toEqual([
      ...DEFAULT_EXPENSE_CATEGORIES,
    ]);
  });

  it('appends custom categories and deduplicates case-insensitively', () => {
    expect(mergeExpenseCategories(DEFAULT_EXPENSE_CATEGORIES, ['fuel', 'Custom'])).toEqual([
      ...DEFAULT_EXPENSE_CATEGORIES,
      'Custom',
    ]);
  });
});

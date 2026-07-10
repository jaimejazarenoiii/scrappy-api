/** Suggested categories for expense forms; companies may also use free-form values. */
export const DEFAULT_EXPENSE_CATEGORIES = [
  'Fuel',
  'Maintenance',
  'Supplies',
  'Travel',
  'Meals',
  'Utilities',
  'Rent',
  'Salaries',
  'Other',
] as const;

export function mergeExpenseCategories(defaults: readonly string[], used: string[]): string[] {
  const seen = new Set<string>();
  const merged: string[] = [];

  for (const category of [...defaults, ...used.sort((left, right) => left.localeCompare(right))]) {
    const key = category.trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    merged.push(category.trim());
  }

  return merged;
}

/** Default expense categories for ops scripts (kept in scripts/ so Docker runtime needs no src/). */
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

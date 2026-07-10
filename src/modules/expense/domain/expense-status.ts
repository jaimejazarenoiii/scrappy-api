export const EXPENSE_STATUSES = ['DRAFT', 'RECORDED', 'CANCELLED'] as const;
export type ExpenseStatus = (typeof EXPENSE_STATUSES)[number];

export const EXPENSE_CONTEXT_TYPES = ['COMPANY', 'BRANCH', 'WAREHOUSE', 'VEHICLE', 'TRIP'] as const;
export type ExpenseContextType = (typeof EXPENSE_CONTEXT_TYPES)[number];

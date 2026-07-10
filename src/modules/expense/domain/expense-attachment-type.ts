export const EXPENSE_ATTACHMENT_TYPES = ['PHOTO'] as const;
export type ExpenseAttachmentType = (typeof EXPENSE_ATTACHMENT_TYPES)[number];

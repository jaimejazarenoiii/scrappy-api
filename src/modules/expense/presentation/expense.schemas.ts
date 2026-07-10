import { z } from 'zod';
import { positiveAmountSchema } from '../../../validations/workforce.schemas.js';
import { expenseListQuerySchema } from '../../../validations/common-query.schemas.js';
import { EXPENSE_CONTEXT_TYPES } from '../domain/expense-context-type.js';

const expenseContextTypeSchema = z.enum(EXPENSE_CONTEXT_TYPES);

function validateContextShape(
  data: {
    contextType: string;
    branchId?: string | null;
    warehouseId?: string | null;
    vehicleId?: string | null;
    tripId?: string | null;
  },
  ctx: z.RefinementCtx,
): void {
  const fkCount = [data.branchId, data.warehouseId, data.vehicleId, data.tripId].filter(
    Boolean,
  ).length;
  if (data.contextType === 'COMPANY' && fkCount > 0) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'COMPANY context must not include reference IDs.',
      path: ['contextType'],
    });
  }
  if (data.contextType === 'BRANCH' && !data.branchId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'branchId is required.',
      path: ['branchId'],
    });
  }
  if (data.contextType === 'WAREHOUSE' && !data.warehouseId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'warehouseId is required.',
      path: ['warehouseId'],
    });
  }
  if (data.contextType === 'VEHICLE' && !data.vehicleId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'vehicleId is required.',
      path: ['vehicleId'],
    });
  }
  if (data.contextType === 'TRIP' && !data.tripId) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'tripId is required.', path: ['tripId'] });
  }
}

export const createExpenseSchema = z
  .object({
    expenseDate: z.coerce.date(),
    category: z.string().trim().min(1).max(200),
    amount: positiveAmountSchema,
    description: z.string().trim().min(1).max(2000),
    contextType: expenseContextTypeSchema,
    branchId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    vehicleId: z.string().uuid().optional(),
    tripId: z.string().uuid().optional(),
    recordImmediately: z.boolean().optional(),
  })
  .superRefine(validateContextShape);

export const updateExpenseSchema = z
  .object({
    expenseDate: z.coerce.date().optional(),
    category: z.string().trim().min(1).max(200).optional(),
    amount: positiveAmountSchema.optional(),
    description: z.string().trim().min(1).max(2000).optional(),
    contextType: expenseContextTypeSchema.optional(),
    branchId: z.string().uuid().nullable().optional(),
    warehouseId: z.string().uuid().nullable().optional(),
    vehicleId: z.string().uuid().nullable().optional(),
    tripId: z.string().uuid().nullable().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.contextType) {
      validateContextShape(
        {
          contextType: data.contextType,
          branchId: data.branchId,
          warehouseId: data.warehouseId,
          vehicleId: data.vehicleId,
          tripId: data.tripId,
        },
        ctx,
      );
    }
  });

export const recordExpenseSchema = z
  .object({
    note: z.string().trim().max(500).optional(),
  })
  .default({});

export const cancelExpenseSchema = z.object({
  reason: z.string().trim().min(1).max(500),
});

export const archiveExpenseSchema = z
  .object({
    reason: z.string().trim().max(500).optional(),
  })
  .default({});

export const expenseIdParamsSchema = z.object({
  expenseId: z.string().uuid(),
});

export const expenseNumberParamsSchema = z.object({
  expenseNumber: z.string().min(1).max(32),
});

export const expenseAttachmentParamsSchema = z.object({
  expenseId: z.string().uuid(),
  attachmentId: z.string().uuid(),
});

export { expenseListQuerySchema };
export type ExpenseListQuery = z.infer<typeof expenseListQuerySchema>;

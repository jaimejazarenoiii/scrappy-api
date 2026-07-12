import { z } from 'zod';
import { transactionListQuerySchema } from '../../../validations/common-query.schemas.js';
import { TRANSACTION_ITEM_UNITS } from '../domain/transaction-item-unit.js';

const directionSchema = z.enum(['INBOUND', 'OUTBOUND', 'BUY', 'SELL']);
const locationTypeSchema = z.enum(['BRANCH', 'WAREHOUSE', 'OUTSIDE', 'TRIP']);
const unitSchema = z.enum(TRANSACTION_ITEM_UNITS);

const itemInputSchema = z.object({
  materialName: z.string().min(1).max(200),
  weight: z.coerce.number().positive(),
  unit: unitSchema,
  price: z.coerce.number().min(0),
  total: z.coerce.number().min(0).optional(),
  notes: z.string().max(500).optional(),
});

function assertLocationShape(
  value: {
    locationType: 'BRANCH' | 'WAREHOUSE' | 'OUTSIDE' | 'TRIP';
    branchId?: string;
    warehouseId?: string;
    outsideLocationName?: string;
    outsideAddress?: string;
    tripId?: string;
  },
  ctx: z.RefinementCtx,
): void {
  if (value.locationType === 'BRANCH' && !value.branchId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['branchId'],
      message: 'branchId is required for BRANCH transactions.',
    });
  }
  if (value.locationType === 'WAREHOUSE' && !value.warehouseId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['warehouseId'],
      message: 'warehouseId is required for WAREHOUSE transactions.',
    });
  }
  if (value.locationType === 'OUTSIDE') {
    if (!value.outsideLocationName) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outsideLocationName'],
        message: 'outsideLocationName is required for OUTSIDE transactions.',
      });
    }
    if (!value.outsideAddress) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['outsideAddress'],
        message: 'outsideAddress is required for OUTSIDE transactions.',
      });
    }
  }
  if (value.locationType === 'TRIP' && !value.tripId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tripId'],
      message: 'tripId is required for TRIP transactions.',
    });
  }
  if (value.locationType !== 'TRIP' && value.tripId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['tripId'],
      message: 'tripId is only allowed when locationType is TRIP.',
    });
  }
}

export const createTransactionSchema = z
  .object({
    direction: directionSchema,
    partyName: z.string().min(1).max(200),
    partyContactNumber: z.string().max(50).optional(),
    transactionDate: z.coerce.date().optional(),
    locationType: locationTypeSchema,
    branchId: z.string().uuid().optional(),
    warehouseId: z.string().uuid().optional(),
    outsideLocationName: z.string().max(200).optional(),
    outsideAddress: z.string().max(500).optional(),
    tripId: z.string().uuid().optional(),
    notes: z.string().max(2000).optional(),
    assignedEmployeeIds: z.array(z.string().uuid()).min(1).max(50),
    // Drafts may start with no line items; finish/settle enforce at least one.
    items: z.array(itemInputSchema).max(200).default([]),
  })
  .superRefine(assertLocationShape);

export const updateTransactionSchema = z
  .object({
    direction: directionSchema.optional(),
    partyName: z.string().min(1).max(200).optional(),
    partyContactNumber: z.string().max(50).nullable().optional(),
    transactionDate: z.coerce.date().optional(),
    locationType: locationTypeSchema.optional(),
    branchId: z.string().uuid().nullable().optional(),
    warehouseId: z.string().uuid().nullable().optional(),
    outsideLocationName: z.string().max(200).nullable().optional(),
    outsideAddress: z.string().max(500).nullable().optional(),
    tripId: z.string().uuid().nullable().optional(),
    notes: z.string().max(2000).nullable().optional(),
    assignedEmployeeIds: z.array(z.string().uuid()).min(1).max(50).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const cancelTransactionSchema = z
  .object({
    cancellationReason: z.string().max(500).optional(),
  })
  .default({});

export const returnToDraftSchema = z
  .object({
    reason: z.string().max(500).optional(),
  })
  .default({});

export const settleTransactionSchema = z
  .object({
    settlementNote: z.string().max(500).optional(),
  })
  .default({});

export const reopenTransactionSchema = z.object({
  reason: z.string().min(1).max(1000),
});

export const createTransactionItemSchema = itemInputSchema;

export const updateTransactionItemSchema = z
  .object({
    materialName: z.string().min(1).max(200).optional(),
    weight: z.coerce.number().positive().optional(),
    unit: unitSchema.optional(),
    price: z.coerce.number().min(0).optional(),
    total: z.coerce.number().min(0).optional(),
    notes: z.string().max(500).nullable().optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field is required.',
  });

export const listTransactionsQuerySchema = transactionListQuerySchema;

export const materialSuggestionQuerySchema = z.object({
  q: z.string().max(200).optional(),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const priceSuggestionQuerySchema = z.object({
  materialName: z.string().min(1).max(200),
  limit: z.coerce.number().int().positive().max(50).default(10),
});

export const transactionIdParamsSchema = z.object({
  transactionId: z.string().uuid(),
});

export const transactionNumberParamsSchema = z.object({
  transactionNumber: z.string().regex(/^(IN|OUT)-\d{8}-\d{6}$/),
});

export const transactionItemParamsSchema = z.object({
  transactionId: z.string().uuid(),
  itemId: z.string().uuid(),
});

export const transactionAttachmentParamsSchema = z.object({
  transactionId: z.string().uuid(),
  attachmentId: z.string().uuid(),
});

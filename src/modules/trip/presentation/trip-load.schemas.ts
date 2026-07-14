import { z } from 'zod';
import { TRANSACTION_ITEM_UNITS } from '../../transaction/domain/transaction-item-unit.js';

const unitSchema = z.enum(TRANSACTION_ITEM_UNITS);
const quantitySchema = z.number().positive();
const materialNameSchema = z.string().trim().min(1).max(200);
const notesSchema = z.string().trim().max(2000);

export const tripLoadIdParamsSchema = z.object({
  tripId: z.string().uuid(),
});

export const tripLoadItemIdParamsSchema = z.object({
  tripId: z.string().uuid(),
  itemId: z.string().uuid(),
});

const tripLoadItemInputSchema = z.object({
  materialName: materialNameSchema,
  quantity: quantitySchema,
  unit: unitSchema,
  notes: notesSchema.nullish(),
});

export const createTripLoadSchema = z.object({
  notes: notesSchema.nullish(),
  items: z.array(tripLoadItemInputSchema).min(1),
});

export const updateTripLoadSchema = z.object({
  notes: notesSchema.nullish(),
});

export const createTripLoadItemSchema = tripLoadItemInputSchema;

export const updateTripLoadItemSchema = z
  .object({
    materialName: materialNameSchema.optional(),
    quantity: quantitySchema.optional(),
    unit: unitSchema.optional(),
    notes: notesSchema.nullish(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: 'At least one field must be provided.',
  });

export const enableTripLoadSchema = z.object({
  strictLoadValidation: z.boolean().optional(),
});

export const updateTripLoadSettingsSchema = z.object({
  defaultStrictLoadValidation: z.boolean().optional(),
});

export type CreateTripLoadBody = z.infer<typeof createTripLoadSchema>;
export type UpdateTripLoadBody = z.infer<typeof updateTripLoadSchema>;
export type CreateTripLoadItemBody = z.infer<typeof createTripLoadItemSchema>;
export type UpdateTripLoadItemBody = z.infer<typeof updateTripLoadItemSchema>;
export type EnableTripLoadBody = z.infer<typeof enableTripLoadSchema>;
export type UpdateTripLoadSettingsBody = z.infer<typeof updateTripLoadSettingsSchema>;

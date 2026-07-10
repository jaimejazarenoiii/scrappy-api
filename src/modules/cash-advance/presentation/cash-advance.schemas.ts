import { z } from 'zod';
import { cashAdvanceListQuerySchema } from '../../../validations/common-query.schemas.js';
import {
  optionalNoteSchema,
  positiveAmountSchema,
} from '../../../validations/workforce.schemas.js';

export const createCashAdvanceSchema = z.object({
  employeeId: z.string().uuid(),
  amount: positiveAmountSchema,
  reason: optionalNoteSchema,
  issuedAt: z.coerce.date().optional(),
});

export const listCashAdvanceQuerySchema = cashAdvanceListQuerySchema;

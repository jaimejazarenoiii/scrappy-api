import { z } from 'zod';
import { payrollListQuerySchema } from '../../../validations/common-query.schemas.js';

export const generatePayrollSchema = z.object({
  payPeriodStart: z.coerce.date(),
  payPeriodEnd: z.coerce.date(),
  employeeIds: z.array(z.string().uuid()).optional(),
});

export const markPayrollPaidSchema = z
  .object({
    paymentReference: z.string().max(200).optional(),
  })
  .default({});

export const payrollIdParamsSchema = z.object({
  payrollId: z.string().uuid(),
});

export const listPayrollQuerySchema = payrollListQuerySchema;

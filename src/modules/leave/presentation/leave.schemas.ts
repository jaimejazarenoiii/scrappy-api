import { z } from 'zod';
import { leaveListQuerySchema } from '../../../validations/common-query.schemas.js';
import { leaveTypeSchema, optionalNoteSchema } from '../../../validations/workforce.schemas.js';

export const requestLeaveSchema = z.object({
  leaveType: leaveTypeSchema,
  leaveDate: z.coerce.date(),
  reason: optionalNoteSchema,
});

export const manageLeaveSchema = z
  .object({
    status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
    managerNote: z.string().max(1000).optional(),
  })
  .refine((value) => value.status !== undefined || value.managerNote !== undefined, {
    message: 'At least one field is required',
  });

export const leaveIdParamsSchema = z.object({
  leaveId: z.string().uuid(),
});

export const listLeaveQuerySchema = leaveListQuerySchema.extend({
  sortBy: z.enum(['leaveDate', 'createdAt']).optional(),
});

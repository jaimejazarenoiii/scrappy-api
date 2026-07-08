import { z } from 'zod';
import { attendanceListQuerySchema } from '../../../validations/common-query.schemas.js';
import { optionalNoteSchema } from '../../../validations/workforce.schemas.js';

export const timeInSchema = z
  .object({
    note: optionalNoteSchema,
  })
  .default({});

export const timeOutSchema = z
  .object({
    note: optionalNoteSchema,
  })
  .default({});

export const manageAttendanceSchema = z
  .object({
    correctionNote: z.string().max(1000).optional(),
    adjustedTimeInAt: z.string().datetime().optional(),
    adjustedTimeOutAt: z.string().datetime().optional(),
  })
  .refine(
    (value) =>
      value.correctionNote !== undefined ||
      value.adjustedTimeInAt !== undefined ||
      value.adjustedTimeOutAt !== undefined,
    { message: 'At least one field is required' },
  );

export const attendanceIdParamsSchema = z.object({
  attendanceId: z.string().uuid(),
});

export const listAttendanceQuerySchema = attendanceListQuerySchema;

export const attendanceDashboardQuerySchema = z.object({
  date: z.string().date().optional(),
});

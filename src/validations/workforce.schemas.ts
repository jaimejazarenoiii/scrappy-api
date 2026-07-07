import { z } from 'zod';

export const positiveAmountSchema = z.coerce.number().positive();

export const leaveTypeSchema = z.enum(['HALF_DAY', 'FULL_DAY']);

export const optionalNoteSchema = z.string().max(500).optional();

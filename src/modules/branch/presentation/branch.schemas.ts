import { z } from 'zod';
import { branchListQuerySchema } from '../../../validations/common-query.schemas.js';
import {
  contactNumberSchema,
  nonEmptyStringSchema,
} from '../../../validations/organization.schemas.js';

export const branchIdParamsSchema = z.object({ branchId: z.string().uuid() });

export const createBranchSchema = z.object({
  name: nonEmptyStringSchema,
  address: nonEmptyStringSchema,
  contactNumber: contactNumberSchema,
  status: z.enum(['ACTIVE', 'INACTIVE']).default('ACTIVE'),
});

export const updateBranchSchema = z
  .object({
    name: nonEmptyStringSchema.optional(),
    address: nonEmptyStringSchema.optional(),
    contactNumber: contactNumberSchema.optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export const listBranchesQuerySchema = branchListQuerySchema;

import { z } from 'zod';
import { vehicleListQuerySchema } from '../../../validations/common-query.schemas.js';
import { nonEmptyStringSchema } from '../../../validations/organization.schemas.js';

export const vehicleIdParamsSchema = z.object({ vehicleId: z.string().uuid() });

export const createVehicleSchema = z.object({
  plateNumber: nonEmptyStringSchema,
  description: nonEmptyStringSchema,
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE']).default('AVAILABLE'),
});

export const updateVehicleSchema = z
  .object({
    plateNumber: nonEmptyStringSchema.optional(),
    description: nonEmptyStringSchema.optional(),
    status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export const listVehiclesQuerySchema = vehicleListQuerySchema;

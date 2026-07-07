import { z } from 'zod';

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  sortBy: z.string().optional(),
  sortOrder: z.enum(['asc', 'desc']).default('asc'),
  search: z.string().optional(),
});

export const locationStatusFilterSchema = z.enum(['ACTIVE', 'INACTIVE']).optional();

export const branchListQuerySchema = paginationQuerySchema.extend({
  status: locationStatusFilterSchema,
  sortBy: z.enum(['name', 'createdAt', 'status']).optional(),
});

export const warehouseListQuerySchema = paginationQuerySchema.extend({
  status: locationStatusFilterSchema,
  sortBy: z.enum(['name', 'createdAt', 'status']).optional(),
});

export const vehicleListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE']).optional(),
  sortBy: z.enum(['plateNumber', 'createdAt', 'status']).optional(),
});

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

const dateFilterSchema = z.coerce.date().optional();

export const attendanceListQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['timeInAt', 'createdAt']).optional(),
  fromDate: dateFilterSchema,
  toDate: dateFilterSchema,
  employeeId: z.string().uuid().optional(),
});

export const leaveListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['PENDING', 'APPROVED', 'REJECTED', 'CANCELLED']).optional(),
  fromDate: dateFilterSchema,
  toDate: dateFilterSchema,
  employeeId: z.string().uuid().optional(),
});

export const cashAdvanceListQuerySchema = paginationQuerySchema.extend({
  status: z.enum(['OUTSTANDING', 'SETTLED']).optional(),
  fromDate: dateFilterSchema,
  toDate: dateFilterSchema,
  employeeId: z.string().uuid().optional(),
});

export const payrollListQuerySchema = paginationQuerySchema.extend({
  payPeriodStart: dateFilterSchema,
  payPeriodEnd: dateFilterSchema,
  employeeId: z.string().uuid().optional(),
  sortBy: z.enum(['payPeriodStart', 'createdAt', 'status']).optional(),
});

const booleanFlagSchema = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true')
  .optional();

export const transactionListQuerySchema = paginationQuerySchema.extend({
  sortBy: z.enum(['transactionDate', 'createdAt', 'status']).optional(),
  direction: z.enum(['INBOUND', 'OUTBOUND']).optional(),
  status: z.enum(['DRAFT', 'READY_FOR_PAYMENT', 'PAID', 'CANCELLED']).optional(),
  transactionNumber: z.string().max(32).optional(),
  locationType: z.enum(['BRANCH', 'WAREHOUSE', 'OUTSIDE']).optional(),
  branchId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  fromDate: dateFilterSchema,
  toDate: dateFilterSchema,
  includeArchived: booleanFlagSchema,
});

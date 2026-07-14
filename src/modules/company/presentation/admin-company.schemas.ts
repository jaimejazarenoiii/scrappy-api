import { z } from 'zod';
import { employeeAccountCredentialsSchema } from '../../employee/presentation/employee.schemas.js';

export const adminCreateCompanySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
  contactNumber: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
});

export const adminCompanyListQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  search: z.string().min(1).optional(),
});

export type AdminCompanyListQuery = z.infer<typeof adminCompanyListQuerySchema>;

export const adminCompanyIdParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export const adminCompanyAccountParamsSchema = z.object({
  companyId: z.string().uuid(),
  userId: z.string().uuid(),
});

export const adminCreateCompanyAccountSchema = z.object({
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  employeeNumber: z.string().optional(),
  contactNumber: z.string().optional(),
  weeklySalary: z.coerce.number().nonnegative(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  account: employeeAccountCredentialsSchema,
});

export const adminResetCompanyAccountPasswordSchema = z.object({
  temporaryPassword: z.string().min(8),
});

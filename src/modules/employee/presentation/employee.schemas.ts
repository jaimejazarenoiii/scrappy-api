import { z } from 'zod';

export const employeeIdParamsSchema = z.object({ employeeId: z.string().uuid() });

export const createEmployeeSchema = z.object({
  userId: z.string().uuid().optional(),
  employeeNumber: z.string().optional(),
  firstName: z.string().min(1),
  middleName: z.string().optional(),
  lastName: z.string().min(1),
  suffix: z.string().optional(),
  contactNumber: z.string().optional(),
  weeklySalary: z.coerce.number().nonnegative(),
  status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
});

export const updateEmployeeSchema = z
  .object({
    userId: z.string().uuid().nullable().optional(),
    employeeNumber: z.string().nullable().optional(),
    firstName: z.string().min(1).optional(),
    middleName: z.string().nullable().optional(),
    lastName: z.string().min(1).optional(),
    suffix: z.string().nullable().optional(),
    contactNumber: z.string().nullable().optional(),
    weeklySalary: z.coerce.number().nonnegative().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export const linkEmployeeUserSchema = z.object({ userId: z.string().uuid() });

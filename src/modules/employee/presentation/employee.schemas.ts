import { z } from 'zod';

export const employeeIdParamsSchema = z.object({ employeeId: z.string().uuid() });

export const employeeAccountCredentialsSchema = z
  .object({
    email: z.string().email(),
    password: z.string().min(8),
    confirmPassword: z.string().min(8),
    role: z.enum(['OWNER', 'MANAGER', 'EMPLOYEE']),
  })
  .superRefine((value, ctx) => {
    if (value.password !== value.confirmPassword) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['confirmPassword'],
        message: 'Password confirmation does not match.',
      });
    }
  });

export const createEmployeeSchema = z
  .object({
    userId: z.string().uuid().optional(),
    employeeNumber: z.string().optional(),
    firstName: z.string().min(1),
    middleName: z.string().optional(),
    lastName: z.string().min(1),
    suffix: z.string().optional(),
    contactNumber: z.string().optional(),
    weeklySalary: z.coerce.number().nonnegative(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
    createAccount: z.boolean().optional().default(false),
    account: employeeAccountCredentialsSchema.optional(),
  })
  .superRefine((value, ctx) => {
    if (value.createAccount) {
      if (!value.account) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['account'],
          message: 'account is required when createAccount is true.',
        });
      }
      if (value.userId) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          path: ['userId'],
          message: 'userId cannot be combined with createAccount.',
        });
      }
    } else if (value.account) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['account'],
        message: 'account is only allowed when createAccount is true.',
      });
    }
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

export const grantSystemAccessSchema = employeeAccountCredentialsSchema;

/** Admin reset accepts empty body only — clients must not supply a temporary password. */
export const resetEmployeePasswordSchema = z.preprocess(
  (value) => (value === undefined || value === null ? {} : value),
  z.object({}).strict(),
);

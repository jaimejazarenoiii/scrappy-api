import { z } from 'zod';

export const createCompanySchema = z.object({
  name: z.string().min(1),
  logoUrl: z.string().url().optional(),
  contactNumber: z.string().min(1).optional(),
  email: z.string().email().optional(),
  address: z.string().min(1).optional(),
  ownerFullName: z.string().min(1),
  ownerEmail: z.string().email(),
  ownerPassword: z.string().min(8),
});

export const updateCompanySchema = z
  .object({
    name: z.string().min(1).optional(),
    logoUrl: z.string().url().nullable().optional(),
    contactNumber: z.string().min(1).nullable().optional(),
    email: z.string().email().nullable().optional(),
    address: z.string().min(1).nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE']).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, { message: 'At least one field is required' });

export const companyIdParamsSchema = z.object({ companyId: z.string().uuid() });

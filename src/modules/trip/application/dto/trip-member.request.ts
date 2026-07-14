import { z } from 'zod';
import { TRIP_MEMBER_ROLES } from '../../domain/trip-member-role.js';

export const addTripMembersSchema = z
  .object({
    employeeId: z.string().uuid().optional(),
    employeeIds: z.array(z.string().uuid()).optional(),
    role: z.enum(TRIP_MEMBER_ROLES).default('DRIVER'),
  })
  .superRefine((data, ctx) => {
    const hasSingle = Boolean(data.employeeId);
    const hasBulk = Boolean(data.employeeIds?.length);
    if (!hasSingle && !hasBulk) {
      ctx.addIssue({
        code: 'custom',
        message: 'employeeId or employeeIds is required',
        path: ['employeeIds'],
      });
    }
    if (hasSingle && hasBulk) {
      ctx.addIssue({
        code: 'custom',
        message: 'Provide either employeeId or employeeIds, not both',
        path: ['employeeIds'],
      });
    }
  })
  .transform((data) => ({
    members: data.employeeId
      ? [{ employeeId: data.employeeId, role: data.role }]
      : (data.employeeIds ?? []).map((employeeId) => ({ employeeId, role: data.role })),
  }));

export type AddTripMembersRequestDto = z.infer<typeof addTripMembersSchema>;

export const updateTripMemberSchema = z.object({
  role: z.enum(TRIP_MEMBER_ROLES),
});

export type UpdateTripMemberRequestDto = z.infer<typeof updateTripMemberSchema>;

export const tripMemberParamsSchema = z.object({
  tripId: z.string().uuid(),
  memberId: z.string().uuid(),
});

export type TripMemberParams = z.infer<typeof tripMemberParamsSchema>;

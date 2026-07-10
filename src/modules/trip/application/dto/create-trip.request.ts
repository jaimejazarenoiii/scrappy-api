import { z } from 'zod';
import { TRIP_MEMBER_ROLES } from '../../domain/trip-member-role.js';

const tripMemberCreateSchema = z.object({
  employeeId: z.string().uuid(),
  role: z.enum(TRIP_MEMBER_ROLES),
});

export const createTripSchema = z.object({
  vehicleId: z.string().uuid(),
  scheduledStart: z.coerce.date(),
  origin: z.string().trim().min(1).max(500),
  destination: z.string().trim().min(1).max(500),
  notes: z.string().trim().max(2000).nullable().optional(),
  members: z.array(tripMemberCreateSchema).optional(),
});

export type CreateTripRequestDto = z.infer<typeof createTripSchema>;

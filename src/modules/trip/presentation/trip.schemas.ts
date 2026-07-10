import { z } from 'zod';
import { TRIP_STATUSES } from '../domain/trip-status.js';

export {
  createTripSchema,
  type CreateTripRequestDto,
} from '../application/dto/create-trip.request.js';

const sortBySchema = z
  .enum(['scheduledStart', 'createdAt', 'tripNumber', 'scheduledStartAt'])
  .transform((value) => (value === 'scheduledStartAt' ? 'scheduledStart' : value));

export const listTripsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: sortBySchema.default('scheduledStart'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  status: z.enum(TRIP_STATUSES).optional(),
  vehicleId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
  fromDate: z.coerce.date().optional(),
  toDate: z.coerce.date().optional(),
  tripNumber: z.string().trim().min(1).optional(),
  includeArchived: z.coerce.boolean().default(false),
});

export type ListTripsQuery = z.infer<typeof listTripsQuerySchema>;

export const tripIdParamsSchema = z.object({
  tripId: z.string().uuid(),
});

export const listTripTransactionsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  sortBy: z.enum(['transactionDate', 'createdAt', 'status']).default('transactionDate'),
  sortOrder: z.enum(['asc', 'desc']).default('desc'),
  includeArchived: z.coerce.boolean().default(false),
});

export type ListTripTransactionsQuery = z.infer<typeof listTripTransactionsQuerySchema>;

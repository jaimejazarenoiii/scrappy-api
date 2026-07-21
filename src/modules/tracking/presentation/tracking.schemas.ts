import { z } from 'zod';
import {
  batteryLevelSchema,
  capturedAtSchema,
  headingSchema,
  latitudeSchema,
  longitudeSchema,
} from '../../../shared/geo/latitude-longitude.schema.js';

export const upsertLocationBodySchema = z.object({
  latitude: latitudeSchema,
  longitude: longitudeSchema,
  capturedAt: capturedAtSchema,
  accuracy: z.number().min(0).optional(),
  speed: z.number().min(0).optional(),
  heading: headingSchema.optional(),
  batteryLevel: batteryLevelSchema.optional(),
  isMockLocation: z.boolean().optional(),
});

export const employeeIdParamsSchema = z.object({
  employeeId: z.string().uuid(),
});

export const tripIdParamsSchema = z.object({
  tripId: z.string().uuid(),
});

export const companyIdParamsSchema = z.object({
  companyId: z.string().uuid(),
});

export const listActiveLocationsQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
  tripId: z.string().uuid().optional(),
  employeeId: z.string().uuid().optional(),
});

export const wsSubscribeTripSchema = z.object({
  type: z.literal('subscribe:trip'),
  payload: z.object({ tripId: z.string().uuid() }),
});

export const wsSubscribeCompanySchema = z.object({
  type: z.literal('subscribe:company'),
});

export const wsSubscribeAdminCompanySchema = z.object({
  type: z.literal('subscribe:admin-company'),
  payload: z.object({ companyId: z.string().uuid() }),
});

export const wsLocationUpdateSchema = z.object({
  type: z.literal('location:update'),
  payload: upsertLocationBodySchema,
});

export const wsPingSchema = z.object({
  type: z.literal('ping'),
});

export const wsClientMessageSchema = z.discriminatedUnion('type', [
  wsSubscribeTripSchema,
  wsSubscribeCompanySchema,
  wsSubscribeAdminCompanySchema,
  wsLocationUpdateSchema,
  wsPingSchema,
]);

export const trackingSessionQuerySchema = z.object({
  lastKnownTripId: z.string().uuid().optional(),
});

export type UpsertLocationBody = z.infer<typeof upsertLocationBodySchema>;
export type ListActiveLocationsQuery = z.infer<typeof listActiveLocationsQuerySchema>;
export type TrackingSessionQuery = z.infer<typeof trackingSessionQuerySchema>;

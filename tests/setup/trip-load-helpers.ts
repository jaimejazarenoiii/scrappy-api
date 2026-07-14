import request from 'supertest';
import type { Express } from 'express';
import { makeVehiclePayload } from '../factories/vehicle.factory.js';

export async function createVehicle(app: Express, auth: Record<string, string>) {
  const response = await request(app).post('/api/v1/vehicles').set(auth).send(makeVehiclePayload());
  return response.body.data.id as string;
}

export async function createTrip(
  app: Express,
  auth: Record<string, string>,
  overrides: Record<string, unknown> = {},
) {
  const vehicleId = await createVehicle(app, auth);
  const response = await request(app)
    .post('/api/v1/trips')
    .set(auth)
    .send({
      vehicleId,
      scheduledStart: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      origin: 'Main warehouse',
      destination: 'Supplier site',
      ...overrides,
    });
  return response.body.data.id as string;
}

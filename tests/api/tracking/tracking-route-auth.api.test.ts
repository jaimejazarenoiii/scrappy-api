import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('tracking route auth API', () => {
  it('denies cross-tenant route access', async () => {
    const ctxA = createTestContext();
    const ctxB = createTestContext();
    const ownerA = await createCompanyAndLogin(ctxA.app);
    const ownerB = await createCompanyAndLogin(ctxB.app);
    const employeeB = await createLinkedEmployeeUser(
      ctxB.app,
      ctxB.userRepository,
      ctxB.employeeRepository,
      ownerB.companyId,
    );

    const vehicle = await request(ctxB.app)
      .post('/api/v1/vehicles')
      .set(ownerB.auth)
      .send(makeVehiclePayload());
    const trip = await request(ctxB.app)
      .post('/api/v1/trips')
      .set(ownerB.auth)
      .send({
        vehicleId: vehicle.body.data.id,
        scheduledStart: new Date(Date.now() + 60_000).toISOString(),
        origin: 'A',
        destination: 'B',
        members: [{ employeeId: employeeB.employeeId, role: 'DRIVER' }],
      });
    await request(ctxB.app)
      .post(`/api/v1/trips/${trip.body.data.id}/start`)
      .set(ownerB.auth)
      .send({});

    const response = await request(ctxA.app)
      .get(`/api/v1/trips/${trip.body.data.id}/tracking/route`)
      .set(ownerA.auth);

    expect([403, 404]).toContain(response.status);
  });

  it('returns 404 for unknown trip in tenant', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .get(`/api/v1/trips/${randomUUID()}/tracking/route`)
      .set(owner.auth);

    expect(response.status).toBe(404);
  });
});

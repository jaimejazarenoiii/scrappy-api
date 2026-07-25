import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import {
  createCompanyAndLogin,
  createLinkedEmployeeUser,
  createManagerUser,
} from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('tracking route roles API', () => {
  it('allows manager and denies employee', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const manager = await createManagerUser(app, userRepository, owner.companyId);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const trip = await request(app)
      .post('/api/v1/trips')
      .set(owner.auth)
      .send({
        vehicleId: vehicle.body.data.id,
        scheduledStart: new Date(Date.now() + 60_000).toISOString(),
        origin: 'A',
        destination: 'B',
        members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
      });
    await request(app).post(`/api/v1/trips/${trip.body.data.id}/start`).set(owner.auth).send({});

    const managerResponse = await request(app)
      .get(`/api/v1/trips/${trip.body.data.id}/tracking/route`)
      .set(manager.auth);
    expect(managerResponse.status).toBe(200);

    const employeeResponse = await request(app)
      .get(`/api/v1/trips/${trip.body.data.id}/tracking/route`)
      .set(employee.auth);
    expect(employeeResponse.status).toBe(403);
  });
});

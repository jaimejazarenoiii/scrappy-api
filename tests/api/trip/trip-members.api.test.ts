import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';
import { createTrip } from '../../setup/trip-load-helpers.js';

describe('trip members api', () => {
  it('adds members using employeeIds', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );
    const tripId = await createTrip(app, owner.auth);

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/members`)
      .set(owner.auth)
      .send({ employeeIds: [employee.employeeId] });

    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.members).toHaveLength(1);
    expect(response.body.data.members[0].employeeId).toBe(employee.employeeId);
    expect(response.body.data.members[0].role).toBe('DRIVER');
  });

  it('adds a single member using employeeId and role', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
    );
    const tripId = await createTrip(app, owner.auth);

    const response = await request(app)
      .post(`/api/v1/trips/${tripId}/members`)
      .set(owner.auth)
      .send({ employeeId: employee.employeeId, role: 'HELPER' });

    expect(response.status).toBe(201);
    expect(response.body.data.members[0].role).toBe('HELPER');
  });

  it('returns 404 for unknown trip id', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .post(`/api/v1/trips/00000000-0000-4000-8000-000000000001/members`)
      .set(owner.auth)
      .send({ employeeIds: ['00000000-0000-4000-8000-000000000002'] });

    expect(response.status).toBe(404);
  });
});

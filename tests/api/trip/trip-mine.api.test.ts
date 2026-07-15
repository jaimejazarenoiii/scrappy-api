import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeVehiclePayload } from '../../factories/vehicle.factory.js';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip mine api', () => {
  it('returns only trips assigned to the authenticated employee', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
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
    const vehicleId = vehicle.body.data.id as string;
    const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const assignedTrip = await request(app)
      .post('/api/v1/trips')
      .set(owner.auth)
      .send({
        vehicleId,
        scheduledStart,
        origin: 'Warehouse A',
        destination: 'Site A',
        members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
      });
    const otherTrip = await request(app).post('/api/v1/trips').set(owner.auth).send({
      vehicleId,
      scheduledStart,
      origin: 'Warehouse B',
      destination: 'Site B',
    });

    expect(assignedTrip.status).toBe(201);
    expect(otherTrip.status).toBe(201);

    const response = await request(app)
      .get('/api/v1/trips/mine')
      .query({ page: 1, limit: 20 })
      .set(employee.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe(assignedTrip.body.data.id);
    expect(response.body.data[0].origin).toBe('Warehouse A');
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, total: 1, totalPages: 1 });
  });

  it('supports status filtering', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'driver@scrappy.test',
    );

    const vehicle = await request(app)
      .post('/api/v1/vehicles')
      .set(owner.auth)
      .send(makeVehiclePayload());
    const vehicleId = vehicle.body.data.id as string;
    const scheduledStart = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    const draftTrip = await request(app)
      .post('/api/v1/trips')
      .set(owner.auth)
      .send({
        vehicleId,
        scheduledStart,
        origin: 'Draft trip',
        destination: 'Site',
        members: [{ employeeId: employee.employeeId, role: 'DRIVER' }],
      });
    expect(draftTrip.status).toBe(201);

    const filtered = await request(app)
      .get('/api/v1/trips/mine')
      .query({ status: 'COMPLETED' })
      .set(employee.auth);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toHaveLength(0);

    const drafts = await request(app)
      .get('/api/v1/trips/mine')
      .query({ status: 'DRAFT' })
      .set(employee.auth);
    expect(drafts.status).toBe(200);
    expect(drafts.body.data).toHaveLength(1);
    expect(drafts.body.data[0].id).toBe(draftTrip.body.data.id);
  });

  it('denies company trip list to employees', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'worker@scrappy.test',
    );

    const response = await request(app).get('/api/v1/trips').set(employee.auth);
    expect(response.status).toBe(403);
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('attendance time api', () => {
  it('completes time in and time out lifecycle', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const { auth } = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    const statusBefore = await request(app).get('/api/v1/workforce/attendance/status').set(auth);
    expect(statusBefore.status).toBe(200);
    expect(statusBefore.body.data.isTimedIn).toBe(false);

    const timeIn = await request(app)
      .post('/api/v1/workforce/attendance/time-in')
      .set(auth)
      .send({ note: 'Starting shift' });
    expect(timeIn.status).toBe(200);
    expect(timeIn.body.data.status).toBe('OPEN');

    const statusDuring = await request(app).get('/api/v1/workforce/attendance/status').set(auth);
    expect(statusDuring.body.data.isTimedIn).toBe(true);

    const timeOut = await request(app).post('/api/v1/workforce/attendance/time-out').set(auth);
    expect(timeOut.status).toBe(200);
    expect(timeOut.body.data.status).toBe('CLOSED');

    const history = await request(app).get('/api/v1/workforce/attendance').set(auth);
    expect(history.status).toBe(200);
    expect(history.body.data.length).toBeGreaterThanOrEqual(1);
  });

  it('rejects double time in and time out without session', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const { companyId } = await createCompanyAndLogin(app);
    const { auth } = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      companyId,
    );

    await request(app).post('/api/v1/workforce/attendance/time-in').set(auth);
    const doubleIn = await request(app).post('/api/v1/workforce/attendance/time-in').set(auth);
    expect(doubleIn.status).toBe(409);

    await request(app).post('/api/v1/workforce/attendance/time-out').set(auth);
    const doubleOut = await request(app).post('/api/v1/workforce/attendance/time-out').set(auth);
    expect(doubleOut.status).toBe(409);
  });
});

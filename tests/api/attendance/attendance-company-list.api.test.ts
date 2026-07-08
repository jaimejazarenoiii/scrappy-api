import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin, createLinkedEmployeeUser } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('company attendance list api', () => {
  it('returns employee name and number in company attendance history', async () => {
    const { app, userRepository, employeeRepository } = createTestContext();
    const owner = await createCompanyAndLogin(app);
    const employee = await createLinkedEmployeeUser(
      app,
      userRepository,
      employeeRepository,
      owner.companyId,
      'worker@scrappy.test',
    );

    await employeeRepository.update(employee.employeeId, owner.companyId, {
      employeeNumber: 'EMP-100',
    });

    const timeIn = await request(app)
      .post('/api/v1/workforce/attendance/time-in')
      .set(employee.auth);
    expect(timeIn.status).toBe(200);

    const companyList = await request(app)
      .get('/api/v1/workforce/attendance/company')
      .set(owner.auth);
    expect(companyList.status).toBe(200);
    expect(companyList.body.data.length).toBeGreaterThanOrEqual(1);
    expect(companyList.body.data[0]).toMatchObject({
      employeeId: employee.employeeId,
      firstName: 'Jane',
      lastName: 'Worker',
      employeeNumber: 'EMP-100',
    });
  });
});

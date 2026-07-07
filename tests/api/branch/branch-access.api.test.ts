import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import {
  createCompanyAndLogin,
  createEmployeeUser,
  loginAsEmployee,
} from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('branch access api', () => {
  it('allows employee read but blocks mutations', async () => {
    const { app, userRepository } = createTestContext();
    const { auth, companyId } = await createCompanyAndLogin(app);
    await createEmployeeUser(userRepository, companyId);
    const employeeAuth = await loginAsEmployee(app);
    const createDenied = await request(app)
      .post('/api/v1/branches')
      .set(employeeAuth)
      .send(makeBranchPayload());
    expect(createDenied.status).toBe(403);
    await request(app).post('/api/v1/branches').set(auth).send(makeBranchPayload());
    const list = await request(app).get('/api/v1/branches').set(employeeAuth);
    expect(list.status).toBe(200);
  });

  it('rejects cross-company branch access', async () => {
    const { app, branchRepository } = createTestContext();
    const first = await createCompanyAndLogin(app);
    await request(app).post('/api/v1/branches').set(first.auth).send(makeBranchPayload());
    const branches = [...branchRepository.branches.values()];
    const branchId = branches[0]!.id;

    await request(app)
      .post('/api/v1/companies')
      .send(
        makeCompanyPayload({
          name: 'other-co',
          email: 'company2@scrappy.test',
          ownerEmail: 'owner2@scrappy.test',
          ownerFullName: 'Owner Two',
        }),
      );
    const secondLogin = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner2@scrappy.test', password: 'password123' });
    expect(secondLogin.status).toBe(200);
    const secondAuth = { Authorization: `Bearer ${secondLogin.body.data.accessToken}` };
    const response = await request(app).get(`/api/v1/branches/${branchId}`).set(secondAuth);
    expect(response.status).toBe(404);

    const fakeId = randomUUID();
    const notFound = await request(app).get(`/api/v1/branches/${fakeId}`).set(first.auth);
    expect(notFound.status).toBe(404);
  });
});

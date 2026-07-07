import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('branch lifecycle api', () => {
  it('rejects duplicate names and archived get', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    await request(app).post('/api/v1/branches').set(auth).send(makeBranchPayload());
    const duplicate = await request(app)
      .post('/api/v1/branches')
      .set(auth)
      .send(makeBranchPayload());
    expect(duplicate.status).toBe(409);
    const created = await request(app)
      .post('/api/v1/branches')
      .set(auth)
      .send(makeBranchPayload({ name: 'Second Branch', address: 'Other' }));
    await request(app).post(`/api/v1/branches/${created.body.data.id}/archive`).set(auth);
    const readArchived = await request(app)
      .get(`/api/v1/branches/${created.body.data.id}`)
      .set(auth);
    expect(readArchived.status).toBe(404);
  });

  it('rejects invalid payload', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const response = await request(app).post('/api/v1/branches').set(auth).send({ name: '' });
    expect(response.status).toBe(400);
  });
});

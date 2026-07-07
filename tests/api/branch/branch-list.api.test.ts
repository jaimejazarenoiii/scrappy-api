import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('branch list api', () => {
  it('lists branches with pagination and excludes archived', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    await request(app)
      .post('/api/v1/branches')
      .set(auth)
      .send(makeBranchPayload({ name: 'Alpha' }));
    const second = await request(app)
      .post('/api/v1/branches')
      .set(auth)
      .send(makeBranchPayload({ name: 'Beta', address: 'Beta Ave' }));
    const list = await request(app).get('/api/v1/branches?page=1&limit=10&sortBy=name').set(auth);
    expect(list.status).toBe(200);
    expect(list.body.data).toHaveLength(2);
    expect(list.body.meta.total).toBe(2);
    await request(app).post(`/api/v1/branches/${second.body.data.id}/archive`).set(auth);
    const afterArchive = await request(app).get('/api/v1/branches').set(auth);
    expect(afterArchive.body.data).toHaveLength(1);
  });
});

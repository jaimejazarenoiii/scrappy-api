import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeBranchPayload } from '../../factories/branch.factory.js';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('branch crud api', () => {
  it('creates, reads, and updates a branch', async () => {
    const { app } = createTestContext();
    const { auth } = await createCompanyAndLogin(app);
    const create = await request(app).post('/api/v1/branches').set(auth).send(makeBranchPayload());
    expect(create.status).toBe(201);
    const branchId = create.body.data.id;
    const read = await request(app).get(`/api/v1/branches/${branchId}`).set(auth);
    expect(read.status).toBe(200);
    const update = await request(app)
      .patch(`/api/v1/branches/${branchId}`)
      .set(auth)
      .send({ address: 'Updated Address' });
    expect(update.body.data.address).toBe('Updated Address');
  });
});

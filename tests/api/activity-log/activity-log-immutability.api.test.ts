import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('activity log immutability api', () => {
  it('does not support create/update/delete via HTTP', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const post = await request(app).post('/api/v1/activity-logs').set(owner.auth).send({});
    expect([404, 405]).toContain(post.status);

    const patch = await request(app)
      .patch('/api/v1/activity-logs/00000000-0000-4000-8000-000000000001')
      .set(owner.auth)
      .send({});
    expect([404, 405]).toContain(patch.status);

    const del = await request(app)
      .delete('/api/v1/activity-logs/00000000-0000-4000-8000-000000000001')
      .set(owner.auth);
    expect([404, 405]).toContain(del.status);
  });
});

import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('trip dashboard api', () => {
  it('returns status counts for owner', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app).get('/api/v1/trips/dashboard').set(owner.auth);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data).toEqual({
      draftCount: 0,
      scheduledCount: 0,
      startedCount: 0,
      completedCount: 0,
      cancelledCount: 0,
    });
  });
});

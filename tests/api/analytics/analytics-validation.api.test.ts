import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('analytics validation api', () => {
  it('rejects invalid custom date ranges', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const missingDates = await request(app)
      .get('/api/v1/analytics/company')
      .query({ period: 'CUSTOM' })
      .set(owner.auth);
    expect(missingDates.status).toBe(400);

    const inverted = await request(app)
      .get('/api/v1/analytics/company')
      .query({
        period: 'CUSTOM',
        from: '2026-02-01T00:00:00.000Z',
        to: '2026-01-01T00:00:00.000Z',
      })
      .set(owner.auth);
    expect(inverted.status).toBe(400);

    const tooLong = await request(app)
      .get('/api/v1/analytics/company')
      .query({
        period: 'CUSTOM',
        from: '2024-01-01T00:00:00.000Z',
        to: '2026-02-01T00:00:00.000Z',
      })
      .set(owner.auth);
    expect(tooLong.status).toBe(400);
  });
});

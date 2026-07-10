import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createCompanyAndLogin } from '../../setup/auth-helpers.js';
import { reportDateRangeQuery } from '../../setup/reports-helpers.js';
import { createTestContext } from '../../setup/test-app.js';

describe('report export validation api', () => {
  it('rejects invalid export format', async () => {
    const { app } = createTestContext();
    const owner = await createCompanyAndLogin(app);

    const response = await request(app)
      .get(`/api/v1/reports/transactions/export?${reportDateRangeQuery()}&format=xml`)
      .set(owner.auth);

    expect(response.status).toBe(400);
  });
});

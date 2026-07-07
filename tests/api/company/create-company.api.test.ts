import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('POST /api/v1/companies', () => {
  it('creates a company with its owner', async () => {
    const { app } = createTestContext();
    const response = await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    expect(response.status).toBe(201);
    expect(response.body.success).toBe(true);
    expect(response.body.data.company.name).toBe('scrappy-demo');
  });
});

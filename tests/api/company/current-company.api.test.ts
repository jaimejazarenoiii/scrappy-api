import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('GET /api/v1/companies/me', () => {
  it('returns the authenticated user company without an identifier', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    const response = await request(app)
      .get('/api/v1/companies/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.name).toBe('scrappy-demo');
    expect(response.body.data.id).toBe(login.body.data.company.id);
  });

  it('rejects unauthenticated requests', async () => {
    const { app } = createTestContext();
    const response = await request(app).get('/api/v1/companies/me');
    expect(response.status).toBe(401);
  });
});

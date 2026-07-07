import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('GET /api/v1/users/me', () => {
  it('returns the authenticated user', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    const response = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('owner@scrappy.test');
  });
});

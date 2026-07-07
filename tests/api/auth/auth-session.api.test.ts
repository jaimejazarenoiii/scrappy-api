import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import { createTestContext } from '../../setup/test-app.js';

describe('auth session api', () => {
  it('supports login, refresh, and logout', async () => {
    const { app } = createTestContext();
    await request(app).post('/api/v1/companies').send(makeCompanyPayload());
    const login = await request(app)
      .post('/api/v1/auth/login')
      .send({ identifier: 'owner@scrappy.test', password: 'password123' });
    expect(login.status).toBe(200);
    const me = await request(app)
      .get('/api/v1/users/me')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(me.status).toBe(200);
    const refresh = await request(app)
      .post('/api/v1/auth/refresh')
      .send({ refreshToken: login.body.data.refreshToken });
    expect(refresh.status).toBe(200);
    const logout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.data.accessToken}`);
    expect(logout.status).toBe(200);
  });
});

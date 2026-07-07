import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';

describe('forgot password placeholder api', () => {
  it('returns accepted', async () => {
    const { app } = createTestContext();
    const response = await request(app)
      .post('/api/v1/auth/forgot-password')
      .send({ identifier: 'owner@scrappy.test' });
    expect(response.status).toBe(202);
  });
});

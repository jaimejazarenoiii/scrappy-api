import request from 'supertest';
import { describe, expect, it } from 'vitest';
import { createTestContext } from '../../setup/test-app.js';

describe('protected access', () => {
  it('rejects unauthenticated access', async () => {
    const { app } = createTestContext();
    const response = await request(app).get('/api/v1/users/me');
    expect(response.status).toBe(401);
  });
});

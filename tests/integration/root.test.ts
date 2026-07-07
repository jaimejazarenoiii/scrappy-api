import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/infrastructure/providers/container.js';
import { loadConfig, resetConfigForTests } from '../../src/infrastructure/config/index.js';
import { resetLoggerForTests } from '../../src/infrastructure/logger/pino.logger.js';

describe('GET /', () => {
  beforeEach(() => {
    resetConfigForTests();
    resetLoggerForTests();
    process.env.PORT = '3000';
    process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/scrappy';
    process.env.NODE_ENV = 'test';
    process.env.LOG_LEVEL = 'silent';
    loadConfig();
  });

  it('returns API identity in standard envelope', async () => {
    const app = createApp(createContainer({ healthIndicator: { check: async () => true } }));

    const response = await request(app).get('/');

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      success: true,
      data: {
        name: 'Scrappy API',
        version: '1.0.0',
        status: 'running',
      },
      meta: {},
      error: null,
    });
  });
});

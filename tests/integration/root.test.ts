import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/infrastructure/providers/container.js';
import { loadConfig, resetConfigForTests } from '../../src/infrastructure/config/index.js';
import { resetLoggerForTests } from '../../src/infrastructure/logger/pino.logger.js';
import { resetConfigForTests as resetAppConfigForTests } from '../../src/config/index.js';

function setupEnv(nodeEnv: 'test' | 'production' | 'development') {
  resetConfigForTests();
  resetAppConfigForTests();
  resetLoggerForTests();
  process.env.PORT = '3000';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/scrappy';
  process.env.NODE_ENV = nodeEnv;
  process.env.LOG_LEVEL = 'silent';
  process.env.JWT_ACCESS_SECRET = 'test-access-secret-1234';
  process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-1234';
  if (nodeEnv === 'production') {
    process.env.FILE_STORAGE_DRIVER = 's3';
    process.env.S3_BUCKET = 'test-bucket';
    process.env.S3_REGION = 'ap-southeast-1';
    process.env.S3_ACCESS_KEY_ID = 'test-key';
    process.env.S3_SECRET_ACCESS_KEY = 'test-secret';
  } else {
    delete process.env.FILE_STORAGE_DRIVER;
    delete process.env.S3_BUCKET;
    delete process.env.S3_REGION;
    delete process.env.S3_ACCESS_KEY_ID;
    delete process.env.S3_SECRET_ACCESS_KEY;
  }
  loadConfig();
}

describe('GET /', () => {
  beforeEach(() => {
    setupEnv('test');
  });

  it('returns API identity in standard envelope outside production', async () => {
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

  it('returns 404 in production', async () => {
    setupEnv('production');
    const app = createApp(createContainer({ healthIndicator: { check: async () => true } }));

    const response = await request(app).get('/');

    expect(response.status).toBe(404);
    expect(response.body.success).toBe(false);
    expect(response.body.error.code).toBe('RESOURCE_NOT_FOUND');
  });
});

describe('GET /docs', () => {
  it('is available outside production', async () => {
    setupEnv('test');
    const app = createApp(createContainer({ healthIndicator: { check: async () => true } }));
    const response = await request(app).get('/docs/');
    expect(response.status).toBe(200);
  });

  it('is not registered in production', async () => {
    setupEnv('production');
    const app = createApp(createContainer({ healthIndicator: { check: async () => true } }));
    const response = await request(app).get('/docs/');
    expect(response.status).toBe(404);
  });
});

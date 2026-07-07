import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app.js';
import { createContainer } from '../../src/infrastructure/providers/container.js';
import { loadConfig, resetConfigForTests } from '../../src/infrastructure/config/index.js';
import { resetLoggerForTests } from '../../src/infrastructure/logger/pino.logger.js';
import type { HealthIndicator } from '../../src/application/interfaces/health-check.interface.js';

function setupEnv(): void {
  resetConfigForTests();
  resetLoggerForTests();
  process.env.PORT = '3000';
  process.env.DATABASE_URL = 'postgresql://postgres:postgres@localhost:5432/scrappy';
  process.env.NODE_ENV = 'test';
  process.env.LOG_LEVEL = 'silent';
  loadConfig();
}

describe('GET /health', () => {
  beforeEach(() => {
    setupEnv();
  });

  it('returns healthy status when database is up', async () => {
    const indicator: HealthIndicator = { check: async () => true };
    const app = createApp(createContainer({ healthIndicator: indicator }));

    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('healthy');
    expect(response.body.data.checks.database).toBe('up');
    expect(response.body.error).toBeNull();
  });

  it('returns unhealthy status with 503 when database is down', async () => {
    const indicator: HealthIndicator = { check: async () => false };
    const app = createApp(createContainer({ healthIndicator: indicator }));

    const response = await request(app).get('/health');

    expect(response.status).toBe(503);
    expect(response.body.success).toBe(true);
    expect(response.body.data.status).toBe('unhealthy');
    expect(response.body.data.checks.database).toBe('down');
  });
});

import { describe, expect, it, vi } from 'vitest';
import { GetHealthUseCase } from '../../src/application/use-cases/get-health.use-case.js';
import { HealthCheckService } from '../../src/application/services/health-check.service.js';
import type { HealthIndicator } from '../../src/application/interfaces/health-check.interface.js';

describe('GetHealthUseCase', () => {
  it('returns healthy when indicator reports database up', async () => {
    const indicator: HealthIndicator = {
      check: vi.fn().mockResolvedValue(true),
    };
    const service = new HealthCheckService(indicator);
    const useCase = new GetHealthUseCase(service);

    const result = await useCase.execute();

    expect(result.status).toBe('healthy');
    expect(result.checks?.database).toBe('up');
  });

  it('returns unhealthy when indicator reports database down', async () => {
    const indicator: HealthIndicator = {
      check: vi.fn().mockResolvedValue(false),
    };
    const service = new HealthCheckService(indicator);
    const useCase = new GetHealthUseCase(service);

    const result = await useCase.execute();

    expect(result.status).toBe('unhealthy');
    expect(result.checks?.database).toBe('down');
  });
});

import { RootController } from '../../presentation/controllers/root.controller.js';
import { HealthController } from '../../presentation/controllers/health.controller.js';
import { GetRootUseCase } from '../../application/use-cases/get-root.use-case.js';
import { GetHealthUseCase } from '../../application/use-cases/get-health.use-case.js';
import { HealthCheckService } from '../../application/services/health-check.service.js';
import { PrismaHealthIndicator } from './health-indicator.js';
import type { HealthIndicator } from '../../application/interfaces/health-check.interface.js';

/**
 * Application dependency injection container.
 */
export interface Container {
  rootController: RootController;
  healthController: HealthController;
}

export interface ContainerOptions {
  healthIndicator?: HealthIndicator;
}

/**
 * Creates and wires the application composition root.
 * @param options - Optional overrides for testing
 * @returns Wired container with controllers
 */
export function createContainer(options: ContainerOptions = {}): Container {
  const healthIndicator = options.healthIndicator ?? new PrismaHealthIndicator();
  const healthCheckService = new HealthCheckService(healthIndicator);
  const getRootUseCase = new GetRootUseCase();
  const getHealthUseCase = new GetHealthUseCase(healthCheckService);
  const rootController = new RootController(getRootUseCase);
  const healthController = new HealthController(getHealthUseCase);

  return {
    rootController,
    healthController,
  };
}

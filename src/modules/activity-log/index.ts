import type { ActivityLogRepository } from './domain/activity-log.repository.js';
import { ListActivityLogsUseCase } from './application/use-cases/list-activity-logs.use-case.js';
import { GetActivityLogUseCase } from './application/use-cases/get-activity-log.use-case.js';
import { ActivityLogController } from './presentation/activity-log.controller.js';

export { createActivityLogRoutes } from './presentation/activity-log.routes.js';
export { ActivityLogRecorder } from './application/services/activity-log-recorder.service.js';
export { ActivityLogPrismaRepository } from './infrastructure/activity-log.prisma-repository.js';

export interface ActivityLogModuleDependencies {
  activityLogRepository: ActivityLogRepository;
}

export function buildActivityLogController(
  deps: ActivityLogModuleDependencies,
): ActivityLogController {
  return new ActivityLogController(
    new ListActivityLogsUseCase(deps.activityLogRepository),
    new GetActivityLogUseCase(deps.activityLogRepository),
  );
}

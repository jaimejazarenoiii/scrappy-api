import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { ActivityLogRepository } from '../../domain/activity-log.repository.js';
import {
  buildActivityLogResponse,
  type ActivityLogResponseDto,
} from '../dto/activity-log.response.js';

export class GetActivityLogUseCase {
  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  async execute(
    activityLogId: string,
    auth: AuthorizationContext,
  ): Promise<ActivityLogResponseDto> {
    const found = await this.activityLogRepository.findById(activityLogId, auth.companyId);
    if (!found) throw new ResourceNotFoundError('Activity log not found');
    return buildActivityLogResponse(found);
  }
}

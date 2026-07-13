import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import type {
  ActivityLogRepository,
  ListActivityLogsQuery,
} from '../../domain/activity-log.repository.js';
import {
  buildActivityLogResponse,
  type ActivityLogResponseDto,
} from '../dto/activity-log.response.js';

export interface ListActivityLogsResponseDto {
  items: ActivityLogResponseDto[];
  meta: PaginationMeta;
}

export class ListActivityLogsUseCase {
  constructor(private readonly activityLogRepository: ActivityLogRepository) {}

  async execute(
    auth: AuthorizationContext,
    query: ListActivityLogsQuery,
  ): Promise<ListActivityLogsResponseDto> {
    const normalized: ListActivityLogsQuery = {
      ...query,
      page: query.page || 1,
      limit: query.limit || 20,
      sortBy: query.sortBy ?? 'createdAt',
      sortOrder: query.sortOrder ?? 'desc',
    };
    const result = await this.activityLogRepository.list(auth.companyId, normalized);
    return {
      items: result.items.map(buildActivityLogResponse),
      meta: buildPaginationMeta(normalized.page, normalized.limit, result.total),
    };
  }
}

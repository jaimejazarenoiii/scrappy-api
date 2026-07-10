import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessReports } from '../../domain/report-authorization.policy.js';
import type { ReportsQueryRepository } from '../../domain/report-query.repository.js';
import {
  buildReportListResponse,
  type ReportListResponseDto,
} from '../dto/report-criteria.response.js';
import type { VehicleReportRowDto } from '../dto/vehicle-report.response.js';
import { logReportAccess } from '../services/report-audit.service.js';
import type {
  ReportFilterPipeline,
  ResolvedReportQuery,
} from '../services/report-filter-pipeline.js';

export class ListVehicleReportUseCase {
  constructor(
    private readonly queryRepository: ReportsQueryRepository,
    private readonly filterPipeline: ReportFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedReportQuery,
  ): Promise<ReportListResponseDto<VehicleReportRowDto>> {
    assertCanAccessReports(auth.role);
    const ctx = await this.filterPipeline.build(
      auth.companyId,
      query,
      { required: false },
      'plateNumber',
      'asc',
    );
    logReportAccess('vehicles', 'list', ctx.filter, auth.userId, { search: ctx.search ?? null });
    const result = await this.queryRepository.listVehicleReports({
      filter: ctx.filter,
      pagination: ctx.pagination,
      sort: ctx.sort,
      search: ctx.search,
    });
    return buildReportListResponse(
      ctx.filter,
      ctx.sort,
      ctx.pagination,
      ctx.search,
      result.items,
      result.total,
    );
  }
}

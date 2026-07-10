import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessReports } from '../../domain/report-authorization.policy.js';
import type { ReportsQueryRepository } from '../../domain/report-query.repository.js';
import {
  buildReportListResponse,
  type ReportListResponseDto,
} from '../dto/report-criteria.response.js';
import type { PayrollReportRowDto } from '../dto/payroll-report.response.js';
import { logReportAccess } from '../services/report-audit.service.js';
import type {
  ReportFilterPipeline,
  ResolvedReportQuery,
} from '../services/report-filter-pipeline.js';

export class ListPayrollReportUseCase {
  constructor(
    private readonly queryRepository: ReportsQueryRepository,
    private readonly filterPipeline: ReportFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedReportQuery,
  ): Promise<ReportListResponseDto<PayrollReportRowDto>> {
    assertCanAccessReports(auth.role);
    const ctx = await this.filterPipeline.build(
      auth.companyId,
      query,
      { required: true },
      'payPeriodStart',
      'desc',
    );
    logReportAccess('payroll', 'list', ctx.filter, auth.userId, { search: ctx.search ?? null });
    const result = await this.queryRepository.listPayrollReports({
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

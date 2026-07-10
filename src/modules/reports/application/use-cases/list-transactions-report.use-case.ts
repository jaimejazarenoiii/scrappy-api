import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { assertCanAccessReports } from '../../domain/report-authorization.policy.js';
import type { ReportsQueryRepository } from '../../domain/report-query.repository.js';
import {
  buildReportListResponse,
  type ReportListResponseDto,
} from '../dto/report-criteria.response.js';
import type { TransactionReportRowDto } from '../dto/transaction-report.response.js';
import { logReportAccess } from '../services/report-audit.service.js';
import type {
  ReportFilterPipeline,
  ResolvedReportQuery,
} from '../services/report-filter-pipeline.js';

export class ListTransactionReportUseCase {
  constructor(
    private readonly queryRepository: ReportsQueryRepository,
    private readonly filterPipeline: ReportFilterPipeline,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ResolvedReportQuery,
  ): Promise<ReportListResponseDto<TransactionReportRowDto>> {
    assertCanAccessReports(auth.role);
    const ctx = await this.filterPipeline.build(
      auth.companyId,
      query,
      { required: true },
      'transactionDate',
      'desc',
    );
    logReportAccess('transactions', 'list', ctx.filter, auth.userId, {
      search: ctx.search ?? null,
    });
    const result = await this.queryRepository.listTransactionReports({
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

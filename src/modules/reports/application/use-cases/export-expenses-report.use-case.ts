import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { ReportExportFormat } from '../../../../shared/reporting/export-filename.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import { assertCanAccessReports } from '../../domain/report-authorization.policy.js';
import type { ReportsQueryRepository } from '../../domain/report-query.repository.js';
import { EXPENSE_EXPORT_COLUMNS, mapExpenseExportRow } from '../export/report-export-columns.js';
import { logReportAccess } from '../services/report-audit.service.js';
import type { ReportExportOrchestratorService } from '../services/report-export-orchestrator.service.js';
import type {
  ReportFilterPipeline,
  ResolvedReportQuery,
} from '../services/report-filter-pipeline.js';
import type { ReportExportArtifact } from '../../infrastructure/export/report-exporter.interface.js';

export interface ExpenseReportExportQuery extends ResolvedReportQuery {
  format: ReportExportFormat;
  disposition?: 'attachment' | 'inline';
}

export class ExportExpenseReportUseCase {
  constructor(
    private readonly queryRepository: ReportsQueryRepository,
    private readonly filterPipeline: ReportFilterPipeline,
    private readonly exportOrchestrator: ReportExportOrchestratorService,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: ExpenseReportExportQuery,
  ): Promise<ReportExportArtifact> {
    assertCanAccessReports(auth.role);
    const ctx = await this.filterPipeline.build(
      auth.companyId,
      query,
      { required: true },
      'date',
      'desc',
    );
    logReportAccess('expenses', 'export', ctx.filter, auth.userId, { format: query.format });
    const company = await this.companyRepository.findById(auth.companyId);
    const exportParams = { filter: ctx.filter, search: ctx.search, sort: ctx.sort };
    const totalCount = await this.queryRepository.countExpenseReports(exportParams);
    return this.exportOrchestrator.export({
      domain: 'expenses',
      companyName: company?.toPrimitives().name ?? 'company',
      title: 'Expense Report',
      format: query.format,
      disposition: query.disposition,
      from: ctx.filter.from,
      to: ctx.filter.to,
      search: ctx.search,
      totalCount,
      columns: EXPENSE_EXPORT_COLUMNS,
      mapRow: mapExpenseExportRow,
      fetchBatch: (skip, take) =>
        this.queryRepository.batchExpenseReports(exportParams, skip, take),
    });
  }
}

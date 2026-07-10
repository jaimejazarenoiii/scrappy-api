import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { ReportExportFormat } from '../../../../shared/reporting/export-filename.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import { assertCanAccessReports } from '../../domain/report-authorization.policy.js';
import type { ReportsQueryRepository } from '../../domain/report-query.repository.js';
import { TRIP_EXPORT_COLUMNS, mapTripExportRow } from '../export/report-export-columns.js';
import { logReportAccess } from '../services/report-audit.service.js';
import type { ReportExportOrchestratorService } from '../services/report-export-orchestrator.service.js';
import type {
  ReportFilterPipeline,
  ResolvedReportQuery,
} from '../services/report-filter-pipeline.js';
import type { ReportExportArtifact } from '../../infrastructure/export/report-exporter.interface.js';

export interface TripReportExportQuery extends ResolvedReportQuery {
  format: ReportExportFormat;
  disposition?: 'attachment' | 'inline';
}

export class ExportTripReportUseCase {
  constructor(
    private readonly queryRepository: ReportsQueryRepository,
    private readonly filterPipeline: ReportFilterPipeline,
    private readonly exportOrchestrator: ReportExportOrchestratorService,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: TripReportExportQuery,
  ): Promise<ReportExportArtifact> {
    assertCanAccessReports(auth.role);
    const ctx = await this.filterPipeline.build(
      auth.companyId,
      query,
      { required: true },
      'scheduledStart',
      'desc',
    );
    logReportAccess('trips', 'export', ctx.filter, auth.userId, { format: query.format });
    const company = await this.companyRepository.findById(auth.companyId);
    const exportParams = { filter: ctx.filter, search: ctx.search, sort: ctx.sort };
    const totalCount = await this.queryRepository.countTripReports(exportParams);
    return this.exportOrchestrator.export({
      domain: 'trips',
      companyName: company?.toPrimitives().name ?? 'company',
      title: 'Trip Report',
      format: query.format,
      disposition: query.disposition,
      from: ctx.filter.from,
      to: ctx.filter.to,
      search: ctx.search,
      totalCount,
      columns: TRIP_EXPORT_COLUMNS,
      mapRow: mapTripExportRow,
      fetchBatch: (skip, take) => this.queryRepository.batchTripReports(exportParams, skip, take),
    });
  }
}

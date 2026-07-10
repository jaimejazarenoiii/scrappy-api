import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { ReportExportFormat } from '../../../../shared/reporting/export-filename.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import { assertCanAccessReports } from '../../domain/report-authorization.policy.js';
import type { ReportsQueryRepository } from '../../domain/report-query.repository.js';
import {
  ATTENDANCE_EXPORT_COLUMNS,
  mapAttendanceExportRow,
} from '../export/report-export-columns.js';
import { logReportAccess } from '../services/report-audit.service.js';
import type { ReportExportOrchestratorService } from '../services/report-export-orchestrator.service.js';
import type {
  ReportFilterPipeline,
  ResolvedReportQuery,
} from '../services/report-filter-pipeline.js';
import type { ReportExportArtifact } from '../../infrastructure/export/report-exporter.interface.js';

export interface AttendanceReportExportQuery extends ResolvedReportQuery {
  format: ReportExportFormat;
  disposition?: 'attachment' | 'inline';
}

export class ExportAttendanceReportUseCase {
  constructor(
    private readonly queryRepository: ReportsQueryRepository,
    private readonly filterPipeline: ReportFilterPipeline,
    private readonly exportOrchestrator: ReportExportOrchestratorService,
    private readonly companyRepository: CompanyRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    query: AttendanceReportExportQuery,
  ): Promise<ReportExportArtifact> {
    assertCanAccessReports(auth.role);
    const ctx = await this.filterPipeline.build(
      auth.companyId,
      query,
      { required: true },
      'timeInAt',
      'desc',
    );
    logReportAccess('attendance', 'export', ctx.filter, auth.userId, { format: query.format });
    const company = await this.companyRepository.findById(auth.companyId);
    const exportParams = { filter: ctx.filter, search: ctx.search, sort: ctx.sort };
    const totalCount = await this.queryRepository.countAttendanceReports(exportParams);
    return this.exportOrchestrator.export({
      domain: 'attendance',
      companyName: company?.toPrimitives().name ?? 'company',
      title: 'Attendance Report',
      format: query.format,
      disposition: query.disposition,
      from: ctx.filter.from,
      to: ctx.filter.to,
      search: ctx.search,
      totalCount,
      columns: ATTENDANCE_EXPORT_COLUMNS,
      mapRow: mapAttendanceExportRow,
      fetchBatch: (skip, take) =>
        this.queryRepository.batchAttendanceReports(exportParams, skip, take),
    });
  }
}

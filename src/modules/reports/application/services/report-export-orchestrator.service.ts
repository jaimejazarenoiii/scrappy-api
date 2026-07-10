import { ExportLimitExceededError } from '../../../../shared/errors/export-limit-exceeded.error.js';
import {
  buildExportFilename,
  type ReportExportDomain,
  type ReportExportFormat,
} from '../../../../shared/reporting/export-filename.js';
import {
  REPORT_EXPORT_BATCH_SIZE,
  REPORT_EXPORT_MAX_ROWS,
} from '../../domain/report-query.repository.js';
import type { CsvReportExporter } from '../../infrastructure/export/csv-report-exporter.js';
import type { PdfReportExporter } from '../../infrastructure/export/pdf-report-exporter.js';
import type {
  ReportExportArtifact,
  ReportExportColumn,
} from '../../infrastructure/export/report-exporter.interface.js';
import type { XlsxReportExporter } from '../../infrastructure/export/xlsx-report-exporter.js';

export interface ReportExportRequest<TRow> {
  domain: ReportExportDomain;
  companyName: string;
  title: string;
  format: ReportExportFormat;
  disposition?: 'attachment' | 'inline';
  from?: Date;
  to?: Date;
  search?: string;
  totalCount: number;
  columns: ReportExportColumn[];
  mapRow: (row: TRow) => string[];
  fetchBatch: (skip: number, take: number) => Promise<TRow[]>;
}

export class ReportExportOrchestratorService {
  constructor(
    private readonly csvExporter: CsvReportExporter,
    private readonly xlsxExporter: XlsxReportExporter,
    private readonly pdfExporter: PdfReportExporter,
  ) {}

  async export<TRow>(request: ReportExportRequest<TRow>): Promise<ReportExportArtifact> {
    if (request.totalCount > REPORT_EXPORT_MAX_ROWS) {
      throw new ExportLimitExceededError();
    }

    const rows: string[][] = [];
    let skip = 0;
    while (skip < request.totalCount) {
      const batch = await request.fetchBatch(skip, REPORT_EXPORT_BATCH_SIZE);
      if (batch.length === 0) break;
      for (const item of batch) {
        rows.push(request.mapRow(item));
      }
      skip += batch.length;
    }

    const exporter = this.resolveExporter(request.format);
    const artifact = await exporter.export({
      title: request.title,
      companyName: request.companyName,
      from: request.from,
      to: request.to,
      search: request.search,
      columns: request.columns,
      rows,
    });

    return {
      ...artifact,
      filename: buildExportFilename(
        request.domain,
        request.companyName,
        request.from,
        request.to,
        request.format,
      ),
      disposition: request.disposition ?? 'attachment',
    };
  }

  private resolveExporter(format: ReportExportFormat) {
    switch (format) {
      case 'csv':
        return this.csvExporter;
      case 'xlsx':
        return this.xlsxExporter;
      case 'pdf':
        return this.pdfExporter;
      default:
        return this.csvExporter;
    }
  }
}

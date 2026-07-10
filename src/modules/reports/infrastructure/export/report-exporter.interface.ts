import type { Readable } from 'node:stream';
import type { ReportExportFormat } from '../../../../shared/reporting/export-filename.js';

export interface ReportExportColumn {
  key: string;
  header: string;
}

export interface ReportExportContext {
  title: string;
  companyName: string;
  from?: Date;
  to?: Date;
  search?: string;
  columns: ReportExportColumn[];
  rows: string[][];
}

export interface ReportExportArtifact {
  filename: string;
  contentType: string;
  disposition: 'attachment' | 'inline';
  stream: Readable;
}

export interface ReportExporter {
  readonly format: ReportExportFormat;
  export(context: ReportExportContext): Promise<ReportExportArtifact>;
}

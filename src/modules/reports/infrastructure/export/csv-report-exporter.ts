import { Readable } from 'node:stream';
import type {
  ReportExportArtifact,
  ReportExportContext,
  ReportExporter,
} from './report-exporter.interface.js';

function escapeCsvCell(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export class CsvReportExporter implements ReportExporter {
  readonly format = 'csv' as const;

  async export(context: ReportExportContext): Promise<ReportExportArtifact> {
    const header = context.columns.map((c) => escapeCsvCell(c.header)).join(',');
    const body = context.rows
      .map((row) => row.map((cell) => escapeCsvCell(cell)).join(','))
      .join('\n');
    const content = `\uFEFF${header}\n${body}\n`;
    const stream = Readable.from([content]);

    return {
      filename: '',
      contentType: 'text/csv; charset=utf-8',
      disposition: 'attachment',
      stream,
    };
  }
}

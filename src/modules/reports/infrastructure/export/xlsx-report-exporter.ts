import { PassThrough } from 'node:stream';
import ExcelJS from 'exceljs';
import type {
  ReportExportArtifact,
  ReportExportContext,
  ReportExporter,
} from './report-exporter.interface.js';

export class XlsxReportExporter implements ReportExporter {
  readonly format = 'xlsx' as const;

  async export(context: ReportExportContext): Promise<ReportExportArtifact> {
    const stream = new PassThrough();
    const workbook = new ExcelJS.stream.xlsx.WorkbookWriter({ stream, useStyles: true });
    const worksheet = workbook.addWorksheet(context.title.slice(0, 31));

    worksheet.columns = context.columns.map((column) => ({
      header: column.header,
      key: column.key,
      width: Math.min(Math.max(column.header.length + 2, 12), 40),
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.commit();

    for (const row of context.rows) {
      const rowObject: Record<string, string> = {};
      context.columns.forEach((column, index) => {
        rowObject[column.key] = row[index] ?? '';
      });
      worksheet.addRow(rowObject).commit();
    }

    await workbook.commit();

    return {
      filename: '',
      contentType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      disposition: 'attachment',
      stream,
    };
  }
}

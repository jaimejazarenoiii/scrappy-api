import { PassThrough } from 'node:stream';
import PDFDocument from 'pdfkit';
import type {
  ReportExportArtifact,
  ReportExportContext,
  ReportExporter,
} from './report-exporter.interface.js';

const PAGE_MARGIN = 40;
const ROW_HEIGHT = 14;

function formatFilterDate(date: Date | undefined): string {
  if (!date) return '—';
  return date.toISOString().slice(0, 10);
}

export class PdfReportExporter implements ReportExporter {
  readonly format = 'pdf' as const;

  async export(context: ReportExportContext): Promise<ReportExportArtifact> {
    const stream = new PassThrough();
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: 'A4', layout: 'landscape' });
    doc.pipe(stream);

    const generatedAt = new Date().toISOString();
    let pageNumber = 1;

    const drawHeader = (): void => {
      doc.fontSize(14).text(context.companyName, { align: 'left' });
      doc.fontSize(12).text(context.title, { align: 'left' });
      doc
        .fontSize(9)
        .text(
          `Period: ${formatFilterDate(context.from)} to ${formatFilterDate(context.to)}` +
            (context.search ? ` | Search: ${context.search}` : ''),
        );
      doc.moveDown(0.5);
      const tableTop = doc.y;
      let x = PAGE_MARGIN;
      const colWidth = (doc.page.width - PAGE_MARGIN * 2) / Math.max(context.columns.length, 1);
      doc.fontSize(8).font('Helvetica-Bold');
      for (const column of context.columns) {
        doc.text(column.header, x, tableTop, { width: colWidth - 4, ellipsis: true });
        x += colWidth;
      }
      doc.font('Helvetica');
      doc.y = tableTop + ROW_HEIGHT;
    };

    const drawFooter = (): void => {
      doc
        .fontSize(8)
        .text(
          `Page ${pageNumber} | Generated ${generatedAt}`,
          PAGE_MARGIN,
          doc.page.height - PAGE_MARGIN,
          { align: 'center', width: doc.page.width - PAGE_MARGIN * 2 },
        );
    };

    drawHeader();

    const colWidth = (doc.page.width - PAGE_MARGIN * 2) / Math.max(context.columns.length, 1);
    const bottomLimit = doc.page.height - PAGE_MARGIN - 20;

    for (const row of context.rows) {
      if (doc.y + ROW_HEIGHT > bottomLimit) {
        drawFooter();
        doc.addPage();
        pageNumber += 1;
        drawHeader();
      }
      let x = PAGE_MARGIN;
      const rowY = doc.y;
      context.columns.forEach((column, index) => {
        doc.fontSize(7).text(row[index] ?? '', x, rowY, {
          width: colWidth - 4,
          ellipsis: true,
          lineBreak: false,
        });
        x += colWidth;
      });
      doc.y = rowY + ROW_HEIGHT;
    }

    drawFooter();
    doc.end();

    return {
      filename: '',
      contentType: 'application/pdf',
      disposition: 'attachment',
      stream,
    };
  }
}

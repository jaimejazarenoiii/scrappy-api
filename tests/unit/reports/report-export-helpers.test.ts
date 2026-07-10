import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { CsvReportExporter } from '../../../src/modules/reports/infrastructure/export/csv-report-exporter.js';
import { buildExportFilename } from '../../../src/shared/reporting/export-filename.js';

async function readStream(stream: Readable): Promise<string> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks).toString('utf8');
}

describe('report export helpers', () => {
  it('escapes csv cells with commas and quotes', async () => {
    const exporter = new CsvReportExporter();
    const artifact = await exporter.export({
      companyName: 'Acme',
      title: 'Transactions',
      columns: [
        { key: 'party', header: 'Party' },
        { key: 'notes', header: 'Notes' },
      ],
      rows: [['Acme, Inc.', 'Said "hello"']],
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T23:59:59.999Z'),
    });
    const content = await readStream(artifact.stream);
    expect(content).toContain('"Acme, Inc."');
    expect(content).toContain('"Said ""hello"""');
    expect(artifact.contentType).toBe('text/csv; charset=utf-8');
  });

  it('builds export filenames with slugged company and date segments', () => {
    const filename = buildExportFilename(
      'transactions',
      'Acme Scrap Co.',
      new Date('2026-01-01T00:00:00.000Z'),
      new Date('2026-01-31T23:59:59.999Z'),
      'csv',
    );
    expect(filename).toMatch(/^transactions-acme-scrap-co-20260101-20260131-\d+\.csv$/);
  });
});

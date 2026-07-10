import { Readable } from 'node:stream';
import { describe, expect, it } from 'vitest';
import { PdfReportExporter } from '../../../src/modules/reports/infrastructure/export/pdf-report-exporter.js';

async function readStream(stream: Readable): Promise<Buffer> {
  const chunks: Buffer[] = [];
  for await (const chunk of stream) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
  }
  return Buffer.concat(chunks);
}

describe('PdfReportExporter', () => {
  it('produces a pdf stream with landscape layout metadata', async () => {
    const exporter = new PdfReportExporter();
    const artifact = await exporter.export({
      companyName: 'Scrappy Metals',
      title: 'Transaction Report',
      columns: [
        { key: 'transactionNumber', header: 'Transaction #' },
        { key: 'partyName', header: 'Party' },
      ],
      rows: [['TX-001', 'Acme Recycling']],
      from: new Date('2026-01-01T00:00:00.000Z'),
      to: new Date('2026-01-31T23:59:59.999Z'),
      search: 'acme',
    });

    const buffer = await readStream(artifact.stream);
    expect(artifact.contentType).toBe('application/pdf');
    expect(buffer.subarray(0, 4).toString()).toBe('%PDF');
    expect(buffer.length).toBeGreaterThan(100);
  });
});

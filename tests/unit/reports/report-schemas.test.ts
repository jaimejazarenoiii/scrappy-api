import { describe, expect, it } from 'vitest';
import {
  employeeReportQuerySchema,
  transactionReportExportQuerySchema,
  transactionReportQuerySchema,
} from '../../../src/modules/reports/presentation/reports.schemas.js';

describe('report schemas', () => {
  it('defaults transaction report pagination and sort', () => {
    const result = transactionReportQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
    });
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.page).toBe(1);
    expect(result.data.limit).toBe(20);
    expect(result.data.sortBy).toBe('transactionDate');
    expect(result.data.sortOrder).toBe('desc');
    expect(result.data.includeArchived).toBe(false);
  });

  it('requires from and to for transaction reports', () => {
    const result = transactionReportQuerySchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it('rejects inverted transaction date ranges', () => {
    const result = transactionReportQuerySchema.safeParse({
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts optional date range for employee reports', () => {
    const result = employeeReportQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.sortBy).toBe('lastName');
    expect(result.data.sortOrder).toBe('asc');
  });

  it('requires export format for transaction export', () => {
    const missingFormat = transactionReportExportQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
    });
    expect(missingFormat.success).toBe(false);

    const valid = transactionReportExportQuerySchema.safeParse({
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
      format: 'csv',
    });
    expect(valid.success).toBe(true);
  });
});

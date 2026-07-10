import { describe, expect, it } from 'vitest';
import { ValidationAppError } from '../../../src/shared/errors/http-exceptions.js';
import { ReportFilterPipeline } from '../../../src/modules/reports/application/services/report-filter-pipeline.js';
import type { ReportFilterValidatorService } from '../../../src/modules/reports/application/services/report-filter-validator.service.js';

const noopValidator = {
  validateReferences: async () => {},
} as unknown as ReportFilterValidatorService;

describe('ReportFilterPipeline', () => {
  const pipeline = new ReportFilterPipeline(noopValidator);
  const companyId = '550e8400-e29b-41d4-a716-446655440000';

  it('requires from and to when date policy is required', async () => {
    await expect(
      pipeline.build(companyId, {}, { required: true }, 'transactionDate', 'desc'),
    ).rejects.toThrow(ValidationAppError);
    await expect(
      pipeline.build(
        companyId,
        { from: new Date('2026-01-01') },
        { required: true },
        'transactionDate',
        'desc',
      ),
    ).rejects.toThrow('from and to are required');
  });

  it('rejects partial optional date ranges', async () => {
    await expect(
      pipeline.build(
        companyId,
        { from: new Date('2026-01-01T00:00:00.000Z') },
        { required: false },
        'lastName',
        'asc',
      ),
    ).rejects.toThrow('from and to must both be provided');
  });

  it('rejects inverted date ranges', async () => {
    await expect(
      pipeline.build(
        companyId,
        {
          from: new Date('2026-02-01T00:00:00.000Z'),
          to: new Date('2026-01-01T00:00:00.000Z'),
        },
        { required: true },
        'transactionDate',
        'desc',
      ),
    ).rejects.toThrow('to must be greater than or equal to from');
  });

  it('rejects ranges longer than 366 days', async () => {
    await expect(
      pipeline.build(
        companyId,
        {
          from: new Date('2025-01-01T00:00:00.000Z'),
          to: new Date('2026-02-01T00:00:00.000Z'),
        },
        { required: true },
        'transactionDate',
        'desc',
      ),
    ).rejects.toThrow('Date range cannot exceed 366 days');
  });

  it('accepts valid required date range and normalizes pagination', async () => {
    const ctx = await pipeline.build(
      companyId,
      {
        from: new Date('2026-01-01T00:00:00.000Z'),
        to: new Date('2026-01-31T23:59:59.999Z'),
        page: 2,
        limit: 10,
      },
      { required: true },
      'transactionDate',
      'desc',
    );
    expect(ctx.filter.from?.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(ctx.filter.to?.toISOString()).toBe('2026-01-31T23:59:59.999Z');
    expect(ctx.pagination).toEqual({ page: 2, limit: 10 });
    expect(ctx.sort.sortBy).toBe('transactionDate');
  });
});

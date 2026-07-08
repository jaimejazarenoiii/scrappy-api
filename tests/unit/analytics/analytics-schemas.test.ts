import { describe, expect, it } from 'vitest';
import { analyticsFilterQuerySchema } from '../../../src/modules/analytics/presentation/analytics.schemas.js';

describe('analyticsFilterQuerySchema', () => {
  it('defaults period to THIS_MONTH and limit to 10', () => {
    const result = analyticsFilterQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (!result.success) return;
    expect(result.data.period).toBe('THIS_MONTH');
    expect(result.data.limit).toBe(10);
    expect(result.data.includeArchived).toBe(false);
  });

  it('requires from and to for CUSTOM period', () => {
    const result = analyticsFilterQuerySchema.safeParse({ period: 'CUSTOM' });
    expect(result.success).toBe(false);
  });

  it('rejects to before from', () => {
    const result = analyticsFilterQuerySchema.safeParse({
      period: 'CUSTOM',
      from: '2026-02-01T00:00:00.000Z',
      to: '2026-01-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('rejects ranges longer than 366 days', () => {
    const result = analyticsFilterQuerySchema.safeParse({
      period: 'CUSTOM',
      from: '2025-01-01T00:00:00.000Z',
      to: '2026-02-01T00:00:00.000Z',
    });
    expect(result.success).toBe(false);
  });

  it('accepts valid custom range and org filters', () => {
    const result = analyticsFilterQuerySchema.safeParse({
      period: 'CUSTOM',
      from: '2026-01-01T00:00:00.000Z',
      to: '2026-01-31T23:59:59.999Z',
      branchId: '550e8400-e29b-41d4-a716-446655440000',
      limit: 5,
      includeArchived: true,
    });
    expect(result.success).toBe(true);
  });
});

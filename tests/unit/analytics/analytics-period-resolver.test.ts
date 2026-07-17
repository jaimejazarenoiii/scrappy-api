import { describe, expect, it } from 'vitest';
import { AnalyticsPeriodResolverService } from '../../../src/modules/analytics/application/services/analytics-period-resolver.service.js';

describe('AnalyticsPeriodResolverService', () => {
  const resolver = new AnalyticsPeriodResolverService();
  const now = new Date('2026-07-09T14:30:00.000Z');

  it('resolves TODAY in PH time', () => {
    const bounds = resolver.resolve('TODAY', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-08T16:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-09T15:59:59.999Z');
  });

  it('resolves YESTERDAY in PH time', () => {
    const bounds = resolver.resolve('YESTERDAY', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-07T16:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-08T15:59:59.999Z');
  });

  it('resolves THIS_WEEK from Monday through Sunday in PH time', () => {
    const bounds = resolver.resolve('THIS_WEEK', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-05T16:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-12T15:59:59.999Z');
  });

  it('resolves THIS_MONTH in PH time', () => {
    const bounds = resolver.resolve('THIS_MONTH', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-06-30T16:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-31T15:59:59.999Z');
  });

  it('resolves THIS_YEAR in PH time', () => {
    const bounds = resolver.resolve('THIS_YEAR', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2025-12-31T16:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-12-31T15:59:59.999Z');
  });

  it('resolves CUSTOM bounds verbatim', () => {
    const from = new Date('2026-01-01T00:00:00.000Z');
    const to = new Date('2026-01-31T23:59:59.999Z');
    const bounds = resolver.resolve('CUSTOM', from, to, now);
    expect(bounds.from).toEqual(from);
    expect(bounds.to).toEqual(to);
  });

  it('throws when CUSTOM is missing from or to', () => {
    expect(() => resolver.resolve('CUSTOM', undefined, undefined, now)).toThrow(
      'Custom period requires from and to',
    );
  });
});

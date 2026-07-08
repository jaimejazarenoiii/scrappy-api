import { describe, expect, it } from 'vitest';
import { AnalyticsPeriodResolverService } from '../../../src/modules/analytics/application/services/analytics-period-resolver.service.js';

describe('AnalyticsPeriodResolverService', () => {
  const resolver = new AnalyticsPeriodResolverService();
  const now = new Date('2026-07-09T14:30:00.000Z');

  it('resolves TODAY in UTC', () => {
    const bounds = resolver.resolve('TODAY', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-09T00:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-09T23:59:59.999Z');
  });

  it('resolves YESTERDAY in UTC', () => {
    const bounds = resolver.resolve('YESTERDAY', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-08T00:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-08T23:59:59.999Z');
  });

  it('resolves THIS_WEEK from Monday through Sunday UTC', () => {
    const bounds = resolver.resolve('THIS_WEEK', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-06T00:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-12T23:59:59.999Z');
  });

  it('resolves THIS_MONTH in UTC', () => {
    const bounds = resolver.resolve('THIS_MONTH', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-07-01T00:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-07-31T23:59:59.999Z');
  });

  it('resolves THIS_YEAR in UTC', () => {
    const bounds = resolver.resolve('THIS_YEAR', undefined, undefined, now);
    expect(bounds.from.toISOString()).toBe('2026-01-01T00:00:00.000Z');
    expect(bounds.to.toISOString()).toBe('2026-12-31T23:59:59.999Z');
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

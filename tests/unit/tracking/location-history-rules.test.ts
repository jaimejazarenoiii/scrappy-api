import { describe, expect, it } from 'vitest';
import { shouldAppendHistory } from '../../../src/modules/tracking/domain/location-history-rules.js';

describe('shouldAppendHistory', () => {
  it('allows first point when no prior history exists', () => {
    expect(shouldAppendHistory(null, new Date('2026-07-24T10:00:00Z'), 15_000)).toBe(true);
  });

  it('skips when new capture is within sampling interval', () => {
    const last = new Date('2026-07-24T10:00:00Z');
    const next = new Date('2026-07-24T10:00:10Z');
    expect(shouldAppendHistory(last, next, 15_000)).toBe(false);
  });

  it('allows when interval elapsed', () => {
    const last = new Date('2026-07-24T10:00:00Z');
    const next = new Date('2026-07-24T10:00:15Z');
    expect(shouldAppendHistory(last, next, 15_000)).toBe(true);
  });

  it('always allows when sampling is disabled (0)', () => {
    const last = new Date('2026-07-24T10:00:00Z');
    const next = new Date('2026-07-24T10:00:01Z');
    expect(shouldAppendHistory(last, next, 0)).toBe(true);
  });
});

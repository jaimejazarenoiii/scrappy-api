import { describe, expect, it } from 'vitest';
import { deriveTrackingStatus } from '../../../src/modules/tracking/domain/tracking-status.js';
import { assertNotMockLocation } from '../../../src/modules/tracking/domain/tracking-rules.js';
import { ForbiddenError } from '../../../src/shared/errors/http-exceptions.js';

describe('tracking-status', () => {
  it('returns ONLINE within staleness window', () => {
    const now = new Date();
    const lastSeen = new Date(now.getTime() - 60_000);
    expect(deriveTrackingStatus(lastSeen, 'trip-1', 300_000, now)).toBe('ONLINE');
  });

  it('returns OFFLINE outside staleness window', () => {
    const now = new Date();
    const lastSeen = new Date(now.getTime() - 400_000);
    expect(deriveTrackingStatus(lastSeen, 'trip-1', 300_000, now)).toBe('OFFLINE');
  });
});

describe('tracking-rules', () => {
  it('rejects mock locations', () => {
    expect(() => assertNotMockLocation(true)).toThrow(ForbiddenError);
  });
});

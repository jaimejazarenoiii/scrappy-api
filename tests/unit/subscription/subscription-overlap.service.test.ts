import { describe, expect, it } from 'vitest';
import {
  rangesOverlap,
  findOverlappingPeriod,
} from '../../../src/modules/subscription/domain/subscription-overlap.service.js';

describe('subscription-overlap.service', () => {
  const jan = new Date('2026-01-01T00:00:00.000Z');
  const janEnd = new Date('2026-01-31T23:59:59.999Z');
  const feb = new Date('2026-02-01T00:00:00.000Z');
  const febEnd = new Date('2026-02-28T23:59:59.999Z');

  it('detects overlapping inclusive ranges', () => {
    expect(
      rangesOverlap({ startsAt: jan, endsAt: janEnd }, { startsAt: feb, endsAt: febEnd }),
    ).toBe(false);
    expect(
      rangesOverlap({ startsAt: jan, endsAt: febEnd }, { startsAt: feb, endsAt: febEnd }),
    ).toBe(true);
    expect(
      rangesOverlap({ startsAt: feb, endsAt: febEnd }, { startsAt: jan, endsAt: janEnd }),
    ).toBe(false);
    expect(
      rangesOverlap({ startsAt: jan, endsAt: febEnd }, { startsAt: janEnd, endsAt: febEnd }),
    ).toBe(true);
  });

  it('finds overlapping period in list', () => {
    const existing = [
      { id: 'a', startsAt: jan, endsAt: janEnd },
      { id: 'b', startsAt: feb, endsAt: febEnd },
    ];
    const overlap = findOverlappingPeriod({ startsAt: janEnd, endsAt: febEnd }, existing);
    expect(overlap?.id).toBe('a');
  });

  it('excludes id when checking renew overlap against self', () => {
    const existing = [{ id: 'a', startsAt: jan, endsAt: janEnd }];
    expect(findOverlappingPeriod({ startsAt: jan, endsAt: janEnd }, existing, 'a')).toBeNull();
  });
});

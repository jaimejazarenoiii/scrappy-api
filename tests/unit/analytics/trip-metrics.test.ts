import { describe, expect, it } from 'vitest';
import { assignRanks } from '../../../src/shared/analytics/analytics-ranking.js';

describe('trip ranking helpers', () => {
  it('assigns ranks with deterministic tie-break by label', () => {
    const ranked = assignRanks([
      { id: 'b', label: 'Bravo', value: 2, unit: 'count' },
      { id: 'a', label: 'Alpha', value: 2, unit: 'count' },
      { id: 'c', label: 'Charlie', value: 5, unit: 'count' },
    ]);

    expect(ranked[0]).toMatchObject({ id: 'c', rank: 1 });
    expect(ranked[1]).toMatchObject({ id: 'a', rank: 2 });
    expect(ranked[2]).toMatchObject({ id: 'b', rank: 3 });
  });
});

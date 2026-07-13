export interface DateRange {
  startsAt: Date;
  endsAt: Date;
}

export function assertValidDateRange(range: DateRange): void {
  if (range.startsAt.getTime() > range.endsAt.getTime()) {
    throw new Error('startsAt must be before or equal to endsAt');
  }
}

/** Inclusive range intersection: [a,b] overlaps [c,d] when a <= d && c <= b */
export function rangesOverlap(left: DateRange, right: DateRange): boolean {
  return (
    left.startsAt.getTime() <= right.endsAt.getTime() &&
    right.startsAt.getTime() <= left.endsAt.getTime()
  );
}

export function findOverlappingPeriod<T extends DateRange>(
  candidate: DateRange,
  existing: T[],
  excludeId?: string,
): T | null {
  for (const period of existing) {
    if (excludeId && 'id' in period && (period as T & { id: string }).id === excludeId) {
      continue;
    }
    if (rangesOverlap(candidate, period)) {
      return period;
    }
  }
  return null;
}

export function assertNoOverlap<T extends DateRange>(
  candidate: DateRange,
  existing: T[],
  excludeId?: string,
): void {
  assertValidDateRange(candidate);
  const overlap = findOverlappingPeriod(candidate, existing, excludeId);
  if (overlap) {
    throw new Error('Subscription period overlaps an existing period');
  }
}

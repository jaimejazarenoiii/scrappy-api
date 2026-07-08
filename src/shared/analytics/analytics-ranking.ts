export interface RankedInput {
  id?: string | null;
  label: string;
  value: number;
  unit?: string | null;
}

export interface RankedMetricItem {
  id: string | null;
  label: string;
  value: number;
  unit: string | null;
  rank: number;
}

export function clampRankingLimit(
  limit: number | undefined,
  defaultLimit = 10,
  maxLimit = 25,
): number {
  if (limit === undefined) return defaultLimit;
  return Math.min(Math.max(limit, 1), maxLimit);
}

export function assignRanks(items: RankedInput[]): RankedMetricItem[] {
  const sorted = [...items].sort((a, b) => {
    if (b.value !== a.value) return b.value - a.value;
    return a.label.localeCompare(b.label);
  });
  return sorted.map((item, index) => ({
    id: item.id ?? null,
    label: item.label,
    value: item.value,
    unit: item.unit ?? null,
    rank: index + 1,
  }));
}

export function roundMoney(value: number): number {
  return Math.round(value * 100) / 100;
}

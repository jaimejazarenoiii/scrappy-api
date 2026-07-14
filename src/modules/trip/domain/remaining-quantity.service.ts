export interface QuantityLine {
  materialNameNorm: string;
  unit: string;
  quantity: number;
}

/**
 * Sums outbound sold quantities keyed by `${norm}|${unit}`.
 */
export function sumOutboundByMaterial(
  lines: ReadonlyArray<{ materialNameNorm: string; unit: string; weight: number }>,
): Map<string, number> {
  const map = new Map<string, number>();
  for (const line of lines) {
    const key = `${line.materialNameNorm}|${line.unit}`;
    map.set(key, (map.get(key) ?? 0) + line.weight);
  }
  return map;
}

/**
 * Remaining = loaded − sold for the same normalized material + unit.
 */
export function calculateRemainingQuantity(loaded: number, outboundSold: number): number {
  return loaded - outboundSold;
}

export function materialUnitKey(materialNameNorm: string, unit: string): string {
  return `${materialNameNorm}|${unit}`;
}

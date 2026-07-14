import { describe, expect, it } from 'vitest';
import {
  calculateRemainingQuantity,
  materialUnitKey,
  sumOutboundByMaterial,
} from '../../../src/modules/trip/domain/remaining-quantity.service.js';

describe('remaining-quantity.service', () => {
  it('sums outbound weights keyed by material and unit', () => {
    const map = sumOutboundByMaterial([
      { materialNameNorm: 'copper', unit: 'KG', weight: 10 },
      { materialNameNorm: 'copper', unit: 'KG', weight: 5 },
      { materialNameNorm: 'copper', unit: 'TON', weight: 2 },
      { materialNameNorm: 'steel', unit: 'KG', weight: 3 },
    ]);
    expect(map.get(materialUnitKey('copper', 'KG'))).toBe(15);
    expect(map.get(materialUnitKey('copper', 'TON'))).toBe(2);
    expect(map.get(materialUnitKey('steel', 'KG'))).toBe(3);
  });

  it('computes remaining as loaded minus outbound', () => {
    expect(calculateRemainingQuantity(100, 40)).toBe(60);
    expect(calculateRemainingQuantity(100, 0)).toBe(100);
  });

  it('allows negative remaining when outbound exceeds loaded', () => {
    expect(calculateRemainingQuantity(50, 80)).toBe(-30);
  });

  it('returns empty map for no outbound lines', () => {
    expect(sumOutboundByMaterial([]).size).toBe(0);
  });
});

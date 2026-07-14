import { describe, expect, it } from 'vitest';
import {
  assertNonEmptyMaterialName,
  normalizeMaterialName,
} from '../../../src/modules/trip/domain/material-name.js';

describe('material-name', () => {
  it('normalizes by trimming and lowercasing', () => {
    expect(normalizeMaterialName('  Copper Wire ')).toBe('copper wire');
    expect(normalizeMaterialName('ALUMINUM')).toBe('aluminum');
  });

  it('treats differently-cased names as equal after normalization', () => {
    expect(normalizeMaterialName('Steel')).toBe(normalizeMaterialName('steel'));
  });

  it('returns trimmed display name for non-empty input', () => {
    expect(assertNonEmptyMaterialName('  Brass ')).toBe('Brass');
  });

  it('throws for empty or whitespace-only names', () => {
    expect(() => assertNonEmptyMaterialName('   ')).toThrow();
    expect(() => assertNonEmptyMaterialName('')).toThrow();
  });
});

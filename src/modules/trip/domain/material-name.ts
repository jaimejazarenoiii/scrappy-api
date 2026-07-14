/**
 * Normalizes material names for uniqueness and matching (trim + case-insensitive).
 */
export function normalizeMaterialName(name: string): string {
  return name.trim().toLowerCase();
}

/**
 * Returns display name after trimming; throws if empty.
 */
export function assertNonEmptyMaterialName(name: string): string {
  const trimmed = name.trim();
  if (!trimmed) {
    throw new Error('materialName is required');
  }
  return trimmed;
}

export function normalizeReportSearch(search?: string): string | undefined {
  if (search === undefined || search === null) return undefined;
  const trimmed = search.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}

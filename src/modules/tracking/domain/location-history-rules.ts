/**
 * Returns true when a new history point should be stored for the sampling window.
 */
export function shouldAppendHistory(
  lastCapturedAt: Date | null,
  newCapturedAt: Date,
  sampleMs: number,
): boolean {
  if (sampleMs <= 0) return true;
  if (!lastCapturedAt) return true;
  return newCapturedAt.getTime() - lastCapturedAt.getTime() >= sampleMs;
}

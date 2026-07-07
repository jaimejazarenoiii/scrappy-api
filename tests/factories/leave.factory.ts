export function makeLeavePayload(overrides: Record<string, unknown> = {}) {
  return {
    leaveType: 'FULL_DAY',
    leaveDate: '2026-07-15',
    reason: 'Personal errand',
    ...overrides,
  };
}

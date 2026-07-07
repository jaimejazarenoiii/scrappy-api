export function makePayrollPayload(overrides: Record<string, unknown> = {}) {
  return {
    payPeriodStart: '2026-07-07',
    payPeriodEnd: '2026-07-13',
    ...overrides,
  };
}

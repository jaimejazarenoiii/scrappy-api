export function makeCashAdvancePayload(
  employeeId: string,
  overrides: Record<string, unknown> = {},
) {
  return {
    employeeId,
    amount: 500,
    reason: 'Emergency advance',
    ...overrides,
  };
}

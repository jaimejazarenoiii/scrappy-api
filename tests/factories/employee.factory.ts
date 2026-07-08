export function makeEmployeePayload(overrides: Record<string, unknown> = {}) {
  return {
    firstName: 'Jane',
    lastName: 'Doe',
    weeklySalary: 3500,
    ...overrides,
  };
}

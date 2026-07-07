export function makeBranchPayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Main Branch',
    address: '123 Main St, Manila',
    contactNumber: '09171234567',
    status: 'ACTIVE',
    ...overrides,
  };
}

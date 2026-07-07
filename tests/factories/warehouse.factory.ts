export function makeWarehousePayload(overrides: Record<string, unknown> = {}) {
  return {
    name: 'Central Warehouse',
    address: '456 Storage Ave, Manila',
    contactNumber: '09181234567',
    status: 'ACTIVE',
    ...overrides,
  };
}

export function makeVehiclePayload(overrides: Record<string, unknown> = {}) {
  return {
    plateNumber: 'ABC-1234',
    description: 'Delivery truck',
    status: 'AVAILABLE',
    ...overrides,
  };
}

export interface TransactionItemPayload {
  materialName: string;
  weight: number;
  unit: string;
  price: number;
  total?: number;
  notes?: string;
}

export function buildTransactionItem(
  overrides: Partial<TransactionItemPayload> = {},
): TransactionItemPayload {
  return {
    materialName: 'Copper Wire',
    weight: 10,
    unit: 'KG',
    price: 250,
    ...overrides,
  };
}

export function buildTransaction(
  assignedEmployeeIds: string[],
  overrides: Record<string, unknown> = {},
) {
  return {
    direction: 'INBOUND',
    partyName: 'Acme Recycling',
    locationType: 'OUTSIDE',
    outsideLocationName: 'Roadside Pickup',
    outsideAddress: '123 Scrap Lane',
    assignedEmployeeIds,
    items: [buildTransactionItem()],
    ...overrides,
  };
}

export function buildBranchTransaction(
  assignedEmployeeIds: string[],
  branchId: string,
  overrides: Record<string, unknown> = {},
) {
  return buildTransaction(assignedEmployeeIds, {
    locationType: 'BRANCH',
    branchId,
    outsideLocationName: undefined,
    outsideAddress: undefined,
    ...overrides,
  });
}

export function buildWarehouseTransaction(
  assignedEmployeeIds: string[],
  warehouseId: string,
  overrides: Record<string, unknown> = {},
) {
  return buildTransaction(assignedEmployeeIds, {
    locationType: 'WAREHOUSE',
    warehouseId,
    outsideLocationName: undefined,
    outsideAddress: undefined,
    ...overrides,
  });
}

export function buildAssignment(employeeId: string): string {
  return employeeId;
}

export interface AttachmentFixture {
  buffer: Buffer;
  fileName: string;
  mimeType: string;
}

export function buildTransactionAttachment(
  overrides: Partial<AttachmentFixture> = {},
): AttachmentFixture {
  return {
    buffer: Buffer.from('fake-image-bytes'),
    fileName: 'receipt.jpg',
    mimeType: 'image/jpeg',
    ...overrides,
  };
}

export interface OperationalResource {
  status: string;
  deletedAt: Date | null;
}

export function isOperationallyEligible(resource: OperationalResource): boolean {
  if (resource.deletedAt !== null) return false;
  if (resource.status === 'ACTIVE' || resource.status === 'AVAILABLE') return true;
  return false;
}

export function assertOperationallyEligible(
  resource: OperationalResource,
  message = 'Resource is not available for operational use',
): void {
  if (!isOperationallyEligible(resource)) {
    throw new Error(message);
  }
}

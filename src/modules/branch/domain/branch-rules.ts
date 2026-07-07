import { DuplicateResourceError } from '../../../shared/errors/http-exceptions.js';
import type { BranchEntity } from './branch.entity.js';

export function assertBranchNameAvailable(
  existing: BranchEntity | null,
  excludeBranchId?: string,
): void {
  if (existing && existing.id !== excludeBranchId) {
    throw new DuplicateResourceError('Branch name already exists in this company');
  }
}

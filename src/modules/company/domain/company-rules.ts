import {
  DuplicateResourceError,
  LifecycleConflictError,
} from '../../../shared/errors/http-exceptions.js';
import type { CompanyEntity } from './company.entity.js';

export function assertCompanyIsActive(company: CompanyEntity): void {
  if (!company.isActive()) {
    throw new LifecycleConflictError('Inactive or deleted company cannot perform this action');
  }
}

export function assertUniqueCompany(existing: CompanyEntity | null): void {
  if (existing) {
    throw new DuplicateResourceError('Company already exists');
  }
}

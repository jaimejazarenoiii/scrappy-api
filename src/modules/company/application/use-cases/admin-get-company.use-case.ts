import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { AdminCompanyResponseDto } from '../dto/admin-company.response.js';
import { toAdminCompanyResponse } from '../mappers/admin-company.mapper.js';

export class AdminGetCompanyUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(auth: AuthorizationContext, companyId: string): Promise<AdminCompanyResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company || company.isDeleted()) {
      throw new ResourceNotFoundError('Company not found');
    }
    return toAdminCompanyResponse(company);
  }
}

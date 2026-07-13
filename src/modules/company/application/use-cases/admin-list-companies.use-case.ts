import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { CompanyRepository, ListCompaniesQuery } from '../../domain/company.repository.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { AdminCompanyResponseDto } from '../dto/admin-company.response.js';
import { toAdminCompanyResponse } from '../mappers/admin-company.mapper.js';

export class AdminListCompaniesUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(
    auth: AuthorizationContext,
    query: ListCompaniesQuery,
  ): Promise<{ items: AdminCompanyResponseDto[]; total: number }> {
    assertSuperAdmin(auth);
    const result = await this.companyRepository.list(query);
    return {
      items: result.items.map(toAdminCompanyResponse),
      total: result.total,
    };
  }
}

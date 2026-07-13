import { randomUUID } from 'node:crypto';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { emitStructuredAudit } from '../../../../shared/audit/emit-structured-audit.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import { assertUniqueCompany } from '../../domain/company-rules.js';
import { assertSuperAdmin } from '../../../subscription/application/policies/subscription-authorization.policy.js';
import type { AdminCreateCompanyRequestDto } from '../dto/admin-create-company.request.js';
import type { AdminCompanyResponseDto } from '../dto/admin-company.response.js';
import { toAdminCompanyResponse } from '../mappers/admin-company.mapper.js';

export class AdminCreateCompanyUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(
    auth: AuthorizationContext,
    input: AdminCreateCompanyRequestDto,
  ): Promise<AdminCompanyResponseDto> {
    assertSuperAdmin(auth);
    const existing = await this.companyRepository.findByName(input.name);
    assertUniqueCompany(existing);
    const company = await this.companyRepository.create({
      id: randomUUID(),
      name: input.name,
      logoUrl: input.logoUrl ?? null,
      contactNumber: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
    });
    emitStructuredAudit('admin company created', {
      action: 'admin.company_created',
      companyId: company.id,
      resourceType: 'company',
      resourceId: company.id,
      actorUserId: auth.userId,
      metadata: { name: company.name },
    });
    return toAdminCompanyResponse(company);
  }
}

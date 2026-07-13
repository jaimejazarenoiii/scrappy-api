import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository, UpdateCompanyInput } from '../../domain/company.repository.js';
import type { CompanyResponseDto } from '../dto/company.response.js';
import { logCompanyAudit } from '../services/company-audit.service.js';

export class UpdateCompanyUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}
  async execute(
    companyId: string,
    input: UpdateCompanyInput,
    actorUserId?: string,
  ): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    const updated = await this.companyRepository.update(companyId, input);
    logCompanyAudit({
      action: 'company.updated',
      companyId,
      resourceType: 'company',
      resourceId: companyId,
      actorUserId,
    });
    return {
      id: updated.id,
      name: updated.name,
      logoUrl: updated.logoUrl,
      contactNumber: updated.contactNumber,
      email: updated.email,
      address: updated.address,
      status: updated.status,
    };
  }
}

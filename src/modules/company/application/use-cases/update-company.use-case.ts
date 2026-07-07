import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository, UpdateCompanyInput } from '../../domain/company.repository.js';
import type { CompanyResponseDto } from '../dto/company.response.js';

export class UpdateCompanyUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}
  async execute(companyId: string, input: UpdateCompanyInput): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    const updated = await this.companyRepository.update(companyId, input);
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

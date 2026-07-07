import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import type { CompanyResponseDto } from '../dto/company.response.js';

export class GetCompanyUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}
  async execute(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    return {
      id: company.id,
      name: company.name,
      logoUrl: company.logoUrl,
      contactNumber: company.contactNumber,
      email: company.email,
      address: company.address,
      status: company.status,
    };
  }
}

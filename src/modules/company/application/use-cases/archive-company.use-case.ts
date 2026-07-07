import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import type { CompanyResponseDto } from '../dto/company.response.js';

export class ArchiveCompanyUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}
  async execute(companyId: string): Promise<CompanyResponseDto> {
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    const archived = await this.companyRepository.softDelete(companyId);
    return {
      id: archived.id,
      name: archived.name,
      logoUrl: archived.logoUrl,
      contactNumber: archived.contactNumber,
      email: archived.email,
      address: archived.address,
      status: archived.status,
    };
  }
}

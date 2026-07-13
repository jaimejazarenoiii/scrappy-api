import type { CompanyEntity } from '../../domain/company.entity.js';
import type { AdminCompanyResponseDto } from '../dto/admin-company.response.js';

export function toAdminCompanyResponse(company: CompanyEntity): AdminCompanyResponseDto {
  return {
    id: company.id,
    name: company.name,
    logoUrl: company.logoUrl,
    contactNumber: company.contactNumber,
    email: company.email,
    address: company.address,
    status: company.status,
    subscriptionStatus: company.subscriptionStatus,
    createdAt: company.createdAt,
    updatedAt: company.updatedAt,
  };
}

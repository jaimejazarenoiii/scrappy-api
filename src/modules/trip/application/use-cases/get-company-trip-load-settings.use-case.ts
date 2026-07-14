import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import { type TripLoadSettingsDto } from '../dto/trip-load.response.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';

export class GetCompanyTripLoadSettingsUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(auth: AuthorizationContext): Promise<TripLoadSettingsDto> {
    assertCanManageTrips(auth.role);
    const company = await this.companyRepository.findById(auth.companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');
    return { defaultStrictLoadValidation: company.defaultStrictLoadValidation };
  }
}

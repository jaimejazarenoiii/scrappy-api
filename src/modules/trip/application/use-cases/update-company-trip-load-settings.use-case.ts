import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { UpdateTripLoadSettingsRequestDto } from '../dto/trip-load.request.js';
import { type TripLoadSettingsDto } from '../dto/trip-load.response.js';
import { assertCanManageTrips } from '../policies/trip-authorization.policy.js';

export class UpdateCompanyTripLoadSettingsUseCase {
  constructor(private readonly companyRepository: CompanyRepository) {}

  async execute(
    auth: AuthorizationContext,
    input: UpdateTripLoadSettingsRequestDto,
  ): Promise<TripLoadSettingsDto> {
    assertCanManageTrips(auth.role);
    const company = await this.companyRepository.findById(auth.companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const updated =
      input.defaultStrictLoadValidation === undefined
        ? company
        : await this.companyRepository.update(auth.companyId, {
            defaultStrictLoadValidation: input.defaultStrictLoadValidation,
          });

    return { defaultStrictLoadValidation: updated.defaultStrictLoadValidation };
  }
}

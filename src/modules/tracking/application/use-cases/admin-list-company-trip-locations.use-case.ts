import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { ListActiveTripLocationsQueryDto } from '../dto/current-location.response.js';
import { assertSuperAdmin } from '../policies/tracking-authorization.policy.js';
import { ListActiveTripLocationsUseCase } from './list-active-trip-locations.use-case.js';

export class AdminListCompanyTripLocationsUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly listActiveTripLocationsUseCase: ListActiveTripLocationsUseCase,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    query: ListActiveTripLocationsQueryDto,
  ) {
    assertSuperAdmin(auth);

    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    return this.listActiveTripLocationsUseCase.execute({ ...auth, companyId }, query);
  }
}

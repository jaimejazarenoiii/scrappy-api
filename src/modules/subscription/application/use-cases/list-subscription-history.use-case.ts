import type { AuthorizationContext } from '../../../../shared/policy/authorization-context.js';
import { buildPaginationMeta } from '../../../../shared/pagination/pagination.utils.js';
import type { PaginationMeta } from '../../../../shared/types/api-response.type.js';
import { ResourceNotFoundError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type {
  CompanySubscriptionRepository,
  ListCompanySubscriptionsQuery,
} from '../../domain/company-subscription.repository.js';
import type { CompanySubscriptionResponseDto } from '../dto/subscription.dto.js';
import { toCompanySubscriptionResponse } from '../dto/subscription.dto.js';
import { assertSuperAdmin } from '../policies/subscription-authorization.policy.js';

export interface ListSubscriptionHistoryResponseDto {
  items: CompanySubscriptionResponseDto[];
  meta: PaginationMeta;
}

export class ListSubscriptionHistoryUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly subscriptionRepository: CompanySubscriptionRepository,
  ) {}

  async execute(
    auth: AuthorizationContext,
    companyId: string,
    query: ListCompanySubscriptionsQuery,
  ): Promise<ListSubscriptionHistoryResponseDto> {
    assertSuperAdmin(auth);
    const company = await this.companyRepository.findById(companyId);
    if (!company) throw new ResourceNotFoundError('Company not found');

    const normalized = {
      ...query,
      sortOrder: query.sortOrder ?? 'desc',
    };
    const result = await this.subscriptionRepository.listByCompany(companyId, normalized);
    return {
      items: result.items.map(toCompanySubscriptionResponse),
      meta: buildPaginationMeta(normalized.page, normalized.limit, result.total),
    };
  }
}

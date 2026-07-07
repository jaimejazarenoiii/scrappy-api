import type { TransactionSuggestionRepository } from '../../domain/transaction-suggestion.repository.js';
import type { PriceSuggestionResponseDto } from '../dto/suggestion.response.js';

export interface PriceSuggestionQuery {
  materialName: string;
  limit: number;
}

export class GetPriceSuggestionsUseCase {
  constructor(private readonly suggestionRepository: TransactionSuggestionRepository) {}

  async execute(
    companyId: string,
    query: PriceSuggestionQuery,
  ): Promise<PriceSuggestionResponseDto[]> {
    const suggestions = await this.suggestionRepository.suggestPrices(
      companyId,
      query.materialName,
      query.limit,
    );
    return suggestions.map((suggestion) => ({
      price: suggestion.price,
      lastUsedAt: suggestion.lastUsedAt,
    }));
  }
}

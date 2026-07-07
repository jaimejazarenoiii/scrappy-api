import type { TransactionSuggestionRepository } from '../../domain/transaction-suggestion.repository.js';
import type { MaterialSuggestionResponseDto } from '../dto/suggestion.response.js';

export interface MaterialSuggestionQuery {
  q?: string;
  limit: number;
}

export class GetMaterialSuggestionsUseCase {
  constructor(private readonly suggestionRepository: TransactionSuggestionRepository) {}

  async execute(
    companyId: string,
    query: MaterialSuggestionQuery,
  ): Promise<MaterialSuggestionResponseDto[]> {
    const suggestions = await this.suggestionRepository.suggestMaterials(
      companyId,
      query.q,
      query.limit,
    );
    return suggestions.map((suggestion) => ({
      materialName: suggestion.materialName,
      lastUsedAt: suggestion.lastUsedAt,
      usageCount: suggestion.usageCount,
    }));
  }
}

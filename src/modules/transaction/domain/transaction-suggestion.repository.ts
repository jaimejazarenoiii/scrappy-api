export interface MaterialSuggestion {
  materialName: string;
  lastUsedAt: Date;
  usageCount: number;
}

export interface PriceSuggestion {
  price: number;
  lastUsedAt: Date;
}

export interface TransactionSuggestionRepository {
  suggestMaterials(
    companyId: string,
    prefix: string | undefined,
    limit: number,
  ): Promise<MaterialSuggestion[]>;
  suggestPrices(companyId: string, materialName: string, limit: number): Promise<PriceSuggestion[]>;
}

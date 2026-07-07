export interface MaterialSuggestionResponseDto {
  materialName: string;
  lastUsedAt: Date;
  usageCount: number;
}

export interface PriceSuggestionResponseDto {
  price: number;
  lastUsedAt: Date;
}

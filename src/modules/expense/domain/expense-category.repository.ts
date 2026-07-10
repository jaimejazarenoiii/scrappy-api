export interface ExpenseCategoryRepository {
  listByCompany(companyId: string): Promise<string[]>;
}

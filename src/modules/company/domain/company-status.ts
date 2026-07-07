export const COMPANY_STATUSES = ['ACTIVE', 'INACTIVE'] as const;
export type CompanyStatus = (typeof COMPANY_STATUSES)[number];

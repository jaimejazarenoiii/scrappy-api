import type { CompanySubscriptionStatus } from '../../domain/company-subscription-status.js';

export interface AdminCompanyResponseDto {
  id: string;
  name: string;
  logoUrl: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
  subscriptionStatus: CompanySubscriptionStatus;
  createdAt: Date;
  updatedAt: Date;
}

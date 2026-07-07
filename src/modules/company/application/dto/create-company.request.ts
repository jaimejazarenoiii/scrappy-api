export interface CreateCompanyRequestDto {
  name: string;
  logoUrl?: string;
  contactNumber?: string;
  email?: string;
  address?: string;
  ownerFullName: string;
  ownerEmail: string;
  ownerPassword: string;
}

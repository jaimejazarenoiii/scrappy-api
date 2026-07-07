export interface CompanyResponseDto {
  id: string;
  name: string;
  logoUrl: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  status: 'ACTIVE' | 'INACTIVE';
}

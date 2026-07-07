import type { CompanyStatus } from './company-status.js';

export interface CompanyProps {
  id: string;
  name: string;
  logoUrl: string | null;
  contactNumber: string | null;
  email: string | null;
  address: string | null;
  status: CompanyStatus;
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

export class CompanyEntity {
  private constructor(private readonly props: CompanyProps) {}

  static create(props: CompanyProps): CompanyEntity {
    return new CompanyEntity(props);
  }

  get id(): string {
    return this.props.id;
  }
  get name(): string {
    return this.props.name;
  }
  get logoUrl(): string | null {
    return this.props.logoUrl;
  }
  get contactNumber(): string | null {
    return this.props.contactNumber;
  }
  get email(): string | null {
    return this.props.email;
  }
  get address(): string | null {
    return this.props.address;
  }
  get status(): CompanyStatus {
    return this.props.status;
  }
  get deletedAt(): Date | null {
    return this.props.deletedAt;
  }

  isDeleted(): boolean {
    return this.props.deletedAt !== null;
  }
  isActive(): boolean {
    return this.props.status === 'ACTIVE' && !this.isDeleted();
  }
  canBeManagedBy(companyId: string): boolean {
    return this.props.id === companyId;
  }

  toPrimitives(): CompanyProps {
    return { ...this.props };
  }
}

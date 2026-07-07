import { randomUUID } from 'node:crypto';
import type { PasswordHasher } from '../../../../shared/auth/password-hasher.interface.js';
import { DuplicateResourceError } from '../../../../shared/errors/http-exceptions.js';
import type { CompanyRepository } from '../../domain/company.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { CreateCompanyRequestDto } from '../dto/create-company.request.js';
import type { CompanyResponseDto } from '../dto/company.response.js';
import { assertUniqueCompany } from '../../domain/company-rules.js';

export class CreateCompanyWithOwnerUseCase {
  constructor(
    private readonly companyRepository: CompanyRepository,
    private readonly userRepository: UserRepository,
    private readonly passwordHasher: PasswordHasher,
  ) {}

  async execute(
    input: CreateCompanyRequestDto,
  ): Promise<{ company: CompanyResponseDto; owner: { id: string; email: string; role: 'OWNER' } }> {
    const existing = await this.companyRepository.findByName(input.name);
    assertUniqueCompany(existing);
    const existingUser = await this.userRepository.findByEmail(input.ownerEmail);
    if (existingUser) throw new DuplicateResourceError('Owner email already exists');
    const companyId = randomUUID();
    const ownerId = randomUUID();
    const passwordHash = await this.passwordHasher.hash(input.ownerPassword);
    const company = await this.companyRepository.create({
      id: companyId,
      name: input.name,
      logoUrl: input.logoUrl ?? null,
      contactNumber: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
    });
    const user = await this.userRepository.create({
      id: ownerId,
      companyId,
      email: input.ownerEmail,
      passwordHash,
      role: 'OWNER',
    });
    return {
      company: {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        contactNumber: company.contactNumber,
        email: company.email,
        address: company.address,
        status: company.status,
      },
      owner: { id: user.id, email: user.email, role: 'OWNER' },
    };
  }
}

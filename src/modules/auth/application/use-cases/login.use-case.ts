import { createHash, randomUUID } from 'node:crypto';
import { InvalidCredentialsError } from '../../../../shared/errors/http-exceptions.js';
import type { PasswordHasher } from '../../../../shared/auth/password-hasher.interface.js';
import type { TokenProvider } from '../../../../shared/auth/token-provider.interface.js';
import type { CompanyRepository } from '../../../company/domain/company.repository.js';
import type { SessionRepository } from '../../../session/domain/session.repository.js';
import type { UserRepository } from '../../../user/domain/user.repository.js';
import type { AuthResponseDto } from '../dto/auth.response.js';
import { assertValidLoginCompany, assertValidLoginUser } from '../services/login-policy.service.js';

export class LoginUseCase {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly companyRepository: CompanyRepository,
    private readonly sessionRepository: SessionRepository,
    private readonly passwordHasher: PasswordHasher,
    private readonly tokenProvider: TokenProvider,
  ) {}

  async execute(identifier: string, password: string): Promise<AuthResponseDto> {
    const user = assertValidLoginUser(await this.userRepository.findByEmail(identifier));
    const valid = await this.passwordHasher.compare(password, user.passwordHash);
    if (!valid) throw new InvalidCredentialsError();
    const company = assertValidLoginCompany(await this.companyRepository.findById(user.companyId));
    const sessionId = randomUUID();
    const payload = {
      sub: user.id,
      companyId: user.companyId,
      role: user.role,
      email: user.email,
      sessionId,
    };
    const accessToken = this.tokenProvider.signAccessToken(payload);
    const refreshToken = this.tokenProvider.signRefreshToken(payload);
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');
    await this.sessionRepository.create({
      id: sessionId,
      userId: user.id,
      tokenHash,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    });
    await this.userRepository.updateLastLogin(user.id);
    return {
      accessToken,
      refreshToken,
      expiresIn: this.tokenProvider.getAccessTokenTtlSeconds(),
      company: {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl,
        contactNumber: company.contactNumber,
        email: company.email,
        address: company.address,
        status: company.status,
      },
      user: { id: user.id, email: user.email, role: user.role },
    };
  }
}

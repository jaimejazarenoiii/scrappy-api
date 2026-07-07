import { describe, expect, it } from 'vitest';
import { CreateCompanyWithOwnerUseCase } from '../../../src/modules/company/application/use-cases/create-company-with-owner.use-case.js';
import { makeCompanyPayload } from '../../factories/company.factory.js';
import {
  FakePasswordHasher,
  InMemoryCompanyRepository,
  InMemoryUserRepository,
} from '../../setup/in-memory-repositories.js';

describe('CreateCompanyWithOwnerUseCase', () => {
  it('creates a company and owner', async () => {
    const useCase = new CreateCompanyWithOwnerUseCase(
      new InMemoryCompanyRepository(),
      new InMemoryUserRepository(),
      new FakePasswordHasher(),
    );
    const result = await useCase.execute(makeCompanyPayload());
    expect(result.company.name).toBe('scrappy-demo');
    expect(result.owner.role).toBe('OWNER');
  });
});

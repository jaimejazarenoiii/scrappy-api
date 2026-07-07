import type { CompanyEntity } from '../../src/modules/company/domain/company.entity.js';
import { CompanyEntity as CompanyModel } from '../../src/modules/company/domain/company.entity.js';
import type {
  CompanyRepository,
  CreateCompanyInput,
  UpdateCompanyInput,
} from '../../src/modules/company/domain/company.repository.js';
import type { EmployeeEntity } from '../../src/modules/employee/domain/employee.entity.js';
import { EmployeeEntity as EmployeeModel } from '../../src/modules/employee/domain/employee.entity.js';
import type {
  CreateEmployeeInput,
  EmployeeRepository,
  UpdateEmployeeInput,
} from '../../src/modules/employee/domain/employee.repository.js';
import type { RefreshSessionEntity } from '../../src/modules/session/domain/refresh-session.entity.js';
import { RefreshSessionEntity as RefreshSessionModel } from '../../src/modules/session/domain/refresh-session.entity.js';
import type {
  CreateRefreshSessionInput,
  SessionRepository,
} from '../../src/modules/session/domain/session.repository.js';
import type { UserEntity } from '../../src/modules/user/domain/user.entity.js';
import { UserEntity as UserModel } from '../../src/modules/user/domain/user.entity.js';
import type {
  CreateUserInput,
  UserRepository,
} from '../../src/modules/user/domain/user.repository.js';
import type { PasswordHasher } from '../../src/shared/auth/password-hasher.interface.js';

export class FakePasswordHasher implements PasswordHasher {
  async hash(plainText: string): Promise<string> {
    return `hashed:${plainText}`;
  }
  async compare(plainText: string, hash: string): Promise<boolean> {
    return hash === `hashed:${plainText}`;
  }
}

export class InMemoryCompanyRepository implements CompanyRepository {
  public companies = new Map<string, CompanyEntity>();
  async create(input: CreateCompanyInput): Promise<CompanyEntity> {
    const now = new Date();
    const company = CompanyModel.create({
      id: input.id,
      name: input.name,
      logoUrl: input.logoUrl ?? null,
      contactNumber: input.contactNumber ?? null,
      email: input.email ?? null,
      address: input.address ?? null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.companies.set(company.id, company);
    return company;
  }
  async findById(companyId: string): Promise<CompanyEntity | null> {
    return this.companies.get(companyId) ?? null;
  }
  async findByName(name: string): Promise<CompanyEntity | null> {
    return [...this.companies.values()].find((company) => company.name === name) ?? null;
  }
  async update(companyId: string, input: UpdateCompanyInput): Promise<CompanyEntity> {
    const current = this.companies.get(companyId);
    if (!current) throw new Error('Company not found');
    const updated = CompanyModel.create({
      ...current.toPrimitives(),
      ...input,
      updatedAt: new Date(),
    });
    this.companies.set(companyId, updated);
    return updated;
  }
  async softDelete(companyId: string): Promise<CompanyEntity> {
    const current = this.companies.get(companyId);
    if (!current) throw new Error('Company not found');
    const updated = CompanyModel.create({
      ...current.toPrimitives(),
      status: 'INACTIVE',
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    this.companies.set(companyId, updated);
    return updated;
  }
}

export class InMemoryUserRepository implements UserRepository {
  public users = new Map<string, UserEntity>();
  async create(input: CreateUserInput): Promise<UserEntity> {
    const now = new Date();
    const user = UserModel.create({
      ...input,
      employeeId: null,
      lastLoginAt: null,
      status: 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.users.set(user.id, user);
    return user;
  }
  async findByEmail(email: string): Promise<UserEntity | null> {
    return [...this.users.values()].find((user) => user.email === email) ?? null;
  }
  async findById(userId: string, companyId: string): Promise<UserEntity | null> {
    return (
      [...this.users.values()].find((user) => user.id === userId && user.companyId === companyId) ??
      null
    );
  }
  async updateLastLogin(userId: string): Promise<void> {
    const user = this.users.get(userId);
    if (user)
      this.users.set(
        userId,
        UserModel.create({
          ...user.toPrimitives(),
          lastLoginAt: new Date(),
          updatedAt: new Date(),
        }),
      );
  }
  async linkEmployee(userId: string, employeeId: string): Promise<UserEntity> {
    const user = this.users.get(userId);
    if (!user) throw new Error('User not found');
    const updated = UserModel.create({ ...user.toPrimitives(), employeeId, updatedAt: new Date() });
    this.users.set(userId, updated);
    return updated;
  }
}

export class InMemoryEmployeeRepository implements EmployeeRepository {
  public employees = new Map<string, EmployeeEntity>();
  async create(input: CreateEmployeeInput): Promise<EmployeeEntity> {
    const now = new Date();
    const employee = EmployeeModel.create({
      id: input.id,
      companyId: input.companyId,
      userId: input.userId ?? null,
      employeeNumber: input.employeeNumber ?? null,
      firstName: input.firstName,
      middleName: input.middleName ?? null,
      lastName: input.lastName,
      suffix: input.suffix ?? null,
      contactNumber: input.contactNumber ?? null,
      weeklySalary: input.weeklySalary,
      status: input.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
    });
    this.employees.set(employee.id, employee);
    return employee;
  }
  async findById(employeeId: string, companyId: string): Promise<EmployeeEntity | null> {
    return (
      [...this.employees.values()].find(
        (employee) => employee.id === employeeId && employee.companyId === companyId,
      ) ?? null
    );
  }
  async update(
    employeeId: string,
    companyId: string,
    input: UpdateEmployeeInput,
  ): Promise<EmployeeEntity> {
    const current = await this.findById(employeeId, companyId);
    if (!current) throw new Error('Employee not found');
    const updated = EmployeeModel.create({
      ...current.toPrimitives(),
      ...input,
      updatedAt: new Date(),
    });
    this.employees.set(employeeId, updated);
    return updated;
  }
  async softDelete(employeeId: string, companyId: string): Promise<EmployeeEntity> {
    const current = await this.findById(employeeId, companyId);
    if (!current) throw new Error('Employee not found');
    const updated = EmployeeModel.create({
      ...current.toPrimitives(),
      status: 'INACTIVE',
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    this.employees.set(employeeId, updated);
    return updated;
  }
  async linkUser(employeeId: string, companyId: string, userId: string): Promise<EmployeeEntity> {
    const current = await this.findById(employeeId, companyId);
    if (!current) throw new Error('Employee not found');
    const updated = EmployeeModel.create({
      ...current.toPrimitives(),
      userId,
      updatedAt: new Date(),
    });
    this.employees.set(employeeId, updated);
    return updated;
  }
}

export class InMemorySessionRepository implements SessionRepository {
  public sessions = new Map<string, RefreshSessionEntity>();
  async create(input: CreateRefreshSessionInput): Promise<RefreshSessionEntity> {
    const now = new Date();
    const session = RefreshSessionModel.create({ ...input, revokedAt: null, createdAt: now });
    this.sessions.set(session.id, session);
    return session;
  }
  async findById(sessionId: string): Promise<RefreshSessionEntity | null> {
    return this.sessions.get(sessionId) ?? null;
  }
  async revoke(sessionId: string): Promise<void> {
    const session = this.sessions.get(sessionId);
    if (!session) return;
    this.sessions.set(
      sessionId,
      RefreshSessionModel.create({ ...session.toPrimitives(), revokedAt: new Date() }),
    );
  }
}

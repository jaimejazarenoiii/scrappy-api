import type { User } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { ResourceNotFoundError } from '../../../shared/errors/http-exceptions.js';
import { UserEntity as UserModel, type UserEntity } from '../domain/user.entity.js';
import type {
  UserRepository,
  CreateUserInput,
  UpdatePasswordOptions,
} from '../domain/user.repository.js';

function toDomain(record: User): UserEntity {
  return UserModel.create({
    id: record.id,
    companyId: record.companyId,
    employeeId: record.employeeId,
    email: record.email,
    passwordHash: record.passwordHash,
    role: record.role,
    passwordChangeRequired: record.passwordChangeRequired,
    passwordChangedAt: record.passwordChangedAt,
    lastLoginAt: record.lastLoginAt,
    status: record.status,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

export class UserPrismaRepository implements UserRepository {
  async create(input: CreateUserInput): Promise<UserEntity> {
    return toDomain(
      await prisma.user.create({
        data: {
          id: input.id,
          companyId: input.companyId,
          email: input.email,
          passwordHash: input.passwordHash,
          role: input.role,
          employeeId: input.employeeId ?? null,
          status: input.status ?? 'ACTIVE',
          passwordChangeRequired: input.passwordChangeRequired ?? false,
          passwordChangedAt: input.passwordChangedAt ?? null,
        },
      }),
    );
  }

  async findByEmail(email: string): Promise<UserEntity | null> {
    const record = await prisma.user.findFirst({ where: { email, deletedAt: null } });
    return record ? toDomain(record) : null;
  }

  async findById(userId: string, companyId: string): Promise<UserEntity | null> {
    const record = await prisma.user.findFirst({
      where: { id: userId, companyId, deletedAt: null },
    });
    return record ? toDomain(record) : null;
  }

  async updateLastLogin(userId: string): Promise<void> {
    await prisma.user.update({ where: { id: userId }, data: { lastLoginAt: new Date() } });
  }

  async linkEmployee(userId: string, employeeId: string): Promise<UserEntity> {
    return toDomain(await prisma.user.update({ where: { id: userId }, data: { employeeId } }));
  }

  async updateStatus(
    userId: string,
    companyId: string,
    status: 'ACTIVE' | 'INACTIVE',
  ): Promise<UserEntity> {
    const existing = await this.findById(userId, companyId);
    if (!existing) throw new ResourceNotFoundError('User not found');
    return toDomain(await prisma.user.update({ where: { id: userId }, data: { status } }));
  }

  async updatePassword(
    userId: string,
    companyId: string,
    passwordHash: string,
    options: UpdatePasswordOptions,
  ): Promise<UserEntity> {
    const existing = await this.findById(userId, companyId);
    if (!existing) throw new ResourceNotFoundError('User not found');
    return toDomain(
      await prisma.user.update({
        where: { id: userId },
        data: {
          passwordHash,
          passwordChangeRequired: options.passwordChangeRequired,
          passwordChangedAt: options.passwordChangedAt,
        },
      }),
    );
  }
}

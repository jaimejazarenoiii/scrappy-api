import type { Company } from '@prisma/client';
import { prisma } from '../../../database/prisma.client.js';
import { CompanyEntity as CompanyModel, type CompanyEntity } from '../domain/company.entity.js';
import type {
  CompanyRepository,
  CreateCompanyInput,
  ListCompaniesQuery,
  ListCompaniesResult,
  UpdateCompanyInput,
} from '../domain/company.repository.js';

function toDomain(record: Company): CompanyEntity {
  return CompanyModel.create({
    id: record.id,
    name: record.name,
    logoUrl: record.logoUrl,
    contactNumber: record.contactNumber,
    email: record.email,
    address: record.address,
    status: record.status,
    subscriptionStatus: record.subscriptionStatus,
    defaultStrictLoadValidation: record.defaultStrictLoadValidation,
    createdAt: record.createdAt,
    updatedAt: record.updatedAt,
    deletedAt: record.deletedAt,
  });
}

export class CompanyPrismaRepository implements CompanyRepository {
  async create(input: CreateCompanyInput): Promise<CompanyEntity> {
    return toDomain(await prisma.company.create({ data: input }));
  }

  async findById(companyId: string): Promise<CompanyEntity | null> {
    const record = await prisma.company.findFirst({ where: { id: companyId, deletedAt: null } });
    return record ? toDomain(record) : null;
  }

  async findByName(name: string): Promise<CompanyEntity | null> {
    const record = await prisma.company.findFirst({ where: { name } });
    return record ? toDomain(record) : null;
  }

  async list(query: ListCompaniesQuery): Promise<ListCompaniesResult> {
    const where = {
      deletedAt: null,
      ...(query.search ? { name: { contains: query.search, mode: 'insensitive' as const } } : {}),
    };
    const order = query.sortOrder === 'asc' ? 'asc' : 'desc';
    const [records, total] = await Promise.all([
      prisma.company.findMany({
        where,
        orderBy: { createdAt: order },
        skip: (query.page - 1) * query.limit,
        take: query.limit,
      }),
      prisma.company.count({ where }),
    ]);
    return { items: records.map(toDomain), total };
  }

  async update(companyId: string, input: UpdateCompanyInput): Promise<CompanyEntity> {
    return toDomain(await prisma.company.update({ where: { id: companyId }, data: input }));
  }

  async softDelete(companyId: string): Promise<CompanyEntity> {
    return toDomain(
      await prisma.company.update({
        where: { id: companyId },
        data: { deletedAt: new Date(), status: 'INACTIVE' },
      }),
    );
  }
}

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
import type { BranchEntity } from '../../src/modules/branch/domain/branch.entity.js';
import { BranchEntity as BranchModel } from '../../src/modules/branch/domain/branch.entity.js';
import type {
  BranchRepository,
  CreateBranchInput,
  ListBranchesQuery,
  UpdateBranchInput,
} from '../../src/modules/branch/domain/branch.repository.js';
import type { WarehouseEntity } from '../../src/modules/warehouse/domain/warehouse.entity.js';
import { WarehouseEntity as WarehouseModel } from '../../src/modules/warehouse/domain/warehouse.entity.js';
import type {
  CreateWarehouseInput,
  ListWarehousesQuery,
  UpdateWarehouseInput,
  WarehouseRepository,
} from '../../src/modules/warehouse/domain/warehouse.repository.js';
import type { VehicleEntity } from '../../src/modules/vehicle/domain/vehicle.entity.js';
import { VehicleEntity as VehicleModel } from '../../src/modules/vehicle/domain/vehicle.entity.js';
import type {
  CreateVehicleInput,
  ListVehiclesQuery,
  UpdateVehicleInput,
  VehicleRepository,
} from '../../src/modules/vehicle/domain/vehicle.repository.js';

function paginateAndSort<T>(
  items: T[],
  query: { page: number; limit: number; sortBy?: string; sortOrder?: 'asc' | 'desc' },
  getField: (item: T, field: string) => string | number | Date,
): { items: T[]; total: number } {
  const sorted = [...items].sort((left, right) => {
    const field = query.sortBy ?? 'createdAt';
    const leftValue = getField(left, field);
    const rightValue = getField(right, field);
    const order = query.sortOrder === 'desc' ? -1 : 1;
    if (leftValue < rightValue) return -1 * order;
    if (leftValue > rightValue) return 1 * order;
    return 0;
  });
  const start = (query.page - 1) * query.limit;
  return { items: sorted.slice(start, start + query.limit), total: items.length };
}

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

export class InMemoryBranchRepository implements BranchRepository {
  public branches = new Map<string, BranchEntity>();

  async create(input: CreateBranchInput): Promise<BranchEntity> {
    const now = new Date();
    const branch = BranchModel.create({
      id: input.id,
      companyId: input.companyId,
      name: input.name,
      address: input.address,
      contactNumber: input.contactNumber,
      status: input.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdByUserId: input.createdByUserId ?? null,
      updatedByUserId: null,
    });
    this.branches.set(branch.id, branch);
    return branch;
  }

  async findById(branchId: string, companyId: string): Promise<BranchEntity | null> {
    const branch = this.branches.get(branchId);
    if (!branch || branch.companyId !== companyId || branch.isDeleted()) return null;
    return branch;
  }

  async findByIdIncludingArchived(
    branchId: string,
    companyId: string,
  ): Promise<BranchEntity | null> {
    const branch = this.branches.get(branchId);
    if (!branch || branch.companyId !== companyId) return null;
    return branch;
  }

  async findByName(name: string, companyId: string): Promise<BranchEntity | null> {
    return (
      [...this.branches.values()].find(
        (branch) => branch.companyId === companyId && branch.name === name && !branch.isDeleted(),
      ) ?? null
    );
  }

  async update(
    branchId: string,
    companyId: string,
    input: UpdateBranchInput,
  ): Promise<BranchEntity> {
    const current = await this.findById(branchId, companyId);
    if (!current) throw new Error('Branch not found');
    const updated = BranchModel.create({
      ...current.toPrimitives(),
      ...input,
      updatedAt: new Date(),
    });
    this.branches.set(branchId, updated);
    return updated;
  }

  async softDelete(branchId: string, companyId: string): Promise<BranchEntity> {
    const current = await this.findById(branchId, companyId);
    if (!current) throw new Error('Branch not found');
    const updated = BranchModel.create({
      ...current.toPrimitives(),
      status: 'INACTIVE',
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    this.branches.set(branchId, updated);
    return updated;
  }

  async list(companyId: string, query: ListBranchesQuery) {
    let items = [...this.branches.values()].filter(
      (branch) => branch.companyId === companyId && !branch.isDeleted(),
    );
    if (query.status) items = items.filter((branch) => branch.status === query.status);
    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (branch) =>
          branch.name.toLowerCase().includes(search) ||
          branch.toPrimitives().address.toLowerCase().includes(search) ||
          branch.toPrimitives().contactNumber.toLowerCase().includes(search),
      );
    }
    return paginateAndSort(items, query, (branch, field) => {
      const value = branch.toPrimitives()[field as keyof ReturnType<typeof branch.toPrimitives>];
      return value instanceof Date ? value.getTime() : String(value);
    });
  }
}

export class InMemoryWarehouseRepository implements WarehouseRepository {
  public warehouses = new Map<string, WarehouseEntity>();

  async create(input: CreateWarehouseInput): Promise<WarehouseEntity> {
    const now = new Date();
    const warehouse = WarehouseModel.create({
      id: input.id,
      companyId: input.companyId,
      name: input.name,
      address: input.address,
      contactNumber: input.contactNumber,
      status: input.status ?? 'ACTIVE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdByUserId: input.createdByUserId ?? null,
      updatedByUserId: null,
    });
    this.warehouses.set(warehouse.id, warehouse);
    return warehouse;
  }

  async findById(warehouseId: string, companyId: string): Promise<WarehouseEntity | null> {
    const warehouse = this.warehouses.get(warehouseId);
    if (!warehouse || warehouse.companyId !== companyId || warehouse.isDeleted()) return null;
    return warehouse;
  }

  async findByName(name: string, companyId: string): Promise<WarehouseEntity | null> {
    return (
      [...this.warehouses.values()].find(
        (warehouse) =>
          warehouse.companyId === companyId && warehouse.name === name && !warehouse.isDeleted(),
      ) ?? null
    );
  }

  async update(
    warehouseId: string,
    companyId: string,
    input: UpdateWarehouseInput,
  ): Promise<WarehouseEntity> {
    const current = await this.findById(warehouseId, companyId);
    if (!current) throw new Error('Warehouse not found');
    const updated = WarehouseModel.create({
      ...current.toPrimitives(),
      ...input,
      updatedAt: new Date(),
    });
    this.warehouses.set(warehouseId, updated);
    return updated;
  }

  async softDelete(warehouseId: string, companyId: string): Promise<WarehouseEntity> {
    const current = await this.findById(warehouseId, companyId);
    if (!current) throw new Error('Warehouse not found');
    const updated = WarehouseModel.create({
      ...current.toPrimitives(),
      status: 'INACTIVE',
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    this.warehouses.set(warehouseId, updated);
    return updated;
  }

  async list(companyId: string, query: ListWarehousesQuery) {
    let items = [...this.warehouses.values()].filter(
      (warehouse) => warehouse.companyId === companyId && !warehouse.isDeleted(),
    );
    if (query.status) items = items.filter((warehouse) => warehouse.status === query.status);
    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (warehouse) =>
          warehouse.name.toLowerCase().includes(search) ||
          warehouse.toPrimitives().address.toLowerCase().includes(search) ||
          warehouse.toPrimitives().contactNumber.toLowerCase().includes(search),
      );
    }
    return paginateAndSort(items, query, (warehouse, field) => {
      const value =
        warehouse.toPrimitives()[field as keyof ReturnType<typeof warehouse.toPrimitives>];
      return value instanceof Date ? value.getTime() : String(value);
    });
  }
}

export class InMemoryVehicleRepository implements VehicleRepository {
  public vehicles = new Map<string, VehicleEntity>();

  async create(input: CreateVehicleInput): Promise<VehicleEntity> {
    const now = new Date();
    const vehicle = VehicleModel.create({
      id: input.id,
      companyId: input.companyId,
      plateNumber: input.plateNumber,
      description: input.description,
      status: input.status ?? 'AVAILABLE',
      createdAt: now,
      updatedAt: now,
      deletedAt: null,
      createdByUserId: input.createdByUserId ?? null,
      updatedByUserId: null,
    });
    this.vehicles.set(vehicle.id, vehicle);
    return vehicle;
  }

  async findById(vehicleId: string, companyId: string): Promise<VehicleEntity | null> {
    const vehicle = this.vehicles.get(vehicleId);
    if (!vehicle || vehicle.companyId !== companyId || vehicle.isDeleted()) return null;
    return vehicle;
  }

  async findByPlateNumber(plateNumber: string, companyId: string): Promise<VehicleEntity | null> {
    return (
      [...this.vehicles.values()].find(
        (vehicle) =>
          vehicle.companyId === companyId &&
          vehicle.toPrimitives().plateNumber === plateNumber &&
          !vehicle.isDeleted(),
      ) ?? null
    );
  }

  async update(
    vehicleId: string,
    companyId: string,
    input: UpdateVehicleInput,
  ): Promise<VehicleEntity> {
    const current = await this.findById(vehicleId, companyId);
    if (!current) throw new Error('Vehicle not found');
    const updated = VehicleModel.create({
      ...current.toPrimitives(),
      ...input,
      updatedAt: new Date(),
    });
    this.vehicles.set(vehicleId, updated);
    return updated;
  }

  async softDelete(vehicleId: string, companyId: string): Promise<VehicleEntity> {
    const current = await this.findById(vehicleId, companyId);
    if (!current) throw new Error('Vehicle not found');
    const updated = VehicleModel.create({
      ...current.toPrimitives(),
      status: 'INACTIVE',
      deletedAt: new Date(),
      updatedAt: new Date(),
    });
    this.vehicles.set(vehicleId, updated);
    return updated;
  }

  async list(companyId: string, query: ListVehiclesQuery) {
    let items = [...this.vehicles.values()].filter(
      (vehicle) => vehicle.companyId === companyId && !vehicle.isDeleted(),
    );
    if (query.status) items = items.filter((vehicle) => vehicle.status === query.status);
    if (query.search) {
      const search = query.search.toLowerCase();
      items = items.filter(
        (vehicle) =>
          vehicle.toPrimitives().plateNumber.toLowerCase().includes(search) ||
          vehicle.toPrimitives().description.toLowerCase().includes(search),
      );
    }
    return paginateAndSort(items, query, (vehicle, field) => {
      const value = vehicle.toPrimitives()[field as keyof ReturnType<typeof vehicle.toPrimitives>];
      return value instanceof Date ? value.getTime() : String(value);
    });
  }
}

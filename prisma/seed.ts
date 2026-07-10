import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { DEFAULT_EXPENSE_CATEGORIES } from '../src/modules/expense/domain/expense-categories.js';

const prisma = new PrismaClient();

const DEFAULT_PASSWORD = 'password123';
const BCRYPT_ROUNDS = Number(process.env.BCRYPT_ROUNDS ?? 10);

const now = new Date();
function daysAgo(days: number): Date {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000);
}
function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

/**
 * Deletes all rows in dependency-safe order so the seed can be re-run repeatably.
 */
async function resetDatabase(): Promise<void> {
  await prisma.transactionAttachment.deleteMany();
  await prisma.transactionItem.deleteMany();
  await prisma.transactionEmployeeAssignment.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.expenseAttachment.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.expenseCategory.deleteMany();
  await prisma.expenseNumberSequence.deleteMany();
  await prisma.tripMember.deleteMany();
  await prisma.trip.deleteMany();
  await prisma.tripNumberSequence.deleteMany();
  await prisma.transactionNumberSequence.deleteMany();
  await prisma.payrollRecord.deleteMany();
  await prisma.cashAdvance.deleteMany();
  await prisma.leaveRecord.deleteMany();
  await prisma.attendanceSession.deleteMany();
  await prisma.refreshSession.deleteMany();
  await prisma.user.deleteMany();
  await prisma.employee.deleteMany();
  await prisma.vehicle.deleteMany();
  await prisma.warehouse.deleteMany();
  await prisma.branch.deleteMany();
  await prisma.company.deleteMany();
}

async function main(): Promise<void> {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to run the seed script with NODE_ENV=production.');
  }

  console.log('Resetting existing data...');
  await resetDatabase();

  const passwordHash = await bcrypt.hash(DEFAULT_PASSWORD, BCRYPT_ROUNDS);

  console.log('Creating company...');
  const company = await prisma.company.create({
    data: {
      name: 'Scrappy Demo Junkshop',
      contactNumber: '09171234567',
      email: 'contact@scrappy-demo.test',
      address: 'Quezon City, Metro Manila, Philippines',
      status: 'ACTIVE',
    },
  });

  console.log('Creating expense categories...');
  await prisma.expenseCategory.createMany({
    data: DEFAULT_EXPENSE_CATEGORIES.map((name, index) => ({
      id: randomUUID(),
      companyId: company.id,
      name,
      sortOrder: index,
    })),
  });

  console.log('Creating owner account...');
  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'owner@example.com',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  console.log('Creating manager with linked employee profile (required for time-in)...');
  const managerEmployee = await prisma.employee.create({
    data: {
      companyId: company.id,
      employeeNumber: 'EMP-MGR',
      firstName: 'Maya',
      lastName: 'Manager',
      contactNumber: '09170000000',
      weeklySalary: 5000,
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      employeeId: managerEmployee.id,
      email: 'manager@example.com',
      passwordHash,
      role: 'MANAGER',
      status: 'ACTIVE',
    },
  });

  await prisma.employee.update({
    where: { id: managerEmployee.id },
    data: { userId: manager.id },
  });

  console.log('Creating employees (employee1..employee3) with linked user accounts...');
  const employeeSeed = [
    { firstName: 'Ana', lastName: 'Santos', weeklySalary: 3500, number: 'EMP-001' },
    { firstName: 'Ben', lastName: 'Reyes', weeklySalary: 3800, number: 'EMP-002' },
    { firstName: 'Carlo', lastName: 'Dela Cruz', weeklySalary: 4200, number: 'EMP-003' },
  ];

  const employees: { employeeId: string; userId: string; email: string }[] = [];
  for (let index = 0; index < employeeSeed.length; index += 1) {
    const seed = employeeSeed[index]!;
    const email = `employee${index + 1}@example.com`;

    const employee = await prisma.employee.create({
      data: {
        companyId: company.id,
        employeeNumber: seed.number,
        firstName: seed.firstName,
        lastName: seed.lastName,
        contactNumber: `0917000000${index + 1}`,
        weeklySalary: seed.weeklySalary,
        status: 'ACTIVE',
      },
    });

    const user = await prisma.user.create({
      data: {
        companyId: company.id,
        employeeId: employee.id,
        email,
        passwordHash,
        role: 'EMPLOYEE',
        status: 'ACTIVE',
      },
    });

    await prisma.employee.update({
      where: { id: employee.id },
      data: { userId: user.id },
    });

    employees.push({ employeeId: employee.id, userId: user.id, email });
  }

  console.log('Creating branches and warehouses...');
  const [mainBranch] = await Promise.all([
    prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'Main Branch',
        address: '123 Commonwealth Ave, Quezon City',
        contactNumber: '0288881111',
        createdByUserId: owner.id,
      },
    }),
    prisma.branch.create({
      data: {
        companyId: company.id,
        name: 'North Branch',
        address: '45 Mindanao Ave, Quezon City',
        contactNumber: '0288882222',
        createdByUserId: owner.id,
      },
    }),
  ]);

  const [centralWarehouse] = await Promise.all([
    prisma.warehouse.create({
      data: {
        companyId: company.id,
        name: 'Central Warehouse',
        address: '9 Balintawak, Quezon City',
        contactNumber: '0288883333',
        createdByUserId: owner.id,
      },
    }),
    prisma.warehouse.create({
      data: {
        companyId: company.id,
        name: 'East Warehouse',
        address: '77 Marikina Heights, Marikina',
        contactNumber: '0288884444',
        createdByUserId: owner.id,
      },
    }),
  ]);

  console.log('Creating vehicles...');
  await prisma.vehicle.createMany({
    data: [
      {
        companyId: company.id,
        plateNumber: 'ABC-1234',
        description: 'Isuzu Elf dump truck',
        status: 'AVAILABLE',
        createdByUserId: owner.id,
      },
      {
        companyId: company.id,
        plateNumber: 'XYZ-5678',
        description: 'Mitsubishi Canter flatbed',
        status: 'IN_USE',
        createdByUserId: owner.id,
      },
      {
        companyId: company.id,
        plateNumber: 'JNK-9090',
        description: 'Toyota HiAce utility van',
        status: 'MAINTENANCE',
        createdByUserId: owner.id,
      },
    ],
  });

  const vehicles = await prisma.vehicle.findMany({
    where: { companyId: company.id },
    orderBy: { plateNumber: 'asc' },
  });

  console.log('Creating attendance sessions...');
  // employee1 is currently timed in so they can immediately create transactions.
  await prisma.attendanceSession.create({
    data: {
      companyId: company.id,
      employeeId: employees[0]!.employeeId,
      status: 'OPEN',
      timeInAt: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      note: 'Morning shift',
      createdByUserId: employees[0]!.userId,
    },
  });
  await prisma.attendanceSession.create({
    data: {
      companyId: company.id,
      employeeId: employees[1]!.employeeId,
      status: 'CLOSED',
      timeInAt: daysAgo(1),
      timeOutAt: new Date(daysAgo(1).getTime() + 8 * 60 * 60 * 1000),
      note: 'Completed shift',
      createdByUserId: employees[1]!.userId,
    },
  });

  console.log('Creating leave, cash advance, and payroll records...');
  await prisma.leaveRecord.create({
    data: {
      companyId: company.id,
      employeeId: employees[1]!.employeeId,
      leaveType: 'FULL_DAY',
      leaveDate: daysAgo(3),
      status: 'APPROVED',
      reason: 'Family matter',
      managerNote: 'Approved by manager',
      createdByUserId: employees[1]!.userId,
      updatedByUserId: manager.id,
    },
  });

  await prisma.cashAdvance.create({
    data: {
      companyId: company.id,
      employeeId: employees[2]!.employeeId,
      amount: 1000,
      deductedAmount: 0,
      remainingAmount: 1000,
      status: 'OUTSTANDING',
      reason: 'Emergency advance',
      issuedAt: daysAgo(2),
      createdByUserId: manager.id,
    },
  });

  const payPeriodStart = daysAgo(7);
  const payPeriodEnd = daysAgo(1);
  await prisma.payrollRecord.create({
    data: {
      companyId: company.id,
      employeeId: employees[0]!.employeeId,
      payPeriodStart,
      payPeriodEnd,
      grossSalary: 3500,
      cashAdvanceDeductions: 0,
      netPay: 3500,
      status: 'PAYABLE',
      createdByUserId: manager.id,
    },
  });

  console.log('Creating sample trips...');
  const draftTrip = await prisma.trip.create({
    data: {
      companyId: company.id,
      tripNumber: 'TRIP-20260709-000001',
      vehicleId: vehicles[0]!.id,
      status: 'DRAFT',
      scheduledStart: new Date(now.getTime() + 24 * 60 * 60 * 1000),
      origin: 'Main Branch',
      destination: 'Barangay San Roque',
      notes: 'Community pickup route',
      createdByUserId: manager.id,
      updatedByUserId: manager.id,
      members: {
        create: [
          { employeeId: employees[0]!.employeeId, role: 'DRIVER' },
          { employeeId: employees[1]!.employeeId, role: 'HELPER' },
        ],
      },
    },
  });

  const startedTrip = await prisma.trip.create({
    data: {
      companyId: company.id,
      tripNumber: 'TRIP-20260709-000002',
      vehicleId: vehicles[1]!.id,
      status: 'STARTED',
      scheduledStart: new Date(now.getTime() - 3 * 60 * 60 * 1000),
      actualStart: new Date(now.getTime() - 2 * 60 * 60 * 1000),
      origin: 'Central Warehouse',
      destination: 'Metro Recyclers Yard',
      notes: 'Outbound haul in progress',
      createdByUserId: manager.id,
      updatedByUserId: manager.id,
      startedByUserId: manager.id,
      members: {
        create: [
          { employeeId: employees[0]!.employeeId, role: 'DRIVER' },
          { employeeId: employees[2]!.employeeId, role: 'BUYER' },
        ],
      },
    },
  });

  console.log('Creating sample expenses...');
  await prisma.expense.create({
    data: {
      companyId: company.id,
      expenseNumber: 'EXP-20260709-000001',
      expenseDate: now,
      category: 'Fuel',
      amount: 2500,
      description: 'Diesel for started trip haul',
      status: 'DRAFT',
      contextType: 'TRIP',
      tripId: startedTrip.id,
      createdByUserId: employees[0]!.userId,
      createdByEmployeeId: employees[0]!.employeeId,
      updatedByUserId: employees[0]!.userId,
    },
  });

  await prisma.expense.create({
    data: {
      companyId: company.id,
      expenseNumber: 'EXP-20260709-000002',
      expenseDate: daysAgo(1),
      category: 'Maintenance',
      amount: 1800,
      description: 'Branch equipment repair',
      status: 'RECORDED',
      contextType: 'BRANCH',
      branchId: mainBranch.id,
      createdByUserId: manager.id,
      createdByEmployeeId: employees[1]!.employeeId,
      updatedByUserId: manager.id,
      recordedByUserId: manager.id,
      recordedAt: daysAgo(1),
    },
  });

  await prisma.expense.create({
    data: {
      companyId: company.id,
      expenseNumber: 'EXP-20260709-000003',
      expenseDate: now,
      category: 'Supplies',
      amount: 950,
      description: 'Warehouse cleaning supplies',
      status: 'RECORDED',
      contextType: 'WAREHOUSE',
      warehouseId: centralWarehouse.id,
      createdByUserId: manager.id,
      updatedByUserId: manager.id,
      recordedByUserId: manager.id,
      recordedAt: now,
    },
  });

  console.log('Creating sample draft transactions...');
  // Inbound (BUY) transaction at the main branch, assigned to employee1.
  const inboundItems = [
    { materialName: 'Copper Wire', weight: 12.5, unit: 'KG' as const, price: 320 },
    { materialName: 'Aluminum Cans', weight: 40, unit: 'KG' as const, price: 55 },
  ];
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      createdByUserId: employees[0]!.userId,
      transactionNumber: 'IN-20260709-000001',
      direction: 'INBOUND',
      status: 'DRAFT',
      partyName: 'Juan Dela Cruz',
      partyContactNumber: '09181234567',
      transactionDate: now,
      locationType: 'BRANCH',
      branchId: mainBranch.id,
      notes: 'Walk-in seller',
      items: {
        create: inboundItems.map((item) => ({
          materialName: item.materialName,
          weight: item.weight,
          unit: item.unit,
          price: item.price,
          total: round2(item.weight * item.price),
        })),
      },
      assignments: {
        create: [{ employeeId: employees[0]!.employeeId }],
      },
    },
  });

  // A draft transaction linked to a trip using the TRIP location type.
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      createdByUserId: employees[0]!.userId,
      transactionNumber: 'IN-20260709-000002',
      direction: 'INBOUND',
      status: 'DRAFT',
      partyName: 'Barangay Cleanup Drive',
      partyContactNumber: '09175550000',
      transactionDate: now,
      locationType: 'TRIP',
      tripId: draftTrip.id,
      notes: 'Materials collected during scheduled route',
      items: {
        create: [
          {
            materialName: 'Mixed Plastic',
            weight: 65,
            unit: 'KG',
            price: 14,
            total: round2(65 * 14),
          },
        ],
      },
      assignments: {
        create: [
          { employeeId: employees[0]!.employeeId },
          { employeeId: employees[1]!.employeeId },
        ],
      },
    },
  });

  // Outbound (SELL) transaction to an outside buyer, assigned to employee1 and employee2.
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      createdByUserId: employees[0]!.userId,
      transactionNumber: 'OUT-20260709-000001',
      direction: 'OUTBOUND',
      status: 'DRAFT',
      partyName: 'Metro Recyclers Inc.',
      partyContactNumber: '09991234567',
      transactionDate: now,
      locationType: 'OUTSIDE',
      outsideLocationName: 'Metro Recyclers Yard',
      outsideAddress: 'Km 14 East Service Rd, Taguig',
      notes: 'Bulk sale delivery',
      items: {
        create: [
          {
            materialName: 'Mixed Scrap Steel',
            weight: 500,
            unit: 'KG',
            price: 18,
            total: round2(500 * 18),
          },
        ],
      },
      assignments: {
        create: [
          { employeeId: employees[0]!.employeeId },
          { employeeId: employees[1]!.employeeId },
        ],
      },
    },
  });

  // A draft transaction at the central warehouse to exercise warehouse locations.
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      createdByUserId: employees[0]!.userId,
      transactionNumber: 'IN-20260709-000003',
      direction: 'INBOUND',
      status: 'DRAFT',
      partyName: 'Barangay Cleanup Drive',
      transactionDate: now,
      locationType: 'WAREHOUSE',
      warehouseId: centralWarehouse.id,
      items: {
        create: [
          {
            materialName: 'PET Bottles',
            weight: 80,
            unit: 'KG',
            price: 12,
            total: round2(80 * 12),
          },
        ],
      },
      assignments: {
        create: [{ employeeId: employees[2]!.employeeId }],
      },
    },
  });

  console.log('\nSeed complete. Sample accounts (password for all: "password123"):');
  console.log(`  Company:  ${company.name}`);
  console.log('  Owner:    owner@example.com');
  console.log('  Manager:  manager@example.com');
  for (const employee of employees) {
    console.log(`  Employee: ${employee.email}`);
  }
  console.log(`  Draft trip:   ${draftTrip.tripNumber}`);
  console.log(`  Started trip: ${startedTrip.tripNumber}`);
  console.log('  Sample expenses: EXP-20260709-000001 (DRAFT), EXP-20260709-000002 (RECORDED)');
  console.log(`  Expense categories: ${DEFAULT_EXPENSE_CATEGORIES.join(', ')}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error('Seed failed:', error);
    await prisma.$disconnect();
    process.exit(1);
  });

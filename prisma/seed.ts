import 'dotenv/config';
import { randomUUID } from 'node:crypto';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

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

  console.log('Creating owner and manager accounts...');
  const owner = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'owner@example.com',
      passwordHash,
      role: 'OWNER',
      status: 'ACTIVE',
    },
  });

  const manager = await prisma.user.create({
    data: {
      companyId: company.id,
      email: 'manager@example.com',
      passwordHash,
      role: 'MANAGER',
      status: 'ACTIVE',
    },
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

  // Outbound (SELL) transaction to an outside buyer, assigned to employee1 and employee2.
  await prisma.transaction.create({
    data: {
      companyId: company.id,
      createdByUserId: employees[0]!.userId,
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

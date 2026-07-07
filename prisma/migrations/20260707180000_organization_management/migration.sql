-- CreateEnum
CREATE TYPE "BranchStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "WarehouseStatus" AS ENUM ('ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "VehicleStatus" AS ENUM ('AVAILABLE', 'IN_USE', 'MAINTENANCE', 'INACTIVE');

-- CreateTable
CREATE TABLE "Branch" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "status" "BranchStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Branch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT NOT NULL,
    "contactNumber" TEXT NOT NULL,
    "status" "WarehouseStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Vehicle" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "plateNumber" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "status" "VehicleStatus" NOT NULL DEFAULT 'AVAILABLE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),
    "createdByUserId" TEXT,
    "updatedByUserId" TEXT,

    CONSTRAINT "Vehicle_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Branch_companyId_status_idx" ON "Branch"("companyId", "status");

-- CreateIndex
CREATE INDEX "Branch_companyId_deletedAt_idx" ON "Branch"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Branch_companyId_name_active_key" ON "Branch"("companyId", "name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "Warehouse_companyId_status_idx" ON "Warehouse"("companyId", "status");

-- CreateIndex
CREATE INDEX "Warehouse_companyId_deletedAt_idx" ON "Warehouse"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_companyId_name_active_key" ON "Warehouse"("companyId", "name") WHERE "deletedAt" IS NULL;

-- CreateIndex
CREATE INDEX "Vehicle_companyId_status_idx" ON "Vehicle"("companyId", "status");

-- CreateIndex
CREATE INDEX "Vehicle_companyId_deletedAt_idx" ON "Vehicle"("companyId", "deletedAt");

-- CreateIndex
CREATE UNIQUE INDEX "Vehicle_companyId_plateNumber_active_key" ON "Vehicle"("companyId", "plateNumber") WHERE "deletedAt" IS NULL;

-- AddForeignKey
ALTER TABLE "Branch" ADD CONSTRAINT "Branch_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Vehicle" ADD CONSTRAINT "Vehicle_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

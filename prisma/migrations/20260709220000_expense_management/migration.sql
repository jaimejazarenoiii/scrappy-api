-- CreateEnum
CREATE TYPE "ExpenseStatus" AS ENUM ('DRAFT', 'RECORDED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ExpenseContextType" AS ENUM ('COMPANY', 'BRANCH', 'WAREHOUSE', 'VEHICLE', 'TRIP');

-- CreateEnum
CREATE TYPE "ExpenseAttachmentType" AS ENUM ('PHOTO');

-- CreateTable
CREATE TABLE "Expense" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "expenseNumber" TEXT NOT NULL,
    "expenseDate" TIMESTAMP(3) NOT NULL,
    "category" TEXT NOT NULL,
    "amount" DECIMAL(18,2) NOT NULL,
    "description" TEXT NOT NULL,
    "status" "ExpenseStatus" NOT NULL DEFAULT 'DRAFT',
    "contextType" "ExpenseContextType" NOT NULL,
    "branchId" TEXT,
    "warehouseId" TEXT,
    "vehicleId" TEXT,
    "tripId" TEXT,
    "createdByUserId" TEXT NOT NULL,
    "createdByEmployeeId" TEXT,
    "updatedByUserId" TEXT,
    "recordedByUserId" TEXT,
    "recordedAt" TIMESTAMP(3),
    "cancelledByUserId" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "cancellationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Expense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseAttachment" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "attachmentType" "ExpenseAttachmentType" NOT NULL DEFAULT 'PHOTO',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ExpenseAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExpenseNumberSequence" (
    "companyId" TEXT NOT NULL,
    "sequenceDate" DATE NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ExpenseNumberSequence_pkey" PRIMARY KEY ("companyId","sequenceDate")
);

-- CreateIndex
CREATE UNIQUE INDEX "Expense_companyId_expenseNumber_key" ON "Expense"("companyId", "expenseNumber");

-- CreateIndex
CREATE INDEX "Expense_companyId_status_deletedAt_idx" ON "Expense"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Expense_companyId_expenseDate_idx" ON "Expense"("companyId", "expenseDate");

-- CreateIndex
CREATE INDEX "Expense_companyId_category_idx" ON "Expense"("companyId", "category");

-- CreateIndex
CREATE INDEX "Expense_companyId_contextType_idx" ON "Expense"("companyId", "contextType");

-- CreateIndex
CREATE INDEX "Expense_companyId_branchId_idx" ON "Expense"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Expense_companyId_warehouseId_idx" ON "Expense"("companyId", "warehouseId");

-- CreateIndex
CREATE INDEX "Expense_companyId_vehicleId_idx" ON "Expense"("companyId", "vehicleId");

-- CreateIndex
CREATE INDEX "Expense_companyId_tripId_idx" ON "Expense"("companyId", "tripId");

-- CreateIndex
CREATE INDEX "Expense_companyId_createdByEmployeeId_idx" ON "Expense"("companyId", "createdByEmployeeId");

-- CreateIndex
CREATE INDEX "Expense_companyId_deletedAt_expenseDate_idx" ON "Expense"("companyId", "deletedAt", "expenseDate");

-- CreateIndex
CREATE INDEX "ExpenseAttachment_expenseId_idx" ON "ExpenseAttachment"("expenseId");

-- CreateIndex
CREATE INDEX "ExpenseAttachment_expenseId_attachmentType_idx" ON "ExpenseAttachment"("expenseId", "attachmentType");

-- CreateIndex
CREATE INDEX "ExpenseNumberSequence_companyId_sequenceDate_idx" ON "ExpenseNumberSequence"("companyId", "sequenceDate");

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "Vehicle"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_tripId_fkey" FOREIGN KEY ("tripId") REFERENCES "Trip"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Expense" ADD CONSTRAINT "Expense_createdByEmployeeId_fkey" FOREIGN KEY ("createdByEmployeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExpenseAttachment" ADD CONSTRAINT "ExpenseAttachment_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "Expense"("id") ON DELETE CASCADE ON UPDATE CASCADE;

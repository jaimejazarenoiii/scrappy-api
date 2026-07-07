-- CreateEnum
CREATE TYPE "TransactionDirection" AS ENUM ('INBOUND', 'OUTBOUND');

-- CreateEnum
CREATE TYPE "TransactionStatus" AS ENUM ('DRAFT', 'CANCELLED');

-- CreateEnum
CREATE TYPE "TransactionLocationType" AS ENUM ('BRANCH', 'WAREHOUSE', 'OUTSIDE');

-- CreateEnum
CREATE TYPE "TransactionAttachmentType" AS ENUM ('PHOTO');

-- CreateEnum
CREATE TYPE "TransactionItemUnit" AS ENUM ('KG', 'G', 'TON', 'LB', 'PIECE', 'BUNDLE', 'SACK');

-- CreateTable
CREATE TABLE "Transaction" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "createdByUserId" TEXT NOT NULL,
    "updatedByUserId" TEXT,
    "direction" "TransactionDirection" NOT NULL,
    "status" "TransactionStatus" NOT NULL DEFAULT 'DRAFT',
    "partyName" TEXT NOT NULL,
    "partyContactNumber" TEXT,
    "transactionDate" TIMESTAMP(3) NOT NULL,
    "locationType" "TransactionLocationType" NOT NULL,
    "branchId" TEXT,
    "warehouseId" TEXT,
    "outsideLocationName" TEXT,
    "outsideAddress" TEXT,
    "tripId" TEXT,
    "notes" TEXT,
    "cancellationReason" TEXT,
    "cancelledAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Transaction_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionItem" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "materialName" TEXT NOT NULL,
    "weight" DECIMAL(12,3) NOT NULL,
    "unit" "TransactionItemUnit" NOT NULL,
    "price" DECIMAL(12,2) NOT NULL,
    "total" DECIMAL(14,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TransactionItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionAttachment" (
    "id" TEXT NOT NULL,
    "transactionId" TEXT NOT NULL,
    "attachmentType" "TransactionAttachmentType" NOT NULL DEFAULT 'PHOTO',
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "uploadedByUserId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionAttachment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TransactionEmployeeAssignment" (
    "transactionId" TEXT NOT NULL,
    "employeeId" TEXT NOT NULL,
    "assignedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TransactionEmployeeAssignment_pkey" PRIMARY KEY ("transactionId", "employeeId")
);

-- CreateIndex
CREATE INDEX "Transaction_companyId_status_deletedAt_idx" ON "Transaction"("companyId", "status", "deletedAt");

-- CreateIndex
CREATE INDEX "Transaction_companyId_transactionDate_idx" ON "Transaction"("companyId", "transactionDate");

-- CreateIndex
CREATE INDEX "Transaction_companyId_direction_status_idx" ON "Transaction"("companyId", "direction", "status");

-- CreateIndex
CREATE INDEX "Transaction_companyId_locationType_idx" ON "Transaction"("companyId", "locationType");

-- CreateIndex
CREATE INDEX "Transaction_companyId_branchId_idx" ON "Transaction"("companyId", "branchId");

-- CreateIndex
CREATE INDEX "Transaction_companyId_warehouseId_idx" ON "Transaction"("companyId", "warehouseId");

-- CreateIndex
CREATE INDEX "Transaction_companyId_createdByUserId_idx" ON "Transaction"("companyId", "createdByUserId");

-- CreateIndex
CREATE INDEX "Transaction_companyId_deletedAt_transactionDate_idx" ON "Transaction"("companyId", "deletedAt", "transactionDate");

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_idx" ON "TransactionItem"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionItem_transactionId_materialName_idx" ON "TransactionItem"("transactionId", "materialName");

-- CreateIndex
CREATE INDEX "TransactionAttachment_transactionId_idx" ON "TransactionAttachment"("transactionId");

-- CreateIndex
CREATE INDEX "TransactionAttachment_transactionId_attachmentType_idx" ON "TransactionAttachment"("transactionId", "attachmentType");

-- CreateIndex
CREATE INDEX "TransactionEmployeeAssignment_employeeId_transactionId_idx" ON "TransactionEmployeeAssignment"("employeeId", "transactionId");

-- CreateIndex
CREATE INDEX "TransactionEmployeeAssignment_employeeId_idx" ON "TransactionEmployeeAssignment"("employeeId");

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "Branch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionItem" ADD CONSTRAINT "TransactionItem_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionAttachment" ADD CONSTRAINT "TransactionAttachment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionEmployeeAssignment" ADD CONSTRAINT "TransactionEmployeeAssignment_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "Transaction"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TransactionEmployeeAssignment" ADD CONSTRAINT "TransactionEmployeeAssignment_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "CashAdvance" ADD COLUMN "issuedAt" TIMESTAMP(3);

-- Backfill existing rows from createdAt
UPDATE "CashAdvance" SET "issuedAt" = "createdAt" WHERE "issuedAt" IS NULL;

-- Enforce NOT NULL after backfill
ALTER TABLE "CashAdvance" ALTER COLUMN "issuedAt" SET NOT NULL;

-- CreateIndex
CREATE INDEX "CashAdvance_companyId_issuedAt_idx" ON "CashAdvance"("companyId", "issuedAt");

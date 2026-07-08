-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'READY_FOR_PAYMENT';

-- AlterEnum
ALTER TYPE "TransactionStatus" ADD VALUE 'PAID';

-- AlterTable
ALTER TABLE "Transaction"
ADD COLUMN "transactionNumber" TEXT,
ADD COLUMN "submittedAt" TIMESTAMP(3),
ADD COLUMN "submittedByUserId" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "paidByUserId" TEXT,
ADD COLUMN "cancelledByUserId" TEXT,
ADD COLUMN "reopenedAt" TIMESTAMP(3),
ADD COLUMN "reopenedByUserId" TEXT,
ADD COLUMN "reopenReason" TEXT;

-- CreateTable
CREATE TABLE "TransactionNumberSequence" (
    "companyId" TEXT NOT NULL,
    "direction" "TransactionDirection" NOT NULL,
    "sequenceDate" DATE NOT NULL,
    "lastSequence" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "TransactionNumberSequence_pkey" PRIMARY KEY ("companyId","direction","sequenceDate")
);

-- Backfill transaction numbers for existing records.
WITH ordered AS (
  SELECT
    id,
    "companyId",
    direction,
    TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYYMMDD') AS date_part,
    ROW_NUMBER() OVER (
      PARTITION BY "companyId", direction, TO_CHAR("createdAt" AT TIME ZONE 'UTC', 'YYYYMMDD')
      ORDER BY "createdAt", id
    ) AS seq
  FROM "Transaction"
),
numbered AS (
  SELECT
    id,
    CASE
      WHEN direction = 'INBOUND' THEN 'IN-'
      ELSE 'OUT-'
    END || date_part || '-' || LPAD(seq::text, 6, '0') AS transaction_number
  FROM ordered
)
UPDATE "Transaction" t
SET "transactionNumber" = n.transaction_number
FROM numbered n
WHERE t.id = n.id;

INSERT INTO "TransactionNumberSequence" ("companyId", "direction", "sequenceDate", "lastSequence")
SELECT
  "companyId",
  direction,
  DATE("createdAt" AT TIME ZONE 'UTC') AS "sequenceDate",
  COUNT(*)::INTEGER AS "lastSequence"
FROM "Transaction"
GROUP BY "companyId", direction, DATE("createdAt" AT TIME ZONE 'UTC');

-- Enforce not-null after backfill.
ALTER TABLE "Transaction"
ALTER COLUMN "transactionNumber" SET NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_companyId_transactionNumber_key" ON "Transaction"("companyId", "transactionNumber");

-- CreateIndex
CREATE INDEX "Transaction_companyId_transactionNumber_idx" ON "Transaction"("companyId", "transactionNumber");

-- CreateIndex
CREATE INDEX "Transaction_companyId_submittedAt_idx" ON "Transaction"("companyId", "submittedAt");

-- CreateIndex
CREATE INDEX "Transaction_companyId_paidAt_idx" ON "Transaction"("companyId", "paidAt");

-- CreateIndex
CREATE INDEX "TransactionNumberSequence_companyId_sequenceDate_idx" ON "TransactionNumberSequence"("companyId", "sequenceDate");

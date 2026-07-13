-- CreateTable
CREATE TABLE "ActivityLog" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "eventType" TEXT NOT NULL,
    "module" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "employeeId" TEXT,
    "resourceType" TEXT,
    "resourceId" TEXT,
    "resourceNumber" TEXT,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityLog_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_createdAt_idx" ON "ActivityLog"("companyId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_module_createdAt_idx" ON "ActivityLog"("companyId", "module", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_action_createdAt_idx" ON "ActivityLog"("companyId", "action", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_userId_createdAt_idx" ON "ActivityLog"("companyId", "userId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_eventType_createdAt_idx" ON "ActivityLog"("companyId", "eventType", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_resourceType_resourceId_idx" ON "ActivityLog"("companyId", "resourceType", "resourceId");

-- CreateIndex
CREATE INDEX "ActivityLog_companyId_resourceNumber_idx" ON "ActivityLog"("companyId", "resourceNumber");

-- AddForeignKey
ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

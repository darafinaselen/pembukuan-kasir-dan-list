-- CreateEnum
CREATE TYPE "ExpenseApprovalStatus" AS ENUM ('APPROVED', 'PENDING_EDIT', 'PENDING_DELETE', 'REJECTED');

-- AlterEnum
ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_EDIT';

ALTER TYPE "AuditAction" ADD VALUE 'REQUEST_DELETE';

ALTER TYPE "AuditAction" ADD VALUE 'APPROVE_EDIT';

ALTER TYPE "AuditAction" ADD VALUE 'APPROVE_DELETE';

-- AlterTable
ALTER TABLE "expenses"
ADD COLUMN "approval_status" "ExpenseApprovalStatus" NOT NULL DEFAULT 'APPROVED',
ADD COLUMN "edit_request_reason" TEXT,
ADD COLUMN "delete_request_reason" TEXT,
ADD COLUMN "rejection_reason" TEXT,
ADD COLUMN "original_data" JSONB,
ADD COLUMN "requested_by_id" TEXT,
ADD COLUMN "approved_by_id" TEXT,
ADD COLUMN "requested_at" TIMESTAMP(3),
ADD COLUMN "approved_at" TIMESTAMP(3);

-- CreateIndex
CREATE INDEX "expenses_requested_by_id_idx" ON "expenses" ("requested_by_id");

-- CreateIndex
CREATE INDEX "expenses_approved_by_id_idx" ON "expenses" ("approved_by_id");

-- AddForeignKey
ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses"
ADD CONSTRAINT "expenses_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users" ("id") ON DELETE SET NULL ON UPDATE CASCADE;
-- AlterTable
ALTER TABLE "expenses" ADD COLUMN     "driverId" TEXT,
ADD COLUMN     "staffId" TEXT;

-- CreateIndex
CREATE INDEX "expenses_armadaId_idx" ON "expenses"("armadaId");

-- CreateIndex
CREATE INDEX "expenses_driverId_idx" ON "expenses"("driverId");

-- CreateIndex
CREATE INDEX "expenses_staffId_idx" ON "expenses"("staffId");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "actual_checkin_datetime" TIMESTAMP(3),
ADD COLUMN     "actual_overtime_cost" INTEGER;

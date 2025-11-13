-- DropIndex
DROP INDEX "public"."transactions_hotel_tier_id_idx";

-- AlterTable
ALTER TABLE "armadas" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "color" TEXT,
ADD COLUMN     "vehicle_type" TEXT,
ADD COLUMN     "year" INTEGER;

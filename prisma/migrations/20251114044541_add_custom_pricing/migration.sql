-- AlterEnum
ALTER TYPE "PackageType" ADD VALUE 'CUSTOM_PRICING';

-- AlterTable
ALTER TABLE "transactions" ADD COLUMN     "custom_price" INTEGER;

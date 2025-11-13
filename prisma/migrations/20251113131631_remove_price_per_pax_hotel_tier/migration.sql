/*
  Warnings:

  - You are about to drop the column `pricePerPax` on the `hotel_tiers` table. All the data in the column will be lost.

*/
-- AlterEnum
-- This migration adds more than one value to an enum.
-- With PostgreSQL versions 11 and earlier, this is not possible
-- in a single migration. This can be worked around by creating
-- multiple migrations, each migration adding only one value to
-- the enum.


ALTER TYPE "AuditAction" ADD VALUE 'SUBMIT_APPROVAL';
ALTER TYPE "AuditAction" ADD VALUE 'APPROVE';
ALTER TYPE "AuditAction" ADD VALUE 'REJECT';

-- AlterTable
ALTER TABLE "hotel_tiers" DROP COLUMN "pricePerPax";

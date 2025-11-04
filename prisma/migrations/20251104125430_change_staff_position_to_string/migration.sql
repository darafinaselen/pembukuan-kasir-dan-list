/*
  Warnings:

  - Changed the type of `position` on the `staff` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/
-- AlterTable
ALTER TABLE "staff" DROP COLUMN "position",
ADD COLUMN     "position" TEXT NOT NULL;

-- DropEnum
DROP TYPE "public"."StaffPosition";

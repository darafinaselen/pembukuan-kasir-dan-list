-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "StaffPosition" AS ENUM ('ADMIN', 'FINANCE', 'OPERATIONS', 'DRIVER', 'MECHANIC', 'CUSTOMER_SERVICE', 'OTHER');

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "nik" TEXT,
    "position" "StaffPosition" NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "salary_amount" INTEGER NOT NULL,
    "allowances" INTEGER DEFAULT 0,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "account_holder" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "join_date" DATE NOT NULL,
    "resign_date" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_nik_key" ON "staff"("nik");

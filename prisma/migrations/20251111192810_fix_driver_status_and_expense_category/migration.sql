/*
Warnings:

- Changed the type of `category` on the `expenses` table. No cast exists, the column would be dropped and recreated, which cannot be done if there is data, since the column is required.

*/

-- CreateEnum for ExpenseCategory
CREATE TYPE "ExpenseCategory" AS ENUM ('LISTRIK', 'INTERNET', 'PAKET_DATA', 'KONSUMSI', 'GAJI_STAF_OPERASIONAL', 'GAJI_STAF_ADMIN', 'INSENTIF_BONUS', 'PAJAK', 'ALAT_TULIS_KANTOR', 'KOMPUTER_SUPPLIES', 'OPERASIONAL_LAINNYA', 'BBM', 'PERAWATAN_ARMADA', 'GAJI_SOPIR', 'LAINNYA');

-- AlterEnum - Add BOOKED to DriverStatus
ALTER TYPE "DriverStatus" ADD VALUE 'BOOKED';

-- Step 1: Add temporary column for new category type
ALTER TABLE "expenses" ADD COLUMN "category_new" "ExpenseCategory";

-- Step 2: Migrate existing data to new column (map string values to enum values)
-- This handles all the existing string values and maps them to the corresponding enum
UPDATE "expenses" SET "category_new" = 
  CASE 
    WHEN "category" = 'LISTRIK' THEN 'LISTRIK'::"ExpenseCategory"
    WHEN "category" = 'INTERNET' THEN 'INTERNET'::"ExpenseCategory"
    WHEN "category" = 'PAKET_DATA' THEN 'PAKET_DATA'::"ExpenseCategory"
    WHEN "category" = 'KONSUMSI' THEN 'KONSUMSI'::"ExpenseCategory"
    WHEN "category" = 'GAJI_STAF_OPERASIONAL' THEN 'GAJI_STAF_OPERASIONAL'::"ExpenseCategory"
    WHEN "category" = 'GAJI_STAF_ADMIN' THEN 'GAJI_STAF_ADMIN'::"ExpenseCategory"
    WHEN "category" = 'INSENTIF_BONUS' THEN 'INSENTIF_BONUS'::"ExpenseCategory"
    WHEN "category" = 'PAJAK' THEN 'PAJAK'::"ExpenseCategory"
    WHEN "category" = 'ALAT_TULIS_KANTOR' THEN 'ALAT_TULIS_KANTOR'::"ExpenseCategory"
    WHEN "category" = 'KOMPUTER_SUPPLIES' THEN 'KOMPUTER_SUPPLIES'::"ExpenseCategory"
    WHEN "category" = 'OPERASIONAL_LAINNYA' THEN 'OPERASIONAL_LAINNYA'::"ExpenseCategory"
    WHEN "category" = 'BBM' THEN 'BBM'::"ExpenseCategory"
    WHEN "category" = 'PERAWATAN_ARMADA' THEN 'PERAWATAN_ARMADA'::"ExpenseCategory"
    WHEN "category" = 'GAJI_SOPIR' THEN 'GAJI_SOPIR'::"ExpenseCategory"
    -- Default any other values to LAINNYA
    ELSE 'LAINNYA'::"ExpenseCategory"
  END;

-- Step 3: Drop old category column
ALTER TABLE "expenses" DROP COLUMN "category";

-- Step 4: Rename new column to category
ALTER TABLE "expenses" RENAME COLUMN "category_new" TO "category";

-- Step 5: Make category column NOT NULL
ALTER TABLE "expenses" ALTER COLUMN "category" SET NOT NULL;
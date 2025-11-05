-- Remove fuel_cost and driver_fee columns from transactions table
ALTER TABLE "transactions" DROP COLUMN IF EXISTS "fuel_cost";

ALTER TABLE "transactions" DROP COLUMN IF EXISTS "driver_fee";

-- Add dp_amount column (optional, nullable integer for down payment tracking)
ALTER TABLE "transactions" ADD COLUMN "dp_amount" INTEGER;
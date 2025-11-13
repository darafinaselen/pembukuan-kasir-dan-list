-- Migration: Add hotel_tier_id to transactions table
-- Created: 2025-11-13

-- Add hotel_tier_id column to transactions table
ALTER TABLE "transactions" ADD COLUMN "hotel_tier_id" TEXT;

-- Add foreign key constraint
ALTER TABLE "transactions"
ADD CONSTRAINT "transactions_hotel_tier_id_fkey" FOREIGN KEY ("hotel_tier_id") REFERENCES "hotel_tiers" ("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Add index for better query performance
CREATE INDEX "transactions_hotel_tier_id_idx" ON "transactions" ("hotel_tier_id");
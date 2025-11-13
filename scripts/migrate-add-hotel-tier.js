/**
 * Manual Migration Script
 * Run this to add hotel_tier_id to transactions table
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runMigration() {
  console.log("🔧 Running migration: Add hotel_tier_id to transactions...");

  try {
    // Add column using raw SQL
    await prisma.$executeRaw`
      ALTER TABLE "transactions" 
      ADD COLUMN IF NOT EXISTS "hotel_tier_id" TEXT;
    `;
    console.log("✅ Column hotel_tier_id added");

    // Add foreign key constraint
    await prisma.$executeRaw`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM pg_constraint 
          WHERE conname = 'transactions_hotel_tier_id_fkey'
        ) THEN
          ALTER TABLE "transactions"
          ADD CONSTRAINT "transactions_hotel_tier_id_fkey" 
          FOREIGN KEY ("hotel_tier_id") 
          REFERENCES "hotel_tiers"("id") 
          ON DELETE SET NULL 
          ON UPDATE CASCADE;
        END IF;
      END $$;
    `;
    console.log("✅ Foreign key constraint added");

    // Add index
    await prisma.$executeRaw`
      CREATE INDEX IF NOT EXISTS "transactions_hotel_tier_id_idx" 
      ON "transactions"("hotel_tier_id");
    `;
    console.log("✅ Index created");

    console.log("\n🎉 Migration completed successfully!");
  } catch (error) {
    console.error("❌ Migration failed:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration();

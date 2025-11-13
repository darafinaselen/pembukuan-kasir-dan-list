const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const fs = require("fs");
const path = require("path");

async function runMigration() {
  console.log("🔧 Running expense approval workflow migration...\n");

  try {
    const migrationSQL = fs.readFileSync(
      path.join(
        __dirname,
        "../prisma/migrations/20251113_add_expense_approval_workflow/migration.sql"
      ),
      "utf8"
    );

    // Split by semicolon and execute each statement
    const statements = migrationSQL
      .split(";")
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && !s.startsWith("--"));

    console.log(`📋 Found ${statements.length} SQL statements to execute\n`);

    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      console.log(`Executing statement ${i + 1}/${statements.length}...`);

      try {
        await prisma.$executeRawUnsafe(statement);
        console.log(`✅ Statement ${i + 1} executed successfully\n`);
      } catch (error) {
        // Ignore errors for ALTER TYPE ADD VALUE if value already exists
        if (error.message.includes("already exists")) {
          console.log(`⚠️  Statement ${i + 1} skipped (already exists)\n`);
        } else {
          throw error;
        }
      }
    }

    console.log("🎉 Migration completed successfully!");
    console.log("\n📊 Summary:");
    console.log("   ✅ ExpenseApprovalStatus enum created");
    console.log("   ✅ AuditAction enum updated with new values");
    console.log("   ✅ Approval workflow fields added to expenses table");
    console.log("   ✅ Foreign keys and indexes created");
    console.log(
      "\n🔄 Next step: Run 'npx prisma generate' to update Prisma Client"
    );
  } catch (error) {
    console.error("❌ Migration failed:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

runMigration().catch((e) => {
  console.error(e);
  process.exit(1);
});

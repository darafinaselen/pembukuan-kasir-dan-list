/**
 * Data Migration Script
 * Migrate transaction user relations from string fields to foreign key relations
 * Run this after applying the schema changes
 */

const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function runMigration() {
  console.log("🔧 Running data migration: Transaction user relations...\n");

  try {
    // Get all transactions that have user references
    const transactions = await prisma.transaction.findMany({
      where: {
        OR: [
          { submitted_by: { isNot: null } },
          { approved_by: { isNot: null } },
          { rejected_by: { isNot: null } },
          { requested_by: { isNot: null } }
        ]
      },
      select: {
        id: true,
        submitted_by: true,
        approved_by: true,
        rejected_by: true,
        requested_by: true
      }
    });

    console.log(`📋 Found ${transactions.length} transactions with user references\n`);

    let updatedCount = 0;
    let errorCount = 0;

    for (const transaction of transactions) {
      try {
        const updateData = {};

        // Map submitted_by string to submitted_by_id
        if (transaction.submitted_by) {
          const user = await prisma.user.findUnique({
            where: { id: transaction.submitted_by },
            select: { id: true }
          });
          if (user) {
            updateData.submitted_by_id = user.id;
          } else {
            console.log(`⚠️  User ${transaction.submitted_by} not found for transaction ${transaction.id} (submitted_by)`);
          }
        }

        // Map approved_by string to approved_by_id
        if (transaction.approved_by) {
          const user = await prisma.user.findUnique({
            where: { id: transaction.approved_by },
            select: { id: true }
          });
          if (user) {
            updateData.approved_by_id = user.id;
          } else {
            console.log(`⚠️  User ${transaction.approved_by} not found for transaction ${transaction.id} (approved_by)`);
          }
        }

        // Map rejected_by string to rejected_by_id
        if (transaction.rejected_by) {
          const user = await prisma.user.findUnique({
            where: { id: transaction.rejected_by },
            select: { id: true }
          });
          if (user) {
            updateData.rejected_by_id = user.id;
          } else {
            console.log(`⚠️  User ${transaction.rejected_by} not found for transaction ${transaction.id} (rejected_by)`);
          }
        }

        // Map requested_by string to requested_by_id
        if (transaction.requested_by) {
          const user = await prisma.user.findUnique({
            where: { id: transaction.requested_by },
            select: { id: true }
          });
          if (user) {
            updateData.requested_by_id = user.id;
          } else {
            console.log(`⚠️  User ${transaction.requested_by} not found for transaction ${transaction.id} (requested_by)`);
          }
        }

        // Update the transaction if we have data to update
        if (Object.keys(updateData).length > 0) {
          await prisma.transaction.update({
            where: { id: transaction.id },
            data: updateData
          });
          updatedCount++;
          console.log(`✅ Updated transaction ${transaction.id}`);
        }

      } catch (error) {
        console.error(`❌ Failed to update transaction ${transaction.id}:`, error.message);
        errorCount++;
      }
    }

    console.log("\n🎉 Data migration completed!");
    console.log(`📊 Summary:`);
    console.log(`   ✅ Transactions updated: ${updatedCount}`);
    if (errorCount > 0) {
      console.log(`   ❌ Errors: ${errorCount}`);
    }
    console.log(`   📝 Total transactions processed: ${transactions.length}`);

    console.log("\n🔄 Next steps:");
    console.log("   1. Verify data integrity");
    console.log("   2. Update application code to use new relation fields");
    console.log("   3. Test approval workflows");
    console.log("   4. Consider dropping old string columns in future migration");

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
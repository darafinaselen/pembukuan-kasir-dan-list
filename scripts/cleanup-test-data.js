const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function cleanupTestData() {
  console.log("🧹 Cleaning up regression artifacts...");

  try {
    const deletedTransactions = await prisma.transaction.deleteMany();
    const deletedExpenses = await prisma.expense.deleteMany();

    const resetArmadas = await prisma.armada.updateMany({
      data: { status: "READY" },
    });

    const resetDrivers = await prisma.driver.updateMany({
      data: { status: "READY" },
    });

    console.log(`✅ Deleted ${deletedTransactions.count} transactions`);
    console.log(`✅ Deleted ${deletedExpenses.count} expenses`);
    console.log(`✅ Reset ${resetArmadas.count} armadas to READY`);
    console.log(`✅ Reset ${resetDrivers.count} drivers to READY`);
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

cleanupTestData().catch((error) => {
  console.error("Fatal cleanup error:", error.stack);
  process.exit(1);
});

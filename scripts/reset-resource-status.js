const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function resetResourceStatus() {
  try {
    console.log("🔄 Resetting all armada and driver statuses to READY...");
    
    const [armadas, drivers] = await Promise.all([
      prisma.armada.updateMany({
        data: { status: "READY" },
      }),
      prisma.driver.updateMany({
        data: { status: "READY" },
      }),
    ]);

    console.log(`✅ Reset ${armadas.count} armadas`);
    console.log(`✅ Reset ${drivers.count} drivers\n`);
  } catch (error) {
    console.error("❌ Error resetting resources:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

resetResourceStatus();

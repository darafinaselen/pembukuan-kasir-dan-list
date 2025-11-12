const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function checkResources() {
  try {
    const drivers = await prisma.driver.findMany({ where: { status: "READY" } });
    const armadas = await prisma.armada.findMany({ where: { status: "READY" } });
    const operator = await prisma.user.findUnique({
      where: { email: "operator@example.com" },
    });

    console.log("\n📊 Resource Check:");
    console.log(`✓ READY Drivers: ${drivers.length}`);
    console.log(`✓ READY Armadas: ${armadas.length}`);
    console.log(`✓ Operator exists: ${!!operator}`);
    
    if (drivers.length > 0) {
      console.log(`\n👨‍✈️ First READY Driver: ${drivers[0].driver_name} (${drivers[0].id})`);
    }
    if (armadas.length > 0) {
      console.log(`🚗 First READY Armada: ${armadas[0].license_plate} (${armadas[0].id})`);
    }
    if (operator) {
      console.log(`👤 Operator: ${operator.email} (ID: ${operator.id})\n`);
    }
  } catch (error) {
    console.error("Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkResources();

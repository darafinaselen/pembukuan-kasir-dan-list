const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function checkPackages() {
  try {
    console.log("\n🔍 Checking ServicePackage data...\n");

    const packages = await prisma.servicePackage.findMany({
      take: 5,
      select: {
        id: true,
        name: true,
        type: true,
        price: true,
        durationHours: true,
        hotelTiers: {
          select: {
            starRating: true,
            pricePerPax: true,
          },
        },
      },
    });

    console.log(`Found ${packages.length} packages\n`);

    packages.forEach((pkg, idx) => {
      console.log(`Package ${idx + 1}:`);
      console.log(`  ID: ${pkg.id}`);
      console.log(`  Name: ${pkg.name}`);
      console.log(`  Type: ${pkg.type}`);
      console.log(`  Price: ${pkg.price || "N/A"}`);
      console.log(
        `  Duration: ${pkg.durationHours ? pkg.durationHours + "h" : "N/A"}`
      );
      if (pkg.hotelTiers && pkg.hotelTiers.length > 0) {
        console.log(`  Hotel Tiers: ${pkg.hotelTiers.length} tiers`);
      }
      console.log("");
    });

    const typeCount = await prisma.servicePackage.groupBy({
      by: ["type"],
      _count: true,
    });

    console.log("Package Types:");
    typeCount.forEach((t) => {
      console.log(`  ${t.type}: ${t._count} packages`);
    });
  } catch (error) {
    console.error("❌ Error:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

checkPackages();

/**
 * Reset Admin User Script
 * Deletes and recreates admin user with default password
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🔄 Resetting admin user...");

  // Delete existing admin
  await prisma.user.deleteMany({
    where: {
      email: "admin@pembukuan.com",
    },
  });

  console.log("✅ Old admin deleted");

  // Create new admin with default password
  const password = "Admin123!";
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  const adminUser = await prisma.user.create({
    data: {
      username: "admin",
      email: "admin@pembukuan.com",
      password: hashedPassword,
      name: "System Administrator",
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Admin user created successfully!");
  console.log("");
  console.log("📋 Credentials:");
  console.log(`   Username: ${adminUser.username}`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: ${password}`);
}

main()
  .catch((e) => {
    console.error("❌ Error resetting admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

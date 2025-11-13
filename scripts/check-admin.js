/**
 * Check and Update Admin User
 * Verifies admin exists and resets password if needed
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function checkAndUpdateAdmin() {
  console.log("🔍 Checking admin user...\n");

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: {
      OR: [{ username: "admin" }, { role: "ADMIN" }],
    },
  });

  if (!admin) {
    console.log("❌ No admin user found!");
    console.log("   Run: node prisma/seed-admin.js");
    return;
  }

  console.log("✅ Admin user found:");
  console.log(`   ID: ${admin.id}`);
  console.log(`   Username: ${admin.username}`);
  console.log(`   Email: ${admin.email}`);
  console.log(`   Role: ${admin.role}`);
  console.log(`   Active: ${admin.isActive}`);
  console.log(`   Created: ${admin.createdAt}\n`);

  // Test password
  const testPassword = "Admin123!";
  const isValid = await bcrypt.compare(testPassword, admin.password);

  if (isValid) {
    console.log("✅ Password is correct: Admin123!");
  } else {
    console.log("⚠️  Password mismatch! Resetting to: Admin123!");

    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(testPassword, salt);

    await prisma.user.update({
      where: { id: admin.id },
      data: {
        password: hashedPassword,
        isActive: true,
      },
    });

    console.log("✅ Password has been reset!");
  }

  console.log("\n📋 Login Credentials:");
  console.log(`   Username: ${admin.username}`);
  console.log("   Password: Admin123!");
  console.log("\n🌐 Access: http://localhost:3000");
}

checkAndUpdateAdmin()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

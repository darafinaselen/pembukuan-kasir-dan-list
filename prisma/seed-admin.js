/**
 * Seed Script - Create Default Admin User
 * Run with: node prisma/seed-admin.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding default admin user...");

  const username = process.env.DEFAULT_ADMIN_USERNAME || "admin";
  const email = process.env.DEFAULT_ADMIN_EMAIL || "admin@pembukuan.com";
  const password = process.env.DEFAULT_ADMIN_PASSWORD || "Admin123!";
  const name = "System Administrator";

  // Check if admin already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }, { role: "ADMIN" }],
    },
  });

  if (existingUser) {
    console.log("⚠️  Admin user already exists. Skipping...");
    console.log(`   Username: ${existingUser.username}`);
    console.log(`   Email: ${existingUser.email}`);
    return;
  }

  // Hash password
  const salt = await bcrypt.genSalt(12);
  const hashedPassword = await bcrypt.hash(password, salt);

  // Create admin user
  const adminUser = await prisma.user.create({
    data: {
      username,
      email,
      password: hashedPassword,
      name,
      role: "ADMIN",
      isActive: true,
    },
  });

  console.log("✅ Default admin user created successfully!");
  console.log("");
  console.log("📋 Credentials:");
  console.log(`   Username: ${adminUser.username}`);
  console.log(`   Email: ${adminUser.email}`);
  console.log(`   Password: ${password}`);
  console.log("");
  console.log(
    "⚠️  IMPORTANT: Change the default password immediately after first login!"
  );
}

main()
  .catch((e) => {
    console.error("❌ Error seeding admin user:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

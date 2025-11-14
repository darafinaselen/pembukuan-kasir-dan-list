const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

const TARGET_EMAIL = "admin@example.com";
const TARGET_USERNAME = "admin-regression";
const TARGET_PASSWORD = "password123";
const TARGET_ROLE = "ADMIN";
const TARGET_NAME = "Regression Admin";

async function ensureAdminCredentials() {
  console.log("🔐 Ensuring Admin regression user exists...\n");

  try {
    const existingAdmin = await prisma.user.findUnique({
      where: { email: TARGET_EMAIL },
    });

    const hashedPassword = await bcrypt.hash(TARGET_PASSWORD, 10);

    if (existingAdmin) {
      await prisma.user.update({
        where: { id: existingAdmin.id },
        data: {
          username: TARGET_USERNAME,
          name: TARGET_NAME,
          password: hashedPassword,
          role: TARGET_ROLE,
        },
      });
      console.log("✅ Admin regression user updated");
      console.log(`   Email: ${TARGET_EMAIL}`);
      console.log(`   Username: ${TARGET_USERNAME}`);
      console.log(`   Role: ${TARGET_ROLE}`);
      console.log(`   Name: ${TARGET_NAME}\n`);
      console.log(
        "🎉 Ready to use admin@example.com / password123 for testing\n"
      );
      return;
    }

    const admin = await prisma.user.create({
      data: {
        email: TARGET_EMAIL,
        username: TARGET_USERNAME,
        name: TARGET_NAME,
        password: hashedPassword,
        role: TARGET_ROLE,
      },
    });

    console.log("✅ Admin regression user created successfully!");
    console.log(`   Email: ${admin.email}`);
    console.log(`   Password: ${TARGET_PASSWORD}`);
    console.log(`   Role: ${admin.role}`);
    console.log(`   Name: ${admin.name}\n`);
    console.log("🎉 You can now use this account for testing:");
    console.log(`   Email: ${TARGET_EMAIL}`);
    console.log(`   Password: ${TARGET_PASSWORD}\n`);
  } catch (error) {
    console.error("❌ Error ensuring admin user:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

ensureAdminCredentials().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

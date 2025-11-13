/**
 * Create Operator User
 * Run this to create an operator user for testing
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createOperator() {
  console.log("🔧 Creating Operator User...\n");

  const username = "operator";
  const email = "operator@pembukuan.com";
  const password = "Operator123!";
  const name = "Operator Test";

  // Check if operator already exists
  const existingUser = await prisma.user.findFirst({
    where: {
      OR: [{ username }, { email }],
    },
  });

  if (existingUser) {
    console.log("⚠️  Operator user already exists:");
    console.log(`   Username: ${existingUser.username}`);
    console.log(`   Email: ${existingUser.email}`);
    console.log(`   Role: ${existingUser.role}\n`);

    // Update password if needed
    console.log("Updating password to: Operator123!");
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    await prisma.user.update({
      where: { id: existingUser.id },
      data: {
        password: hashedPassword,
        role: "OPERATOR",
        isActive: true,
      },
    });

    console.log("✅ Password updated!\n");
  } else {
    // Hash password
    const salt = await bcrypt.genSalt(12);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create operator user
    const operatorUser = await prisma.user.create({
      data: {
        username,
        email,
        password: hashedPassword,
        name,
        role: "OPERATOR",
        isActive: true,
      },
    });

    console.log("✅ Operator user created successfully!\n");
  }

  console.log("📋 Login Credentials:");
  console.log(`   Username: ${username}`);
  console.log(`   Password: ${password}`);
  console.log(`   Role: OPERATOR\n`);

  console.log("🔑 Permissions:");
  console.log("   ✅ View packages");
  console.log("   ✅ View vehicles & drivers");
  console.log("   ✅ Create transactions (status: DRAFT)");
  console.log("   ⚠️  Edit transactions (requires approval)");
  console.log("   ⚠️  Delete transactions (requires approval)\n");

  console.log("🧪 Test Steps:");
  console.log("   1. Open http://localhost:3000");
  console.log("   2. Login with operator credentials");
  console.log("   3. Go to /transaksi");
  console.log("   4. Check packages dropdown - should show data");
  console.log("   5. Create new transaction");
  console.log("   6. Try to edit → should request approval\n");
}

createOperator()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

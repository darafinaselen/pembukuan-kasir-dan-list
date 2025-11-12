const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function createOperatorUser() {
  console.log("🔐 Creating Operator test user...\n");

  try {
    // Check if operator already exists
    const existingOperator = await prisma.user.findUnique({
      where: { email: "operator@example.com" },
    });

    if (existingOperator) {
      console.log("✅ Operator user already exists");
      console.log(`   Email: ${existingOperator.email}`);
      console.log(`   Role: ${existingOperator.role}`);
      console.log(`   Name: ${existingOperator.name}\n`);
      return;
    }

    // Create operator user
    const hashedPassword = await bcrypt.hash("password123", 10);

    const operator = await prisma.user.create({
      data: {
        email: "operator@example.com",
        username: "operator",
        name: "Test Operator",
        password: hashedPassword,
        role: "OPERATOR",
      },
    });

    console.log("✅ Operator user created successfully!");
    console.log(`   Email: ${operator.email}`);
    console.log(`   Password: password123`);
    console.log(`   Role: ${operator.role}`);
    console.log(`   Name: ${operator.name}\n`);

    console.log("🎉 You can now use this account for testing:");
    console.log("   Email: operator@example.com");
    console.log("   Password: password123\n");
  } catch (error) {
    console.error("❌ Error creating operator user:", error.message);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

createOperatorUser().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});

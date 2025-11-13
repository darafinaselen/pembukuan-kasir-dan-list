/**
 * Debug User Session
 * Check what data is returned from /api/auth/me endpoint
 */

const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function debugUserSession() {
  console.log("🔍 Debugging User Session...\n");

  // Find admin user
  const admin = await prisma.user.findFirst({
    where: {
      username: "admin",
    },
    select: {
      id: true,
      username: true,
      email: true,
      name: true,
      role: true,
      isActive: true,
    },
  });

  if (!admin) {
    console.log("❌ Admin user not found!");
    return;
  }

  console.log("✅ Admin user in database:");
  console.log(JSON.stringify(admin, null, 2));
  console.log("\n");

  console.log("📋 Expected response from /api/auth/me:");
  console.log(
    JSON.stringify(
      {
        success: true,
        data: {
          user: {
            id: admin.id,
            email: admin.email,
            username: admin.username,
            name: admin.name,
            role: admin.role,
          },
        },
        message: "Authenticated",
      },
      null,
      2
    )
  );

  console.log("\n");
  console.log("🧪 Testing Instructions:");
  console.log("1. Open browser DevTools (F12)");
  console.log("2. Go to Console tab");
  console.log("3. Run this code:");
  console.log("   fetch('/api/auth/me', { credentials: 'include' })");
  console.log("     .then(r => r.json())");
  console.log("     .then(d => console.log('User:', d))");
}

debugUserSession()
  .catch((e) => {
    console.error("❌ Error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

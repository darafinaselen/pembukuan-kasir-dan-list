/**
 * Test Script - Dashboard Access
 * Tests admin dashboard access with proper authentication
 */

const BASE_URL = "http://localhost:3000";

async function testDashboardAccess() {
  console.log("🧪 Testing Dashboard Access...\n");

  // Step 1: Login as admin
  console.log("1️⃣ Logging in as admin...");
  const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      username: "admin",
      password: "Admin123!",
    }),
  });

  if (!loginResponse.ok) {
    console.error("❌ Login failed:", await loginResponse.text());
    return;
  }

  const loginData = await loginResponse.json();
  const token = loginData.data?.token;

  if (!token) {
    console.error("❌ No token received from login");
    console.log("Response:", loginData);
    return;
  }

  console.log("✅ Login successful");
  console.log(`   Token: ${token.substring(0, 20)}...`);
  console.log(`   User: ${loginData.data?.user?.username}`);
  console.log(`   Role: ${loginData.data?.user?.role}\n`);

  // Step 2: Check auth with /api/auth/me
  console.log("2️⃣ Verifying authentication...");
  const authResponse = await fetch(`${BASE_URL}/api/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Cookie: `session=${token}`,
    },
  });

  if (!authResponse.ok) {
    console.error("❌ Auth verification failed:", await authResponse.text());
    return;
  }

  const authData = await authResponse.json();
  console.log("✅ Authentication verified");
  console.log(`   User: ${authData.data?.user?.username}`);
  console.log(`   Role: ${authData.data?.user?.role}\n`);

  // Step 3: Access dashboard stats API
  console.log("3️⃣ Accessing dashboard stats API...");
  const dashboardResponse = await fetch(
    `${BASE_URL}/api/dashboard/stats?period=month`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        Cookie: `session=${token}`,
      },
    }
  );

  if (!dashboardResponse.ok) {
    console.error(
      "❌ Dashboard access failed:",
      dashboardResponse.status,
      await dashboardResponse.text()
    );
    return;
  }

  const dashboardData = await dashboardResponse.json();
  console.log("✅ Dashboard access successful");
  console.log(`   Total Revenue: ${dashboardData.data?.totalRevenue || 0}`);
  console.log(`   Transactions: ${dashboardData.data?.transactionCount || 0}`);
  console.log(`   Fleet Count: ${dashboardData.data?.fleetCount || 0}\n`);

  console.log("🎉 All tests passed! Dashboard is accessible for admin role.");
  console.log("\n📋 Instructions:");
  console.log("1. Open http://localhost:3000 in your browser");
  console.log("2. Login with:");
  console.log("   Username: admin");
  console.log("   Password: Admin123!");
  console.log("3. You will be redirected to /dashboard automatically");
}

testDashboardAccess().catch((error) => {
  console.error("❌ Test failed with error:", error);
  process.exit(1);
});

/**
 * Test Packages API - Verify packages are retrievable
 */

const API_BASE = "http://localhost:3000/api";

async function testPackagesAPI() {
  console.log("=".repeat(60));
  console.log("🧪 Testing Packages API");
  console.log("=".repeat(60));

  try {
    console.log("\n1️⃣ Testing GET /api/packages (without auth)...");
    const res1 = await fetch(`${API_BASE}/packages`);
    const data1 = await res1.json();

    console.log(`   Status: ${res1.status}`);
    console.log(`   Response:`, JSON.stringify(data1, null, 2));

    if (res1.status === 401 || res1.status === 403) {
      console.log("   ℹ️  Auth required - this is expected");
    }

    console.log("\n2️⃣ Login as Operator...");
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "operator",
        password: "Operator123!",
      }),
    });

    if (!loginRes.ok) {
      throw new Error("Login failed");
    }

    const setCookie = loginRes.headers.get("set-cookie");
    const sessionMatch = setCookie?.match(/session=([^;]+)/);
    const sessionCookie = sessionMatch ? sessionMatch[1] : null;

    if (!sessionCookie) {
      throw new Error("No session cookie");
    }

    console.log("   ✅ Login successful");

    console.log("\n3️⃣ Testing GET /api/packages (with Operator auth)...");
    const res2 = await fetch(`${API_BASE}/packages`, {
      headers: { Cookie: `session=${sessionCookie}` },
    });

    const data2 = await res2.json();

    console.log(`   Status: ${res2.status}`);
    console.log(`   Success: ${data2.success}`);
    console.log(
      `   Data type: ${Array.isArray(data2.data) ? "Array" : typeof data2.data}`
    );
    console.log(`   Packages count: ${data2.data?.length || 0}`);

    if (data2.data && data2.data.length > 0) {
      console.log("\n   📦 Sample packages:");
      data2.data.slice(0, 3).forEach((pkg, idx) => {
        console.log(`      ${idx + 1}. ${pkg.name} (${pkg.type})`);
        console.log(`         ID: ${pkg.id}`);
        console.log(
          `         Price: Rp ${pkg.price?.toLocaleString("id-ID") || 0}`
        );
      });
    }

    console.log("\n4️⃣ Login as Admin...");
    const adminLoginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "Admin123!",
      }),
    });

    if (!adminLoginRes.ok) {
      throw new Error("Admin login failed");
    }

    const adminSetCookie = adminLoginRes.headers.get("set-cookie");
    const adminSessionMatch = adminSetCookie?.match(/session=([^;]+)/);
    const adminSessionCookie = adminSessionMatch ? adminSessionMatch[1] : null;

    console.log("   ✅ Admin login successful");

    console.log("\n5️⃣ Testing GET /api/packages (with Admin auth)...");
    const res3 = await fetch(`${API_BASE}/packages`, {
      headers: { Cookie: `session=${adminSessionCookie}` },
    });

    const data3 = await res3.json();

    console.log(`   Status: ${res3.status}`);
    console.log(`   Success: ${data3.success}`);
    console.log(`   Packages count: ${data3.data?.length || 0}`);

    // Summary
    console.log("\n" + "=".repeat(60));
    console.log("✅ TEST SUMMARY");
    console.log("=".repeat(60));
    console.log(
      `   Operator can view packages: ${res2.ok ? "✅ YES" : "❌ NO"}`
    );
    console.log(`   Admin can view packages: ${res3.ok ? "✅ YES" : "❌ NO"}`);
    console.log(`   Total packages available: ${data2.data?.length || 0}`);

    if (!res2.ok || !res3.ok || !data2.data?.length) {
      throw new Error("Packages API test failed");
    }

    console.log("\n🎉 All tests passed!");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ TEST FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    process.exit(1);
  }
}

testPackagesAPI();

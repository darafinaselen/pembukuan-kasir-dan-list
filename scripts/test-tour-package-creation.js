/**
 * Test TOUR_PACKAGE Creation - Verify TOUR_PACKAGE can be created with valid data
 */

const API_BASE = "http://localhost:3000/api";

async function testTourPackageCreation() {
  console.log("=".repeat(60));
  console.log("🧪 Testing TOUR_PACKAGE Creation");
  console.log("=".repeat(60));

  try {
    console.log("\n1️⃣ Login as Admin...");
    const loginRes = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "admin",
        password: "Admin123!",
      }),
    });

    if (!loginRes.ok) {
      throw new Error("Admin login failed");
    }

    const setCookie = loginRes.headers.get("set-cookie");
    const sessionMatch = setCookie?.match(/session=([^;]+)/);
    const sessionCookie = sessionMatch ? sessionMatch[1] : null;

    if (!sessionCookie) {
      throw new Error("No session cookie");
    }

    console.log("   ✅ Admin login successful");

    console.log("\n2️⃣ Creating TOUR_PACKAGE with valid data...");

    const tourPackageData = {
      namaPaket: "Test Tour Package API",
      tipePaket: "Paket Tour",
      deskripsi: "Test description for API validation",
      durasiHari: 3,
      durasiMalam: 2,
      tarifHotel: [
        {
          tingkat: "Bintang 3",
          daftarHotel: ["Hotel A", "Hotel B"],
          priceRanges: [
            { minPax: 1, maxPax: 3, price: 50000 }, // 50,000 (ribuan)
            { minPax: 4, maxPax: 6, price: 45000 }, // 45,000 (ribuan)
          ],
        },
      ],
      itinerary: [
        { hari: 1, aktivitas: "Day 1 activity" },
        { hari: 2, aktivitas: "Day 2 activity" },
      ],
    };

    console.log("   📦 Package data:");
    console.log(`      Name: ${tourPackageData.namaPaket}`);
    console.log(`      Type: ${tourPackageData.tipePaket}`);
    console.log(
      `      Duration: ${tourPackageData.durasiHari} days, ${tourPackageData.durasiMalam} nights`
    );
    console.log(`      Hotel Tiers: ${tourPackageData.tarifHotel.length}`);
    console.log(
      `      Price Ranges: ${tourPackageData.tarifHotel[0].priceRanges.length} ranges`
    );
    tourPackageData.tarifHotel[0].priceRanges.forEach((range, i) => {
      console.log(
        `         Range ${i + 1}: ${range.minPax}-${range.maxPax}pax = Rp ${range.price.toLocaleString()}k`
      );
    });

    const createRes = await fetch(`${API_BASE}/packages`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Cookie: `session=${sessionCookie}`,
      },
      body: JSON.stringify(tourPackageData),
    });

    const createData = await createRes.json();

    console.log(`\n   Status: ${createRes.status}`);
    console.log(`   Success: ${createData.success}`);

    if (createRes.ok && createData.success) {
      console.log("   ✅ TOUR_PACKAGE created successfully!");
      console.log(`   📦 Package ID: ${createData.data.id}`);
      console.log(`   📦 Package Name: ${createData.data.name}`);
      console.log(`   📦 Package Type: ${createData.data.type}`);

      // Verify hotel tiers were created
      if (createData.data.hotelTiers && createData.data.hotelTiers.length > 0) {
        console.log(`   🏨 Hotel Tiers: ${createData.data.hotelTiers.length}`);
        createData.data.hotelTiers.forEach((tier, i) => {
          console.log(`      Tier ${i + 1}: ${tier.starRating} stars`);
          console.log(`         Hotels: ${tier.hotels?.length || 0}`);
          console.log(
            `         Price Ranges: ${tier.priceRanges?.length || 0}`
          );
          if (tier.priceRanges && tier.priceRanges.length > 0) {
            tier.priceRanges.forEach((range, j) => {
              console.log(
                `            Range ${j + 1}: ${range.minPax}-${range.maxPax}pax = Rp ${range.price.toLocaleString()}`
              );
            });
          }
        });
      }

      // Verify itineraries were created
      if (
        createData.data.itineraries &&
        createData.data.itineraries.length > 0
      ) {
        console.log(
          `   🗺️  Itineraries: ${createData.data.itineraries.length} days`
        );
      }
    } else {
      console.log("   ❌ TOUR_PACKAGE creation failed!");
      console.log("   Error:", createData.error || createData.message);
      throw new Error("TOUR_PACKAGE creation failed");
    }

    console.log("\n" + "=".repeat(60));
    console.log("✅ TOUR_PACKAGE CREATION TEST PASSED");
    console.log("=".repeat(60));
    console.log("\n🎉 Data TOUR_PACKAGE berhasil masuk ke database!");
  } catch (error) {
    console.error("\n" + "=".repeat(60));
    console.error("❌ TEST FAILED");
    console.error("=".repeat(60));
    console.error("\nError:", error.message);
    process.exit(1);
  }
}

testTourPackageCreation();

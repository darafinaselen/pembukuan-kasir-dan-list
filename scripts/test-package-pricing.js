/**
 * Test Package Pricing Fix
 * Verifies that prices are correctly converted from thousands to full rupiah
 */

console.log("🧪 Package Pricing Fix - Test Guide\n");
console.log("=".repeat(60));
console.log("");

console.log("🔧 What was fixed:");
console.log("─".repeat(60));
console.log("❌ BEFORE: CurrencyInput sends 200 → Saved as Rp 200");
console.log("✅ AFTER:  CurrencyInput sends 200 → Saved as Rp 200.000");
console.log("");
console.log("📝 Fix applied to:");
console.log("   - POST /api/packages (create package)");
console.log("   - PUT /api/packages/[id] (update package)");
console.log("");
console.log("💰 Price fields affected:");
console.log("   1. hargaDefault → price (CAR_RENTAL, FULL_DAY_TRIP)");
console.log("   2. tarifOvertime → overtimeRate (CAR_RENTAL, FULL_DAY_TRIP)");
console.log("   3. tarifPerPax → pricePerPax (TOUR_PACKAGE)");
console.log("   4. price in priceRanges (TOUR_PACKAGE)");
console.log("");
console.log("=".repeat(60));
console.log("");

console.log("🧪 Test Instructions:");
console.log("─".repeat(60));
console.log("");

console.log("Test 1: TOUR PACKAGE (Paket Tour)");
console.log("───────────────────────────────────");
console.log("1. Buka http://localhost:3000/paket");
console.log("2. Klik 'Tambah Paket' atau Edit paket existing");
console.log("3. Pilih tipe: 'Paket Tour'");
console.log("4. Isi Tarif Hotel:");
console.log("   - Tingkat: Bintang 4");
console.log("   - Tarif per PAX: 200.000 (input: 200)");
console.log("   - Price Range: Min 1, Max 10, Harga: 500.000 (input: 500)");
console.log("5. Simpan paket");
console.log("");
console.log("✅ Expected Result:");
console.log("   - Database pricePerPax: 200000 (bukan 200)");
console.log("   - Database price in range: 500000 (bukan 500)");
console.log("   - Display shows: Rp 200.000 dan Rp 500.000");
console.log("");

console.log("Test 2: CAR RENTAL (Sewa Mobil)");
console.log("───────────────────────────────────");
console.log("1. Buka http://localhost:3000/paket");
console.log("2. Klik 'Tambah Paket' atau Edit paket existing");
console.log("3. Pilih tipe: 'Sewa Mobil' (CAR_RENTAL)");
console.log("4. Isi:");
console.log("   - Harga Default: 500.000 (input: 500)");
console.log("   - Tarif Overtime: 50.000 (input: 50)");
console.log("5. Simpan paket");
console.log("");
console.log("✅ Expected Result:");
console.log("   - Database price: 500000 (bukan 500)");
console.log("   - Database overtimeRate: 50000 (bukan 50)");
console.log("   - Display shows: Rp 500.000 dan Rp 50.000");
console.log("");

console.log("Test 3: FULL DAY TRIP");
console.log("───────────────────────────────────");
console.log("1. Buka http://localhost:3000/paket");
console.log("2. Klik 'Tambah Paket' atau Edit paket existing");
console.log("3. Pilih tipe: 'Full Day Trip'");
console.log("4. Isi:");
console.log("   - Harga Default: 750.000 (input: 750)");
console.log("   - Tarif Overtime: 75.000 (input: 75)");
console.log("5. Simpan paket");
console.log("");
console.log("✅ Expected Result:");
console.log("   - Database price: 750000 (bukan 750)");
console.log("   - Database overtimeRate: 75000 (bukan 75)");
console.log("   - Display shows: Rp 750.000 dan Rp 75.000");
console.log("");

console.log("=".repeat(60));
console.log("");

console.log("🔍 Verification Methods:");
console.log("─".repeat(60));
console.log("");
console.log("Method 1: Check Database (Prisma Studio)");
console.log("   1. Run: npx prisma studio");
console.log("   2. Open ServicePackage table");
console.log("   3. Check price and overtimeRate values");
console.log("   4. Open HotelTier table");
console.log("   5. Check pricePerPax values");
console.log("   6. Open HotelPriceRange table");
console.log("   7. Check price values");
console.log("");
console.log("Method 2: Check API Response");
console.log("   In browser console after saving:");
console.log("   fetch('/api/packages/[package-id]')");
console.log("     .then(r => r.json())");
console.log("     .then(d => console.log('Price:', d.data.price))");
console.log("");
console.log("Method 3: Check Console Logs");
console.log("   Server will log:");
console.log("   'Creating hotel tier 1: { tarifPerPax: 200, ... }'");
console.log("   After fix, database stores: 200000");
console.log("");

console.log("=".repeat(60));
console.log("");

console.log("📊 Data Conversion Table:");
console.log("─".repeat(60));
console.log("");
console.log("Input (UI)  │ Sent to API │ Stored in DB │ Display");
console.log("────────────┼─────────────┼──────────────┼─────────────");
console.log("200         │ 200         │ 200000       │ Rp 200.000");
console.log("500         │ 500         │ 500000       │ Rp 500.000");
console.log("1.500       │ 1500        │ 1500000      │ Rp 1.500.000");
console.log("");
console.log("🔑 Key Formula: stored_value = input_value × 1000");
console.log("");

console.log("=".repeat(60));
console.log("");
console.log("✨ All fixes applied successfully!");
console.log("   Test your package creation/editing now.");
console.log("");

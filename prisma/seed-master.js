/**
 * Master Data Seed for Pembukuan Kasir & List
 * Only seeds essential master data (users, packages, vehicles, drivers, staff)
 *
 * Run: node prisma/seed-master.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting master data seeding...\n");

  try {
    // ========================================
    // 1. CLEAN EXISTING MASTER DATA
    // ========================================
    console.log("🧹 Cleaning existing master data...");
    await prisma.transaction.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.staff.deleteMany();
    await prisma.servicePackage.deleteMany();
    await prisma.driver.deleteMany();
    await prisma.armada.deleteMany();
    await prisma.user.deleteMany();
    console.log("✅ Master data cleaned\n");

    // ========================================
    // 2. CREATE USERS
    // ========================================
    console.log("👥 Creating users...");

    const hashedPassword = await bcrypt.hash("admin@12345", 12);

    const admin = await prisma.user.create({
      data: {
        username: "admin",
        email: "admin@pembukuan.com",
        password: hashedPassword,
        name: "Administrator",
        role: "ADMIN",
        isActive: true,
      },
    });

    const manager = await prisma.user.create({
      data: {
        username: "manager",
        email: "manager@pembukuan.com",
        password: hashedPassword,
        name: "Manager Operasional",
        role: "MANAGER",
        isActive: true,
      },
    });

    const operator = await prisma.user.create({
      data: {
        username: "operator",
        email: "operator@example.com",
        password: await bcrypt.hash("password123", 12),
        name: "Operator",
        role: "OPERATOR",
        isActive: true,
      },
    });

    console.log(`✅ Created ${admin.name} (ADMIN)`);
    console.log(`✅ Created ${manager.name} (MANAGER)`);
    console.log(`✅ Created ${operator.name} (OPERATOR)\n`);

    // ========================================
    // 3. CREATE SERVICE PACKAGES
    // ========================================
    console.log("📦 Creating service packages...");

    // CAR RENTAL PACKAGES
    const paket12Jam = await prisma.servicePackage.create({
      data: {
        name: "Sewa Mobil 12 Jam",
        type: "CAR_RENTAL",
        description: "Paket sewa mobil dengan sopir untuk 12 jam (dalam kota)",
        includes: [
          "Sopir profesional",
          "BBM untuk 100 km",
          "Asuransi kendaraan",
        ],
        excludes: ["Parkir", "Tol", "BBM tambahan", "Makan sopir"],
        isCustomizable: true,
        customizableItems: ["Durasi", "Jarak tempuh", "Tujuan"],
        price: 500000,
        durationHours: 12,
        overtimeRate: 50000,
      },
    });

    const paket24Jam = await prisma.servicePackage.create({
      data: {
        name: "Sewa Mobil 24 Jam (Full Day)",
        type: "CAR_RENTAL",
        description: "Paket sewa mobil dengan sopir untuk 24 jam penuh",
        includes: [
          "Sopir profesional",
          "BBM untuk 200 km",
          "Asuransi kendaraan",
        ],
        excludes: [
          "Parkir",
          "Tol",
          "BBM tambahan",
          "Makan sopir",
          "Penginapan sopir",
        ],
        isCustomizable: true,
        customizableItems: ["Durasi", "Jarak tempuh", "Tujuan"],
        price: 800000,
        durationHours: 24,
        overtimeRate: 40000,
      },
    });

    const paket6Jam = await prisma.servicePackage.create({
      data: {
        name: "Sewa Mobil 6 Jam (Half Day)",
        type: "CAR_RENTAL",
        description:
          "Paket sewa mobil dengan sopir untuk 6 jam (setengah hari)",
        includes: [
          "Sopir profesional",
          "BBM untuk 50 km",
          "Asuransi kendaraan",
        ],
        excludes: ["Parkir", "Tol", "BBM tambahan", "Makan sopir"],
        isCustomizable: true,
        customizableItems: ["Durasi", "Jarak tempuh"],
        price: 350000,
        durationHours: 6,
        overtimeRate: 60000,
      },
    });

    const paketLuarKota = await prisma.servicePackage.create({
      data: {
        name: "Sewa Mobil Luar Kota",
        type: "CAR_RENTAL",
        description: "Paket sewa mobil untuk perjalanan luar kota (2-3 hari)",
        includes: [
          "Sopir profesional",
          "BBM unlimited",
          "Asuransi kendaraan",
          "Penginapan sopir",
        ],
        excludes: ["Parkir", "Tol", "Makan sopir"],
        isCustomizable: true,
        customizableItems: ["Durasi", "Destinasi", "Rute perjalanan"],
        price: 1500000,
        durationDays: 2,
        durationNights: 1,
        overtimeRate: 100000,
      },
    });

    const paketAirport = await prisma.servicePackage.create({
      data: {
        name: "Airport Transfer (Antar/Jemput)",
        type: "CAR_RENTAL",
        description: "Paket antar jemput bandara (one way)",
        includes: [
          "Sopir profesional",
          "BBM sudah termasuk",
          "Asuransi kendaraan",
          "Free waiting 1 jam",
        ],
        excludes: ["Parkir bandara", "Tol"],
        isCustomizable: false,
        price: 250000,
        durationHours: 2,
        overtimeRate: 75000,
      },
    });

    const paketBulanan = await prisma.servicePackage.create({
      data: {
        name: "Sewa Bulanan Karyawan",
        type: "CAR_RENTAL",
        description: "Paket sewa mobil bulanan untuk karyawan (30 hari)",
        includes: [
          "Sopir profesional",
          "BBM unlimited",
          "Asuransi kendaraan",
          "Service rutin",
        ],
        excludes: ["Parkir", "Tol", "Makan sopir"],
        isCustomizable: true,
        customizableItems: ["Durasi bulan", "Jarak tempuh"],
        price: 12000000,
        durationDays: 30,
        overtimeRate: 50000,
      },
    });

    const paketWedding = await prisma.servicePackage.create({
      data: {
        name: "Paket Wedding Car",
        type: "CAR_RENTAL",
        description: "Paket mobil untuk acara pernikahan",
        includes: [
          "Sopir profesional",
          "Dekorasi mobil",
          "BBM sudah termasuk",
          "Asuransi kendaraan",
        ],
        excludes: ["Dekorasi tambahan", "Parkir", "Tol"],
        isCustomizable: true,
        customizableItems: ["Dekorasi", "Durasi"],
        price: 1000000,
        durationHours: 8,
        overtimeRate: 150000,
      },
    });

    // TOUR PACKAGES
    const paketYogyakarta = await prisma.servicePackage.create({
      data: {
        name: "Wisata Yogyakarta 4 Hari 3 Malam",
        type: "TOUR_PACKAGE",
        description:
          "Paket wisata Yogyakarta lengkap dengan penginapan dan transportasi",
        includes: [
          "Transportasi PP Jakarta-Yogyakarta-Jakarta",
          "Penginapan hotel",
          "Sarapan pagi",
          "Guide wisata",
          "Tiket masuk objek wisata",
        ],
        excludes: [
          "Tiket pesawat",
          "Makan siang/malam",
          "Biaya pribadi",
          "Tips guide",
        ],
        isCustomizable: true,
        customizableItems: ["Pilihan hotel", "Jumlah hari", "Destinasi khusus"],
        durationDays: 4,
        durationNights: 3,
        hotelTiers: {
          create: [
            {
              starRating: 3,
              pricePerPax: 1800000,
              hotels: {
                create: [
                  { name: "Hotel Ibis Styles Yogyakarta" },
                  { name: "Hotel Grand Zuri Malioboro" },
                  { name: "Hotel Melia Purosani" },
                ],
              },
              priceRanges: {
                create: [
                  { minPax: 1, maxPax: 2, price: 1800000 },
                  { minPax: 3, maxPax: 5, price: 1600000 },
                  { minPax: 6, maxPax: 10, price: 1500000 },
                ],
              },
            },
            {
              starRating: 4,
              pricePerPax: 2200000,
              hotels: {
                create: [
                  { name: "Hotel Royal Ambarrukmo" },
                  { name: "Hotel Sheraton Mustika Yogyakarta" },
                  { name: "Hotel Hyatt Regency Yogyakarta" },
                ],
              },
              priceRanges: {
                create: [
                  { minPax: 1, maxPax: 2, price: 2200000 },
                  { minPax: 3, maxPax: 5, price: 2000000 },
                  { minPax: 6, maxPax: 10, price: 1900000 },
                ],
              },
            },
          ],
        },
      },
    });

    const paketJakartaTour = await prisma.servicePackage.create({
      data: {
        name: "City Tour Jakarta",
        type: "TOUR_PACKAGE",
        description: "Paket wisata kota Jakarta dalam sehari",
        includes: [
          "Transportasi hotel pick-up",
          "Guide wisata",
          "Tiket masuk objek wisata",
          "Makan siang",
        ],
        excludes: ["Transportasi ke Jakarta", "Makan malam", "Biaya pribadi"],
        isCustomizable: true,
        customizableItems: ["Durasi", "Destinasi", "Jumlah orang"],
        durationDays: 1,
        durationNights: 0,
        hotelTiers: {
          create: [
            {
              starRating: 0, // No hotel for day tour
              pricePerPax: 350000,
              hotels: {
                create: [],
              },
              priceRanges: {
                create: [
                  { minPax: 1, maxPax: 2, price: 350000 },
                  { minPax: 3, maxPax: 5, price: 300000 },
                  { minPax: 6, maxPax: 10, price: 250000 },
                ],
              },
            },
          ],
        },
      },
    });

    console.log(`✅ Created ${paket12Jam.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paket24Jam.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paket6Jam.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paketLuarKota.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paketAirport.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paketBulanan.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paketWedding.name} (CAR_RENTAL)`);
    console.log(`✅ Created ${paketYogyakarta.name} (TOUR_PACKAGE)`);
    console.log(`✅ Created ${paketJakartaTour.name} (TOUR_PACKAGE)\n`);

    // ========================================
    // 4. CREATE ARMADA (Vehicles)
    // ========================================
    console.log("🚗 Creating armada...");

    const innova1 = await prisma.armada.create({
      data: {
        license_plate: "B 1234 ABC",
        brand: "Toyota",
        model: "Innova Reborn 2020",
        status: "READY",
      },
    });

    const innova2 = await prisma.armada.create({
      data: {
        license_plate: "B 5678 DEF",
        brand: "Toyota",
        model: "Innova Reborn 2019",
        status: "READY",
      },
    });

    const hiace = await prisma.armada.create({
      data: {
        license_plate: "B 9012 GHI",
        brand: "Toyota",
        model: "Hi-Ace 2021",
        status: "READY",
      },
    });

    const avanza = await prisma.armada.create({
      data: {
        license_plate: "B 3456 JKL",
        brand: "Toyota",
        model: "Avanza 2022",
        status: "READY",
      },
    });

    console.log(
      `✅ Created vehicle: ${innova1.license_plate} (${innova1.model})`
    );
    console.log(
      `✅ Created vehicle: ${innova2.license_plate} (${innova2.model})`
    );
    console.log(`✅ Created vehicle: ${hiace.license_plate} (${hiace.model})`);
    console.log(
      `✅ Created vehicle: ${avanza.license_plate} (${avanza.model})\n`
    );

    // ========================================
    // 5. CREATE DRIVERS
    // ========================================
    console.log("👨‍✈️ Creating drivers...");

    const driver1 = await prisma.driver.create({
      data: {
        driver_name: "Budi Santoso",
        phone_number: "08123456789",
        nik: "3201012345670001",
        address: "Jl. Merdeka No. 123, Jakarta Pusat",
        status: "READY",
      },
    });

    const driver2 = await prisma.driver.create({
      data: {
        driver_name: "Ahmad Wijaya",
        phone_number: "08234567890",
        nik: "3201012345670002",
        address: "Jl. Sudirman No. 45, Jakarta Selatan",
        status: "READY",
      },
    });

    const driver3 = await prisma.driver.create({
      data: {
        driver_name: "Dedi Kurniawan",
        phone_number: "08345678901",
        nik: "3201012345670003",
        address: "Jl. Gatot Subroto No. 67, Jakarta Barat",
        status: "READY",
      },
    });

    const driver4 = await prisma.driver.create({
      data: {
        driver_name: "Eko Prasetyo",
        phone_number: "08456789012",
        nik: "3201012345670004",
        address: "Jl. Ahmad Yani No. 89, Tangerang",
        status: "READY",
      },
    });

    console.log(`✅ Created driver: ${driver1.driver_name}`);
    console.log(`✅ Created driver: ${driver2.driver_name}`);
    console.log(`✅ Created driver: ${driver3.driver_name}`);
    console.log(`✅ Created driver: ${driver4.driver_name}\n`);

    // ========================================
    // 6. CREATE STAFF
    // ========================================
    console.log("👔 Creating staff...");

    const staff1 = await prisma.staff.create({
      data: {
        staff_name: "Siti Rahayu",
        nik: "3201015678900001",
        position: "Admin",
        phone_number: "08123456701",
        email: "siti.rahayu@pembukuan.com",
        address: "Jl. Kebon Jeruk No. 12, Jakarta Barat",
        salary_amount: 4500000,
        allowances: 500000,
        bank_name: "BCA",
        bank_account: "1234567890",
        account_holder: "Siti Rahayu",
        join_date: new Date("2024-01-15"),
        status: "ACTIVE",
        notes: "Bertanggung jawab untuk administrasi kantor",
      },
    });

    const staff2 = await prisma.staff.create({
      data: {
        staff_name: "Andi Firmansyah",
        nik: "3201015678900002",
        position: "Finance",
        phone_number: "08123456702",
        email: "andi.firmansyah@pembukuan.com",
        address: "Jl. Casablanca No. 34, Jakarta Selatan",
        salary_amount: 5000000,
        allowances: 600000,
        bank_name: "Mandiri",
        bank_account: "2345678901",
        account_holder: "Andi Firmansyah",
        join_date: new Date("2024-02-01"),
        status: "ACTIVE",
        notes: "Bertanggung jawab untuk keuangan dan pembukuan",
      },
    });

    const staff3 = await prisma.staff.create({
      data: {
        staff_name: "Maya Sari",
        nik: "3201015678900003",
        position: "Operations",
        phone_number: "08123456703",
        email: "maya.sari@pembukuan.com",
        address: "Jl. Thamrin No. 56, Jakarta Pusat",
        salary_amount: 4800000,
        allowances: 550000,
        bank_name: "BNI",
        bank_account: "3456789012",
        account_holder: "Maya Sari",
        join_date: new Date("2024-03-10"),
        status: "ACTIVE",
        notes: "Bertanggung jawab untuk koordinasi operasional",
      },
    });

    const staff4 = await prisma.staff.create({
      data: {
        staff_name: "Rudi Hartono",
        nik: "3201015678900004",
        position: "Mechanic",
        phone_number: "08123456704",
        email: "rudi.hartono@pembukuan.com",
        address: "Jl. Cempaka Putih No. 78, Jakarta Pusat",
        salary_amount: 4200000,
        allowances: 450000,
        bank_name: "BRI",
        bank_account: "4567890123",
        account_holder: "Rudi Hartono",
        join_date: new Date("2024-01-20"),
        status: "ACTIVE",
        notes: "Bertanggung jawab untuk maintenance armada",
      },
    });

    const staff5 = await prisma.staff.create({
      data: {
        staff_name: "Nina Putri",
        nik: "3201015678900005",
        position: "Marketing",
        phone_number: "08123456705",
        email: "nina.putri@pembukuan.com",
        address: "Jl. Senopati No. 90, Jakarta Selatan",
        salary_amount: 4600000,
        allowances: 520000,
        bank_name: "CIMB Niaga",
        bank_account: "5678901234",
        account_holder: "Nina Putri",
        join_date: new Date("2024-04-05"),
        status: "ACTIVE",
        notes: "Bertanggung jawab untuk marketing dan customer service",
      },
    });

    console.log(`✅ Created staff: ${staff1.staff_name} (${staff1.position})`);
    console.log(`✅ Created staff: ${staff2.staff_name} (${staff2.position})`);
    console.log(`✅ Created staff: ${staff3.staff_name} (${staff3.position})`);
    console.log(`✅ Created staff: ${staff4.staff_name} (${staff4.position})`);
    console.log(
      `✅ Created staff: ${staff5.staff_name} (${staff5.position})\n`
    );

    // ========================================
    // SUMMARY
    // ========================================
    console.log("🎉 Master data seeding completed!");
    console.log("📊 Summary:");
    console.log(`   👥 Users: 3 (Admin, Manager, Operator)`);
    console.log(`   📦 Service Packages: 9 (7 CAR_RENTAL + 2 TOUR_PACKAGE)`);
    console.log(`   🚗 Vehicles: 4`);
    console.log(`   👨‍✈️ Drivers: 4`);
    console.log(`   👔 Staff: 5`);
    console.log("\n💡 Next steps:");
    console.log("   • Run 'npm run db:migrate' to apply schema changes");
    console.log("   • Start the application with 'npm run dev'");
    console.log(
      "   • Use seed-complete.js for full data with transactions & expenses"
    );
  } catch (error) {
    console.error("❌ Error seeding master data:", error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    console.log("🔌 Database connection closed");
  });

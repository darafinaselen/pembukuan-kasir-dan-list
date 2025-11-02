/**
 * Complete Seed Data for Pembukuan Kasir & List
 * Data periode: Oktober - November 2025
 *
 * Run: node prisma/seed-complete.js
 */

const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Starting complete database seeding...\n");

  // ========================================
  // 1. CLEAN DATABASE
  // ========================================
  console.log("🧹 Cleaning existing data...");
  await prisma.transaction.deleteMany();
  await prisma.expense.deleteMany();
  await prisma.servicePackage.deleteMany();
  await prisma.driver.deleteMany();
  await prisma.armada.deleteMany();
  await prisma.user.deleteMany();
  console.log("✅ Database cleaned\n");

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

  console.log(`✅ Created ${admin.name} (ADMIN)`);
  console.log(`✅ Created ${manager.name} (MANAGER)\n`);

  // ========================================
  // 3. CREATE SERVICE PACKAGES
  // ========================================
  console.log("📦 Creating service packages...");

  const paket12Jam = await prisma.servicePackage.create({
    data: {
      name: "Sewa Mobil 12 Jam",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil dengan sopir untuk 12 jam (dalam kota)",
      includes: ["Sopir profesional", "BBM untuk 100 km", "Asuransi kendaraan"],
      excludes: ["Parkir", "Tol", "BBM tambahan", "Makan sopir"],
      isCustomizable: true,
      customizableItems: ["Durasi", "Jarak tempuh", "Tujuan"],
      price: 500000,
      durationHours: 12,
      overtimeRate: 50000, // per jam
    },
  });

  const paket24Jam = await prisma.servicePackage.create({
    data: {
      name: "Sewa Mobil 24 Jam (Full Day)",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil dengan sopir untuk 24 jam penuh",
      includes: ["Sopir profesional", "BBM untuk 200 km", "Asuransi kendaraan"],
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
      overtimeRate: 40000, // per jam
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
      overtimeRate: 100000, // per hari
    },
  });

  const paket6Jam = await prisma.servicePackage.create({
    data: {
      name: "Sewa Mobil 6 Jam (Half Day)",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil dengan sopir untuk 6 jam (setengah hari)",
      includes: ["Sopir profesional", "BBM untuk 50 km", "Asuransi kendaraan"],
      excludes: ["Parkir", "Tol", "BBM tambahan", "Makan sopir"],
      isCustomizable: true,
      customizableItems: ["Durasi", "Jarak tempuh"],
      price: 350000,
      durationHours: 6,
      overtimeRate: 60000, // per jam
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
      customizableItems: [],
      price: 250000,
      durationHours: 3,
      overtimeRate: 50000, // per jam tambahan
    },
  });

  const paketWedding = await prisma.servicePackage.create({
    data: {
      name: "Paket Wedding Car",
      type: "CAR_RENTAL",
      description: "Paket mobil pengantin dengan dekorasi khusus",
      includes: [
        "Sopir berpengalaman",
        "Dekorasi mobil pengantin",
        "BBM untuk 50 km",
        "Asuransi kendaraan",
        "Dokumentasi foto",
      ],
      excludes: ["Parkir", "Tol", "BBM tambahan"],
      isCustomizable: true,
      customizableItems: ["Warna dekorasi", "Tema", "Rute"],
      price: 1000000,
      durationHours: 8,
      overtimeRate: 75000,
    },
  });

  const paketCityTour = await prisma.servicePackage.create({
    data: {
      name: "City Tour Jakarta",
      type: "TOUR_PACKAGE",
      description: "Paket wisata keliling Jakarta dengan guide",
      includes: [
        "Sopir & Guide profesional",
        "BBM unlimited",
        "Tiket masuk 3 destinasi",
        "Makan siang",
        "Air mineral",
      ],
      excludes: ["Oleh-oleh", "Parkir", "Tol"],
      isCustomizable: true,
      customizableItems: ["Destinasi", "Waktu mulai", "Jumlah destinasi"],
      price: 1200000,
      durationHours: 10,
      durationDays: 1,
      overtimeRate: 100000,
    },
  });

  const paketMonthly = await prisma.servicePackage.create({
    data: {
      name: "Sewa Bulanan Karyawan",
      type: "CAR_RENTAL",
      description:
        "Paket sewa mobil + sopir untuk karyawan perusahaan (bulanan)",
      includes: [
        "Sopir tetap",
        "BBM 2000 km/bulan",
        "Service rutin",
        "Asuransi all risk",
      ],
      excludes: ["BBM lebih dari 2000 km", "Parkir", "Tol", "Luar kota"],
      isCustomizable: true,
      customizableItems: ["Jumlah km", "Jam operasional", "Area layanan"],
      price: 12000000, // per bulan
      durationDays: 30,
      overtimeRate: 500000, // per hari tambahan
    },
  });

  console.log(`✅ Created package: ${paket12Jam.name}`);
  console.log(`✅ Created package: ${paket24Jam.name}`);
  console.log(`✅ Created package: ${paketLuarKota.name}`);
  console.log(`✅ Created package: ${paket6Jam.name}`);
  console.log(`✅ Created package: ${paketAirport.name}`);
  console.log(`✅ Created package: ${paketWedding.name}`);
  console.log(`✅ Created package: ${paketCityTour.name}`);
  console.log(`✅ Created package: ${paketMonthly.name}\n`);

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
      status: "MAINTENANCE",
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
      status: "ON_TRIP",
    },
  });

  console.log(`✅ Created driver: ${driver1.driver_name}`);
  console.log(`✅ Created driver: ${driver2.driver_name}`);
  console.log(`✅ Created driver: ${driver3.driver_name}`);
  console.log(`✅ Created driver: ${driver4.driver_name}\n`);

  // ========================================
  // 6. CREATE TRANSACTIONS (Oktober 2025)
  // ========================================
  console.log("💰 Creating transactions for Oktober 2025...");

  // Transaksi 1: 5 Oktober 2025
  const tx1 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-10-001",
      customer_name: "PT. Maju Bersama",
      customer_phone: "021-12345678",
      booking_date: new Date("2025-10-05"),
      checkout_datetime: new Date("2025-10-05T08:00:00"),
      checkin_datetime: new Date("2025-10-05T20:00:00"),
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 150000,
      driver_fee: 100000,
      payment_status: "PAID",
      packageId: paket12Jam.id,
      armadaId: innova1.id,
      driverId: driver1.id,
    },
  });

  // Transaksi 2: 8 Oktober 2025 (dengan overtime)
  const tx2 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-10-002",
      customer_name: "Keluarga Bpk. Wijaya",
      customer_phone: "08121234567",
      booking_date: new Date("2025-10-08"),
      checkout_datetime: new Date("2025-10-08T07:00:00"),
      checkin_datetime: new Date("2025-10-08T22:00:00"), // 15 jam (overtime 3 jam)
      all_in_rate: 800000,
      overtime_rate_per_hour: 40000,
      fuel_cost: 180000,
      driver_fee: 120000,
      payment_status: "PAID",
      packageId: paket24Jam.id,
      armadaId: innova2.id,
      driverId: driver2.id,
    },
  });

  // Transaksi 3: 12 Oktober 2025 (Hi-Ace untuk rombongan)
  const tx3 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-10-003",
      customer_name: "Rombongan Wisata Keluarga",
      customer_phone: "08567890123",
      booking_date: new Date("2025-10-12"),
      checkout_datetime: new Date("2025-10-12T06:00:00"),
      checkin_datetime: new Date("2025-10-12T18:00:00"),
      all_in_rate: 1200000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 250000,
      driver_fee: 150000,
      payment_status: "PAID",
      packageId: paket12Jam.id,
      armadaId: hiace.id,
      driverId: driver3.id,
    },
  });

  // Transaksi 4: 15 Oktober 2025 (Luar kota - 2 hari)
  const tx4 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-10-004",
      customer_name: "CV. Global Tour",
      customer_phone: "021-98765432",
      booking_date: new Date("2025-10-15"),
      checkout_datetime: new Date("2025-10-15T05:00:00"),
      checkin_datetime: new Date("2025-10-16T20:00:00"), // 2 hari
      all_in_rate: 1500000,
      overtime_rate_per_hour: 0,
      fuel_cost: 400000,
      driver_fee: 200000,
      payment_status: "PAID",
      packageId: paketLuarKota.id,
      armadaId: innova1.id,
      driverId: driver1.id,
    },
  });

  // Transaksi 5: 20 Oktober 2025
  const tx5 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-10-005",
      customer_name: "Wedding Organizer Indah",
      customer_phone: "08234567891",
      booking_date: new Date("2025-10-20"),
      checkout_datetime: new Date("2025-10-20T10:00:00"),
      checkin_datetime: new Date("2025-10-20T22:00:00"),
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 120000,
      driver_fee: 100000,
      payment_status: "PAID",
      packageId: paket12Jam.id,
      armadaId: innova2.id,
      driverId: driver2.id,
    },
  });

  // Transaksi 6: 25 Oktober 2025 (Full day)
  const tx6 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-10-006",
      customer_name: "Ibu Siti Nurjanah",
      customer_phone: "08678901234",
      booking_date: new Date("2025-10-25"),
      checkout_datetime: new Date("2025-10-25T08:00:00"),
      checkin_datetime: new Date("2025-10-26T08:00:00"), // 24 jam tepat
      all_in_rate: 800000,
      overtime_rate_per_hour: 40000,
      fuel_cost: 200000,
      driver_fee: 120000,
      payment_status: "PAID",
      packageId: paket24Jam.id,
      armadaId: hiace.id,
      driverId: driver3.id,
    },
  });

  console.log(
    `✅ Created transaction: ${tx1.customer_name} (Rp ${tx1.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx2.customer_name} (Rp ${tx2.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx3.customer_name} (Rp ${tx3.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx4.customer_name} (Rp ${tx4.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx5.customer_name} (Rp ${tx5.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx6.customer_name} (Rp ${tx6.all_in_rate.toLocaleString()})\n`
  );

  // ========================================
  // 7. CREATE TRANSACTIONS (November 2025)
  // ========================================
  console.log("💰 Creating transactions for November 2025...");

  // Transaksi 7: 2 November 2025
  const tx7 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-001",
      customer_name: "Event Organizer Prima",
      customer_phone: "021-55556666",
      booking_date: new Date("2025-11-02"),
      checkout_datetime: new Date("2025-11-02T07:00:00"),
      checkin_datetime: new Date("2025-11-02T19:00:00"),
      all_in_rate: 500000,
      overtime_rate_per_hour: 50000,
      fuel_cost: 140000,
      driver_fee: 100000,
      payment_status: "UNPAID",
      packageId: paket12Jam.id,
      armadaId: innova1.id,
      driverId: driver1.id,
    },
  });

  console.log(
    `✅ Created transaction: ${tx7.customer_name} (Rp ${tx7.all_in_rate.toLocaleString()})\n`
  );

  // ========================================
  // 8. CREATE EXPENSES (Oktober 2025)
  // ========================================
  console.log("📝 Creating expenses for Oktober 2025...");

  // BBM Oktober
  const exp1 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-05"),
      category: "BBM",
      description: "BBM untuk B 1234 ABC - Transaksi PT Maju Bersama",
      amount: 150000,
      armadaId: innova1.id,
    },
  });

  const exp2 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-08"),
      category: "BBM",
      description: "BBM untuk B 5678 DEF - Keluarga Bpk Wijaya",
      amount: 180000,
      armadaId: innova2.id,
    },
  });

  const exp3 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-12"),
      category: "BBM",
      description: "BBM untuk B 9012 GHI - Rombongan wisata",
      amount: 250000,
      armadaId: hiace.id,
    },
  });

  const exp4 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-15"),
      category: "BBM",
      description: "BBM untuk B 1234 ABC - Luar kota CV Global Tour (2 hari)",
      amount: 400000,
      armadaId: innova1.id,
    },
  });

  const exp5 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-20"),
      category: "BBM",
      description: "BBM untuk B 5678 DEF - Wedding Organizer",
      amount: 120000,
      armadaId: innova2.id,
    },
  });

  const exp6 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-25"),
      category: "BBM",
      description: "BBM untuk B 9012 GHI - Ibu Siti (24 jam)",
      amount: 200000,
      armadaId: hiace.id,
    },
  });

  // Gaji Sopir Oktober
  const exp7 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-05"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Budi Santoso - PT Maju Bersama",
      amount: 100000,
      armadaId: innova1.id,
    },
  });

  const exp8 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-08"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Ahmad Wijaya - Keluarga Bpk Wijaya",
      amount: 120000,
      armadaId: innova2.id,
    },
  });

  const exp9 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-12"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Dedi Kurniawan - Rombongan wisata",
      amount: 150000,
      armadaId: hiace.id,
    },
  });

  const exp10 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-15"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Budi Santoso - Luar kota 2 hari",
      amount: 200000,
      armadaId: innova1.id,
    },
  });

  const exp11 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-20"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Ahmad Wijaya - Wedding Organizer",
      amount: 100000,
      armadaId: innova2.id,
    },
  });

  const exp12 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-25"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Dedi Kurniawan - Ibu Siti",
      amount: 120000,
      armadaId: hiace.id,
    },
  });

  // Maintenance Oktober
  const exp13 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-10"),
      category: "PERAWATAN_ARMADA",
      description: "Service rutin B 3456 JKL (Avanza) - Ganti oli + filter",
      amount: 500000,
      armadaId: avanza.id,
    },
  });

  const exp14 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-18"),
      category: "PERAWATAN_ARMADA",
      description: "Cuci mobil + salon interior B 1234 ABC",
      amount: 150000,
      armadaId: innova1.id,
    },
  });

  // Operasional Oktober
  const exp15 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-01"),
      category: "OPERASIONAL",
      description: "Sewa kantor bulan Oktober 2025",
      amount: 2000000,
      armadaId: null,
    },
  });

  const exp16 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-15"),
      category: "OPERASIONAL",
      description: "Listrik dan air bulan Oktober",
      amount: 500000,
      armadaId: null,
    },
  });

  console.log(`✅ Created ${16} expense records for Oktober 2025\n`);

  // ========================================
  // 9. CREATE EXPENSES (November 2025)
  // ========================================
  console.log("📝 Creating expenses for November 2025...");

  const exp17 = await prisma.expense.create({
    data: {
      date: new Date("2025-11-02"),
      category: "BBM",
      description: "BBM untuk B 1234 ABC - Event Organizer Prima",
      amount: 140000,
      armadaId: innova1.id,
    },
  });

  const exp18 = await prisma.expense.create({
    data: {
      date: new Date("2025-11-02"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Budi Santoso - Event Organizer Prima",
      amount: 100000,
      armadaId: innova1.id,
    },
  });

  console.log(`✅ Created ${2} expense records for November 2025\n`);

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n🎉 Database seeding completed successfully!\n");
  console.log("📊 SUMMARY:");
  console.log("─────────────────────────────────────────");
  console.log(`✅ Users created: 2 (1 Admin, 1 Manager)`);
  console.log(`✅ Service packages: 8`);
  console.log(`✅ Vehicles (Armada): 4`);
  console.log(`✅ Drivers: 4`);
  console.log(`✅ Transactions Oktober: 6`);
  console.log(`✅ Transactions November: 1`);
  console.log(`✅ Total Transactions: 7`);
  console.log(`✅ Expenses Oktober: 16`);
  console.log(`✅ Expenses November: 2`);
  console.log(`✅ Total Expenses: 18`);
  console.log("─────────────────────────────────────────\n");
}

main()
  .catch((e) => {
    console.error("❌ Error during seeding:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

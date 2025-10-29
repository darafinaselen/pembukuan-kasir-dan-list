const { PrismaClient } = require("@prisma/client");

const prisma = new PrismaClient();

async function main() {
  console.log("Cleaning related tables...");

  // Clean dependent tables first to avoid FK constraint issues.
  // Some environments may not have run migrations yet; handle missing tables gracefully.
  async function safeDeleteMany(name, fn) {
    try {
      await fn();
      console.log(`Cleared ${name}`);
    } catch (e) {
      // Prisma error when table doesn't exist is P2021
      if (e && e.code === "P2021") {
        console.warn(`Table for model ${name} not found — skipping delete.`);
      } else {
        throw e;
      }
    }
  }

  await safeDeleteMany("ItineraryDay", () => prisma.itineraryDay.deleteMany());
  await safeDeleteMany("HotelPriceRange", () =>
    prisma.hotelPriceRange.deleteMany()
  );
  await safeDeleteMany("Hotel", () => prisma.hotel.deleteMany());
  await safeDeleteMany("HotelTier", () => prisma.hotelTier.deleteMany());
  await safeDeleteMany("ServicePackage", () =>
    prisma.servicePackage.deleteMany()
  );
  // Clean operational tables (transactions, expenses, armada, drivers)
  await safeDeleteMany("Transaction", () => prisma.transaction.deleteMany());
  await safeDeleteMany("Expense", () => prisma.expense.deleteMany());
  await safeDeleteMany("Driver", () => prisma.driver.deleteMany());
  await safeDeleteMany("Armada", () => prisma.armada.deleteMany());

  console.log("Creating sample service packages...");

  // CAR RENTAL example
  await prisma.servicePackage.create({
    data: {
      name: "Sewa Avanza Harian",
      type: "CAR_RENTAL",
      description: "Paket sewa mobil Avanza inklusif sopir untuk 24 jam.",
      includes: ["Sopir", "BBM dasar", "Asuransi dasar"],
      excludes: ["Parkir", "Tiket masuk objek wisata"],
      isCustomizable: true,
      customizableItems: ["Waktu", "Penjemputan", "Tambahan sopir"],
      price: 350000,
      durationHours: 24,
      overtimeRate: 50000,
    },
  });

  // TOUR PACKAGE example with hotel tiers, hotels and price ranges + itineraries
  await prisma.servicePackage.create({
    data: {
      name: "Paket Wisata Bali 3 Hari",
      type: "TOUR_PACKAGE",
      description: "Paket wisata 3 hari 2 malam ke destinasi populer di Bali.",
      includes: [
        "Transportasi selama tour",
        "Penginapan sesuai tier",
        "Guide lokal",
        "Makan 6x",
      ],
      excludes: ["Tiket pesawat", "Pengeluaran pribadi"],
      isCustomizable: false,
      customizableItems: [],
      durationDays: 3,
      durationNights: 2,
      hotelTiers: {
        create: [
          {
            starRating: 3,
            pricePerPax: 0,
            hotels: {
              create: [
                { name: "Hotel Melati 3*" },
                { name: "Hotel Kembang 3*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 3, price: 1000000 },
                { minPax: 4, maxPax: 5, price: 900000 },
              ],
            },
          },
          {
            starRating: 4,
            pricePerPax: 0,
            hotels: {
              create: [
                { name: "Hotel Bahari 4*" },
                { name: "Hotel Samudra 4*" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 2, maxPax: 3, price: 1500000 },
                { minPax: 4, maxPax: 6, price: 1300000 },
              ],
            },
          },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Tiba & Santai",
            description:
              "Penjemputan di bandara, makan siang, dan santai di hotel.",
          },
          {
            day: 2,
            title: "Tour Utama",
            description: "Kunjungan ke Pura, Tegalalang, dan pantai.",
          },
          {
            day: 3,
            title: "Check-out & Pulang",
            description: "Sarapan, check-out, dan antar ke bandara.",
          },
        ],
      },
    },
  });

  // FULL_DAY_TRIP example
  await prisma.servicePackage.create({
    data: {
      name: "Paket Trip Uluwatu Full Day",
      type: "FULL_DAY_TRIP",
      description:
        "Trip sehari ke kawasan Uluwatu, cocok untuk keluarga dan grup kecil.",
      includes: ["Transportasi PP", "Tiket masuk 2 lokasi", "Makan siang"],
      excludes: ["Pengeluaran pribadi"],
      isCustomizable: false,
      customizableItems: [],
      price: 800000,
    },
  });

  console.log("Seeding selesai.");

  // Create sample armada and driver data
  console.log("Creating sample armadas and drivers...");
  await prisma.armada.createMany({
    data: [
      {
        license_plate: "B 1234 XYZ",
        brand: "Toyota",
        model: "Avanza",
        status: "READY",
      },
      {
        license_plate: "B 5678 ABC",
        brand: "Daihatsu",
        model: "Xenia",
        status: "READY",
      },
      {
        license_plate: "B 9012 QWE",
        brand: "Toyota",
        model: "Innova",
        status: "MAINTENANCE",
      },
    ],
    skipDuplicates: true,
  });

  await prisma.driver.createMany({
    data: [
      {
        driver_name: "Gunawan",
        nik: "3172010101010001",
        phone_number: "081234567890",
        address: "Jakarta",
        status: "READY",
      },
      {
        driver_name: "Siti Aminah",
        nik: "3172010202020002",
        phone_number: "081298765432",
        address: "Jakarta",
        status: "OFF_DUTY",
      },
      {
        driver_name: "Budi Santoso",
        nik: "3172010303030003",
        phone_number: "081233344455",
        address: "Bogor",
        status: "ON_TRIP",
      },
    ],
    skipDuplicates: true,
  });

  // Log counts for verification
  try {
    const counts = {
      servicePackages: await prisma.servicePackage.count(),
      hotelTiers: await prisma.hotelTier.count(),
      hotels: await prisma.hotel.count(),
      hotelPriceRanges: await prisma.hotelPriceRange.count(),
      itineraryDays: await prisma.itineraryDay.count(),
      armadas: await prisma.armada.count(),
      drivers: await prisma.driver.count(),
      transactions: await prisma.transaction.count(),
      expenses: await prisma.expense.count(),
    };
    console.log("Counts after seed:", counts);

    const packages = await prisma.servicePackage.findMany({
      include: {
        hotelTiers: { include: { hotels: true, priceRanges: true } },
        itineraries: true,
      },
      take: 5,
    });
    console.log("Sample packages:", JSON.stringify(packages, null, 2));

    const armadas = await prisma.armada.findMany({ take: 5 });
    const drivers = await prisma.driver.findMany({ take: 5 });
    console.log("Sample armadas:", JSON.stringify(armadas, null, 2));
    console.log("Sample drivers:", JSON.stringify(drivers, null, 2));
  } catch (e) {
    console.warn(
      "Failed to read back counts or sample packages:",
      e.message || e
    );
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

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
  await prisma.staff.deleteMany();
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

  // Paket Tour Bali 3 Hari 2 Malam - Lengkap dengan hotel tiers dan itinerary
  const paketBaliTour = await prisma.servicePackage.create({
    data: {
      name: "Wisata Bali 3 Hari 2 Malam",
      type: "TOUR_PACKAGE",
      description:
        "Paket wisata Bali lengkap dengan penginapan, transportasi, dan guide profesional",
      includes: [
        "Transportasi PP Jakarta-Bali-Jakarta",
        "Penginapan hotel sesuai pilihan",
        "Sarapan pagi di hotel",
        "Guide wisata profesional",
        "Tiket masuk objek wisata",
        "Makan siang selama tour",
        "Air mineral selama perjalanan",
        "Asuransi perjalanan",
      ],
      excludes: [
        "Tiket pesawat domestik",
        "Makan malam",
        "Biaya pribadi",
        "Tips guide & sopir",
        "Kamera entrance fee",
        "Pembelian oleh-oleh",
      ],
      isCustomizable: true,
      customizableItems: [
        "Pilihan hotel",
        "Jumlah hari tambahan",
        "Destinasi khusus",
      ],
      durationDays: 3,
      durationNights: 2,
      hotelTiers: {
        create: [
          // Hotel Tier 3 Bintang
          {
            starRating: 3,

            hotels: {
              create: [
                { name: "Hotel Puri Bali" },
                { name: "Hotel Sanur Beach" },
                { name: "Hotel Legian Beach" },
                { name: "Hotel Kuta Paradiso" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 2500000 },
                { minPax: 3, maxPax: 5, price: 2200000 },
                { minPax: 6, maxPax: 10, price: 2000000 },
                { minPax: 11, maxPax: 15, price: 1800000 },
                { minPax: 16, maxPax: 20, price: 1700000 },
              ],
            },
          },
          // Hotel Tier 4 Bintang
          {
            starRating: 4,

            hotels: {
              create: [
                { name: "Ayodya Resort Bali" },
                { name: "The Griya Villas & Spa" },
                { name: "Grand Inna Kuta" },
                { name: "Swiss-Belinn Patih Jelantik" },
                { name: "Mercure Kuta Bali" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 3200000 },
                { minPax: 3, maxPax: 5, price: 2900000 },
                { minPax: 6, maxPax: 10, price: 2700000 },
                { minPax: 11, maxPax: 15, price: 2500000 },
                { minPax: 16, maxPax: 20, price: 2400000 },
              ],
            },
          },
          // Hotel Tier 5 Bintang
          {
            starRating: 5,

            hotels: {
              create: [
                { name: "St. Regis Bali Resort" },
                { name: "The Laguna, a Luxury Collection Hotel & Spa" },
                { name: "Mulia Resort" },
                { name: "Four Seasons Resort Bali" },
                { name: "Ayodya Resort Jimbaran" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 4500000 },
                { minPax: 3, maxPax: 5, price: 4200000 },
                { minPax: 6, maxPax: 10, price: 4000000 },
                { minPax: 11, maxPax: 15, price: 3800000 },
                { minPax: 16, maxPax: 20, price: 3700000 },
              ],
            },
          },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Jakarta - Denpasar - Transfer ke Hotel",
            description:
              "Pagi hari keberangkatan dari Jakarta menuju Bandara Ngurah Rai Bali. Setibanya di Bali, langsung transfer ke hotel untuk check-in dan istirahat. Sore hari free time untuk berjalan-jalan di sekitar hotel atau beristirahat.",
          },
          {
            day: 2,
            title: "Tour Ubud - Tegallalang Rice Terrace - Ubud Art Market",
            description:
              "Sarapan pagi di hotel. Pagi hari menuju Ubud untuk mengunjungi Tegallalang Rice Terrace (Sawah Terasering). Lanjut ke Ubud Art Market untuk berbelanja souvenir. Sore hari kembali ke hotel untuk istirahat.",
          },
          {
            day: 3,
            title: "Tour Pantai Kuta - Transfer ke Bandara - Jakarta",
            description:
              "Sarapan pagi di hotel. Pagi hari menuju Pantai Kuta untuk bersantai dan menikmati pemandangan laut. Siang hari check-out hotel dan transfer ke bandara untuk penerbangan kembali ke Jakarta.",
          },
        ],
      },
    },
  });

  // Paket Tour Yogyakarta 4 Hari 3 Malam - Lengkap
  const paketJogjaTour = await prisma.servicePackage.create({
    data: {
      name: "Wisata Yogyakarta 4 Hari 3 Malam",
      type: "TOUR_PACKAGE",
      description:
        "Paket wisata Yogyakarta comprehensive dengan fokus budaya Jawa, candi-candi bersejarah, dan kuliner khas",
      includes: [
        "Transportasi PP Jakarta-Yogyakarta-Jakarta",
        "Penginapan hotel sesuai pilihan",
        "Sarapan pagi di hotel",
        "Guide wisata profesional",
        "Tiket masuk semua objek wisata",
        "Makan siang selama tour",
        "Air mineral selama perjalanan",
        "Asuransi perjalanan",
        "Transportasi lokal selama tour",
      ],
      excludes: [
        "Tiket pesawat domestik",
        "Makan malam",
        "Biaya pribadi",
        "Tips guide & sopir",
        "Kamera entrance fee",
        "Pembelian oleh-oleh",
        "Kuliner khas tambahan",
      ],
      isCustomizable: true,
      customizableItems: [
        "Pilihan hotel",
        "Jumlah hari tambahan",
        "Fokus wisata (budaya/sejarah/kuliner)",
      ],
      durationDays: 4,
      durationNights: 3,
      hotelTiers: {
        create: [
          // Hotel Tier 3 Bintang
          {
            starRating: 3,

            hotels: {
              create: [
                { name: "Hotel Ibis Styles Yogyakarta" },
                { name: "Hotel Tentrem Yogyakarta" },
                { name: "Hotel Melia Purosani" },
                { name: "Hotel Royal Ambarrukmo" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 2800000 },
                { minPax: 3, maxPax: 5, price: 2500000 },
                { minPax: 6, maxPax: 10, price: 2300000 },
                { minPax: 11, maxPax: 15, price: 2100000 },
                { minPax: 16, maxPax: 20, price: 2000000 },
              ],
            },
          },
          // Hotel Tier 4 Bintang
          {
            starRating: 4,

            hotels: {
              create: [
                { name: "The Phoenix Hotel Yogyakarta" },
                { name: "Hotel Hyatt Regency Yogyakarta" },
                { name: "Sheraton Mustika Yogyakarta Resort & Spa" },
                { name: "Novotel Yogyakarta" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 3500000 },
                { minPax: 3, maxPax: 5, price: 3200000 },
                { minPax: 6, maxPax: 10, price: 3000000 },
                { minPax: 11, maxPax: 15, price: 2800000 },
                { minPax: 16, maxPax: 20, price: 2700000 },
              ],
            },
          },
          // Hotel Tier 5 Bintang
          {
            starRating: 5,

            hotels: {
              create: [
                { name: "Platinum Yogyakarta" },
                { name: "The Ritz-Carlton Yogyakarta" },
                { name: "JW Marriott Yogyakarta" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 4800000 },
                { minPax: 3, maxPax: 5, price: 4500000 },
                { minPax: 6, maxPax: 10, price: 4300000 },
                { minPax: 11, maxPax: 15, price: 4100000 },
                { minPax: 16, maxPax: 20, price: 4000000 },
              ],
            },
          },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Jakarta - Yogyakarta - Malioboro & Check-in Hotel",
            description:
              "Pagi hari keberangkatan dari Jakarta menuju Yogyakarta. Setibanya di Yogyakarta, langsung menuju Malioboro untuk berbelanja dan menikmati suasana kota. Check-in hotel dan istirahat sore hari.",
          },
          {
            day: 2,
            title: "Candi Borobudur - Candi Pawon - Candi Mendut",
            description:
              "Sarapan pagi di hotel. Full day tour mengunjungi kompleks Candi Borobudur, Candi Pawon, dan Candi Mendut. Makan siang di restoran lokal. Sore hari kembali ke hotel untuk istirahat.",
          },
          {
            day: 3,
            title: "Keraton Yogyakarta - Taman Sari - Prambanan",
            description:
              "Sarapan pagi di hotel. Mengunjungi Keraton Yogyakarta (Istana Sultan), Taman Sari (Water Castle), dan komplek Candi Prambanan. Pengalaman budaya Jawa yang autentik dengan pertunjukan wayang kulit (optional).",
          },
          {
            day: 4,
            title: "Pantai Parangtritis - Transfer ke Bandara - Jakarta",
            description:
              "Sarapan pagi di hotel. Mengunjungi Pantai Parangtritis untuk menikmati pemandangan laut dan pasir hitam. Check-out hotel dan transfer ke bandara untuk penerbangan kembali ke Jakarta.",
          },
        ],
      },
    },
  });

  // Paket Tour Bandung 2 Hari 1 Malam - Lengkap
  const paketBandungTour = await prisma.servicePackage.create({
    data: {
      name: "Wisata Bandung 2 Hari 1 Malam",
      type: "TOUR_PACKAGE",
      description:
        "Paket wisata Bandung dengan fokus kuliner, factory outlet, dan wisata alam",
      includes: [
        "Transportasi PP Jakarta-Bandung-Jakarta",
        "Penginapan hotel sesuai pilihan",
        "Sarapan pagi di hotel",
        "Guide wisata lokal",
        "Tiket masuk objek wisata",
        "Makan siang selama tour",
        "Air mineral selama perjalanan",
        "Transportasi lokal selama tour",
      ],
      excludes: [
        "Tiket pesawat domestik",
        "Makan malam",
        "Biaya pribadi",
        "Tips guide & sopir",
        "Kamera entrance fee",
        "Pembelian oleh-oleh",
        "Kuliner tambahan",
      ],
      isCustomizable: true,
      customizableItems: [
        "Pilihan hotel",
        "Fokus wisata (kuliner/alam/shopping)",
        "Durasi perpanjangan",
      ],
      durationDays: 2,
      durationNights: 1,
      hotelTiers: {
        create: [
          // Hotel Tier 3 Bintang
          {
            starRating: 3,

            hotels: {
              create: [
                { name: "Hotel Ibis Bandung" },
                { name: "Hotel Grand Setiabudi" },
                { name: "Hotel Horison Bandung" },
                { name: "Hotel Aston Tropicana" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 1800000 },
                { minPax: 3, maxPax: 5, price: 1600000 },
                { minPax: 6, maxPax: 10, price: 1500000 },
                { minPax: 11, maxPax: 15, price: 1400000 },
                { minPax: 16, maxPax: 20, price: 1350000 },
              ],
            },
          },
          // Hotel Tier 4 Bintang
          {
            starRating: 4,

            hotels: {
              create: [
                { name: "Hotel Padma Bandung" },
                { name: "Hotel Sheraton Bandung" },
                { name: "Hotel Hilton Bandung" },
                { name: "Hotel Novotel Bandung" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 2400000 },
                { minPax: 3, maxPax: 5, price: 2200000 },
                { minPax: 6, maxPax: 10, price: 2000000 },
                { minPax: 11, maxPax: 15, price: 1900000 },
                { minPax: 16, maxPax: 20, price: 1850000 },
              ],
            },
          },
          // Hotel Tier 5 Bintang
          {
            starRating: 5,

            hotels: {
              create: [
                { name: "The Trans Luxury Hotel" },
                { name: "InterContinental Bandung" },
                { name: "Hotel Pullman Bandung Grand Central" },
              ],
            },
            priceRanges: {
              create: [
                { minPax: 1, maxPax: 2, price: 3500000 },
                { minPax: 3, maxPax: 5, price: 3300000 },
                { minPax: 6, maxPax: 10, price: 3100000 },
                { minPax: 11, maxPax: 15, price: 3000000 },
                { minPax: 16, maxPax: 20, price: 2950000 },
              ],
            },
          },
        ],
      },
      itineraries: {
        create: [
          {
            day: 1,
            title: "Jakarta - Bandung - Factory Outlet & Kuliner",
            description:
              "Pagi hari keberangkatan dari Jakarta menuju Bandung. Setibanya di Bandung, mengunjungi factory outlet untuk shopping. Lanjut kuliner Bandung dengan mencoba berbagai makanan khas seperti batagor, siomay, dan mie kocok. Check-in hotel sore hari.",
          },
          {
            day: 2,
            title: "Tangkuban Perahu - Lembang - Transfer ke Jakarta",
            description:
              "Sarapan pagi di hotel. Mengunjungi Gunung Tangkuban Perahu untuk menikmati pemandangan kawah aktif. Lanjut ke Lembang untuk wisata strawberry picking dan kuliner. Check-out hotel dan transfer kembali ke Jakarta.",
          },
        ],
      },
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

  // Custom Pricing Package Examples
  const paketCustomWedding = await prisma.servicePackage.create({
    data: {
      name: "Paket Pernikahan Custom",
      type: "CUSTOM_PRICING",
      description: "Paket pernikahan dengan harga nego dan custom requirements",
      includes: [
        "Mewah",
        "Sopir berpengalaman",
        "Dekorasi dasar",
        "Air minum mineral",
      ],
      excludes: ["Makanan", "Foto profesional", "Musik live"],
      isCustomizable: true,
      customizableItems: [
        "Jumlah jam",
        "Rute perjalanan",
        "Tipe dekorasi",
        "Package add-ons",
      ],
      price: 5000000, // Base price (can be overridden)
    },
  });

  const paketCustomTour = await prisma.servicePackage.create({
    data: {
      name: "Paket Wisata Custom",
      type: "CUSTOM_PRICING",
      description: "Paket wisata dengan harga fleksibel berdasarkan request",
      includes: ["Sopir lokal", "BBM", "Parkir", "Air minum"],
      excludes: ["Tiket masuk objek wisata", "Makanan", "Penginapan"],
      isCustomizable: true,
      customizableItems: [
        "Destinasi",
        "Jumlah hari",
        "Jumlah peserta",
        "Transportasi tambahan",
      ],
      price: 1500000, // Base price (can be overridden)
    },
  });

  const paketCorporateEvent = await prisma.servicePackage.create({
    data: {
      name: "Paket Korporasi Custom",
      type: "CUSTOM_PRICING",
      description: "Transportasi untuk event korporasi dengan harga nego",
      includes: [
        "Mewah",
        "Sopir formal",
        "WiFi dalam mobil",
        "Botol air mineral",
      ],
      excludes: ["Tol", "Parkir", "BBM"],
      isCustomizable: true,
      customizableItems: [
        "Jumlah mobil",
        "Jam operasional",
        "Rute pickup/drop",
        "Service level",
      ],
      price: 2000000, // Base price (can be overridden)
    },
  });

  console.log(`✅ Created package: ${paket12Jam.name}`);
  console.log(`✅ Created package: ${paket24Jam.name}`);
  console.log(`✅ Created package: ${paketLuarKota.name}`);
  console.log(`✅ Created package: ${paket6Jam.name}`);
  console.log(`✅ Created package: ${paketAirport.name}`);
  console.log(`✅ Created package: ${paketWedding.name}`);
  console.log(`✅ Created package: ${paketCityTour.name}`);
  console.log(`✅ Created package: ${paketMonthly.name}`);
  console.log(`✅ Created package: ${paketCustomWedding.name}`);
  console.log(`✅ Created package: ${paketCustomTour.name}`);
  console.log(`✅ Created package: ${paketCorporateEvent.name}\n`);

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
      address: "Jl. Palmerah No. 34, Jakarta Pusat",
      salary_amount: 6000000,
      allowances: 1000000,
      bank_name: "Mandiri",
      bank_account: "9876543210",
      account_holder: "Andi Firmansyah",
      join_date: new Date("2023-06-01"),
      status: "ACTIVE",
      notes: "Mengelola keuangan dan pembukuan perusahaan",
    },
  });

  const staff3 = await prisma.staff.create({
    data: {
      staff_name: "Rudi Hartono",
      nik: "3201015678900003",
      position: "Mekanik",
      phone_number: "08123456703",
      email: "rudi.hartono@pembukuan.com",
      address: "Jl. Raya Bogor KM 20, Cibinong",
      salary_amount: 5000000,
      allowances: 750000,
      bank_name: "BNI",
      bank_account: "5555666677",
      account_holder: "Rudi Hartono",
      join_date: new Date("2023-03-10"),
      status: "ACTIVE",
      notes: "Mekanik senior untuk perawatan armada",
    },
  });

  const staff4 = await prisma.staff.create({
    data: {
      staff_name: "Nina Kusuma",
      nik: "3201015678900004",
      position: "Customer Service",
      phone_number: "08123456704",
      email: "nina.kusuma@pembukuan.com",
      address: "Jl. Tebet Raya No. 56, Jakarta Selatan",
      salary_amount: 4000000,
      allowances: 400000,
      bank_name: "BCA",
      bank_account: "1111222233",
      account_holder: "Nina Kusuma",
      join_date: new Date("2024-05-20"),
      status: "ACTIVE",
      notes: "Menangani customer service dan booking",
    },
  });

  const staff5 = await prisma.staff.create({
    data: {
      staff_name: "Dimas Prasetya",
      nik: "3201015678900005",
      position: "Operasional",
      phone_number: "08123456705",
      email: "dimas.prasetya@pembukuan.com",
      address: "Jl. Ciputat Raya No. 78, Tangerang Selatan",
      salary_amount: 5500000,
      allowances: 800000,
      bank_name: "Mandiri",
      bank_account: "7777888899",
      account_holder: "Dimas Prasetya",
      join_date: new Date("2023-09-01"),
      status: "ACTIVE",
      notes: "Koordinator operasional dan logistik",
    },
  });

  const staff6 = await prisma.staff.create({
    data: {
      staff_name: "Lina Marlina",
      nik: "3201015678900006",
      position: "HR",
      phone_number: "08123456706",
      address: "Jl. Kemang Raya No. 90, Jakarta Selatan",
      salary_amount: 5000000,
      allowances: 600000,
      bank_name: "BRI",
      bank_account: "3333444455",
      account_holder: "Lina Marlina",
      join_date: new Date("2024-02-15"),
      status: "ON_LEAVE",
      notes: "Sedang cuti melahirkan",
    },
  });

  const staff7 = await prisma.staff.create({
    data: {
      staff_name: "Bambang Suryadi",
      nik: "3201015678900007",
      position: "IT Support",
      phone_number: "08123456707",
      email: "bambang.suryadi@pembukuan.com",
      address: "Jl. Cibubur No. 45, Depok",
      salary_amount: 6500000,
      allowances: 1200000,
      bank_name: "BCA",
      bank_account: "9999000011",
      account_holder: "Bambang Suryadi",
      join_date: new Date("2022-11-01"),
      status: "ACTIVE",
      notes: "Mengelola sistem IT dan website perusahaan",
    },
  });

  const staff8 = await prisma.staff.create({
    data: {
      staff_name: "Fitri Handayani",
      nik: "3201015678900008",
      position: "Marketing",
      phone_number: "08123456708",
      address: "Jl. Pondok Indah No. 12, Jakarta Selatan",
      salary_amount: 4500000,
      allowances: 500000,
      join_date: new Date("2024-08-01"),
      status: "INACTIVE",
      resign_date: new Date("2025-10-31"),
      notes: "Resign untuk melanjutkan pendidikan",
    },
  });

  console.log(`✅ Created staff: ${staff1.staff_name} (${staff1.position})`);
  console.log(`✅ Created staff: ${staff2.staff_name} (${staff2.position})`);
  console.log(`✅ Created staff: ${staff3.staff_name} (${staff3.position})`);
  console.log(`✅ Created staff: ${staff4.staff_name} (${staff4.position})`);
  console.log(`✅ Created staff: ${staff5.staff_name} (${staff5.position})`);
  console.log(`✅ Created staff: ${staff6.staff_name} (${staff6.position})`);
  console.log(`✅ Created staff: ${staff7.staff_name} (${staff7.position})`);
  console.log(`✅ Created staff: ${staff8.staff_name} (${staff8.position})\n`);

  // ========================================
  // 7. CREATE TRANSACTIONS (Oktober 2025)
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
      dp_amount: null,
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
      dp_amount: null,
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
      dp_amount: null,
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
      dp_amount: null,
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
      dp_amount: null,
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
      dp_amount: null,
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
  // 8. CREATE TRANSACTIONS (November 2025)
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
      dp_amount: null,
      payment_status: "UNPAID",
      packageId: paket12Jam.id,
      armadaId: innova1.id,
      driverId: driver1.id,
    },
  });

  // Transaksi 8: 3 November 2025 (dengan DP)
  const tx8 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-002",
      customer_name: "PT. Berkah Sejahtera",
      customer_phone: "021-77778888",
      booking_date: new Date("2025-11-03"),
      checkout_datetime: new Date("2025-11-03T09:00:00"),
      checkin_datetime: new Date("2025-11-04T09:00:00"), // 24 jam
      all_in_rate: 800000,
      overtime_rate_per_hour: 40000,
      dp_amount: 400000, // DP 50%
      payment_status: "DOWN_PAYMENT",
      packageId: paket24Jam.id,
      armadaId: innova2.id,
      driverId: driver2.id,
    },
  });

  // Transaksi 9: 4 November 2025 (dengan DP)
  const tx9 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-003",
      customer_name: "Keluarga Ibu Ratna",
      customer_phone: "08567891234",
      booking_date: new Date("2025-11-04"),
      checkout_datetime: new Date("2025-11-04T08:00:00"),
      checkin_datetime: new Date("2025-11-04T20:00:00"),
      all_in_rate: 1200000,
      overtime_rate_per_hour: 50000,
      dp_amount: 300000, // DP 25%
      payment_status: "DOWN_PAYMENT",
      packageId: paket12Jam.id,
      armadaId: hiace.id,
      driverId: driver3.id,
    },
  });

  console.log(
    `✅ Created transaction: ${tx7.customer_name} (Rp ${tx7.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx8.customer_name} (Rp ${tx8.all_in_rate.toLocaleString()}, DP: Rp ${tx8.dp_amount.toLocaleString()})`
  );
  console.log(
    `✅ Created transaction: ${tx9.customer_name} (Rp ${tx9.all_in_rate.toLocaleString()}, DP: Rp ${tx9.dp_amount.toLocaleString()})\n`
  );

  // ========================================
  // TOUR PACKAGE TRANSACTIONS
  // ========================================
  console.log("🎯 Creating TOUR_PACKAGE transactions...");

  // Transaksi TOUR_PACKAGE 1: Bali Tour 3 hari - 5 pax
  const txTour1 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-004",
      customer_name: "Rombongan Wisata Bali Indah",
      customer_phone: "08123456789",
      booking_date: new Date("2025-11-05"),
      checkout_datetime: new Date("2025-11-05T06:00:00"),
      checkin_datetime: new Date("2025-11-08T18:00:00"), // 3 hari tour
      all_in_rate: 11000000, // 5 pax × 2.2M (tier 3 bintang, 3-5 pax range)
      overtime_rate_per_hour: 0, // TOUR_PACKAGE tidak ada overtime
      dp_amount: 5500000, // DP 50%
      payment_status: "DOWN_PAYMENT",
      packageId: paketBaliTour.id,
      armadaId: hiace.id, // Hiace untuk rombongan
      driverId: driver1.id,
      pax_count: 5,
    },
  });

  // Transaksi TOUR_PACKAGE 2: Yogyakarta Tour 4 hari - 8 pax
  const txTour2 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-005",
      customer_name: "Keluarga Besar Pak Budi",
      customer_phone: "08234567890",
      booking_date: new Date("2025-11-10"),
      checkout_datetime: new Date("2025-11-10T05:00:00"),
      checkin_datetime: new Date("2025-11-14T20:00:00"), // 4 hari tour
      all_in_rate: 18400000, // 8 pax × 2.3M (tier 3 bintang, 6-10 pax range)
      overtime_rate_per_hour: 0,
      dp_amount: null,
      payment_status: "PAID",
      packageId: paketJogjaTour.id,
      armadaId: hiace.id,
      driverId: driver2.id,
      pax_count: 8,
    },
  });

  // Transaksi TOUR_PACKAGE 3: Bandung Tour 2 hari - 12 pax
  const txTour3 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-006",
      customer_name: "Komunitas Photography Jakarta",
      customer_phone: "08345678901",
      booking_date: new Date("2025-11-15"),
      checkout_datetime: new Date("2025-11-15T07:00:00"),
      checkin_datetime: new Date("2025-11-17T19:00:00"), // 2 hari tour
      all_in_rate: 16800000, // 12 pax × 1.4M (tier 3 bintang, 11-15 pax range)
      overtime_rate_per_hour: 0,
      dp_amount: 8400000, // DP 50%
      payment_status: "DOWN_PAYMENT",
      packageId: paketBandungTour.id,
      armadaId: hiace.id,
      driverId: driver3.id,
      pax_count: 12,
    },
  });

  // Transaksi TOUR_PACKAGE 4: Bali Tour 3 hari - 2 pax (VIP)
  const txTour4 = await prisma.transaction.create({
    data: {
      invoice_code: "INV-2025-11-007",
      customer_name: "Pak Ahmad & Ibu Siti",
      customer_phone: "08456789012",
      booking_date: new Date("2025-11-20"),
      checkout_datetime: new Date("2025-11-20T06:00:00"),
      checkin_datetime: new Date("2025-11-23T18:00:00"), // 3 hari tour
      all_in_rate: 9000000, // 2 pax × 4.5M (tier 5 bintang, 1-2 pax range)
      overtime_rate_per_hour: 0,
      dp_amount: null,
      payment_status: "PAID",
      packageId: paketBaliTour.id,
      armadaId: innova1.id, // Innova untuk couple
      driverId: driver1.id,
      pax_count: 2,
    },
  });

  console.log(
    `✅ Created TOUR_PACKAGE transaction: ${txTour1.customer_name} (Bali 3H, 5 pax, Rp ${txTour1.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created TOUR_PACKAGE transaction: ${txTour2.customer_name} (Yogyakarta 4H, 8 pax, Rp ${txTour2.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created TOUR_PACKAGE transaction: ${txTour3.customer_name} (Bandung 2H, 12 pax, Rp ${txTour3.all_in_rate.toLocaleString()})`
  );
  console.log(
    `✅ Created TOUR_PACKAGE transaction: ${txTour4.customer_name} (Bali 3H VIP, 2 pax, Rp ${txTour4.all_in_rate.toLocaleString()})\n`
  );

  // ========================================
  // 9. CREATE EXPENSES (Oktober 2025)
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
      category: "OPERASIONAL_LAINNYA",
      description: "Sewa kantor bulan Oktober 2025",
      amount: 2000000,
      armadaId: null,
    },
  });

  const exp16 = await prisma.expense.create({
    data: {
      date: new Date("2025-10-15"),
      category: "LISTRIK",
      description: "Listrik dan air bulan Oktober",
      amount: 500000,
      armadaId: null,
    },
  });

  console.log(`✅ Created ${16} expense records for Oktober 2025\n`);

  // ========================================
  // 10. CREATE EXPENSES (November 2025)
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

  const exp19 = await prisma.expense.create({
    data: {
      date: new Date("2025-11-03"),
      category: "BBM",
      description: "BBM untuk B 5678 DEF - PT Berkah Sejahtera",
      amount: 200000,
      armadaId: innova2.id,
    },
  });

  const exp20 = await prisma.expense.create({
    data: {
      date: new Date("2025-11-03"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Ahmad Wijaya - PT Berkah Sejahtera",
      amount: 120000,
      armadaId: innova2.id,
    },
  });

  const exp21 = await prisma.expense.create({
    data: {
      date: new Date("2025-11-04"),
      category: "BBM",
      description: "BBM untuk B 9012 GHI - Keluarga Ibu Ratna",
      amount: 250000,
      armadaId: hiace.id,
    },
  });

  const exp22 = await prisma.expense.create({
    data: {
      date: new Date("2025-11-04"),
      category: "GAJI_SOPIR",
      description: "Gaji sopir Dedi Kurniawan - Keluarga Ibu Ratna",
      amount: 150000,
      armadaId: hiace.id,
    },
  });

  console.log(`✅ Created ${6} expense records for November 2025\n`);

  // ========================================
  // SUMMARY
  // ========================================
  console.log("\n🎉 Database seeding completed successfully!\n");
  console.log("📊 SUMMARY:");
  console.log("─────────────────────────────────────────");
  console.log(`✅ Users created: 2 (1 Admin, 1 Manager)`);
  console.log(`✅ Service packages: 11 (8 CAR_RENTAL + 3 TOUR_PACKAGE)`);
  console.log(`✅ Vehicles (Armada): 4`);
  console.log(`✅ Drivers: 4`);
  console.log(`✅ Staff: 8`);
  console.log(`✅ Transactions Oktober: 6 (all PAID)`);
  console.log(
    `✅ Transactions November: 7 (1 UNPAID, 2 DOWN_PAYMENT, 4 TOUR_PACKAGE)`
  );
  console.log(`✅ Total Transactions: 13`);
  console.log(`✅ Expenses Oktober: 16`);
  console.log(`✅ Expenses November: 6`);
  console.log(`✅ Total Expenses: 22`);
  console.log(`✅ TOUR_PACKAGE Features:`);
  console.log(`   - Bali Tour (3H/2N): 3 hotel tiers, 5+ price ranges each`);
  console.log(
    `   - Yogyakarta Tour (4H/3N): 3 hotel tiers, 5+ price ranges each`
  );
  console.log(`   - Bandung Tour (2H/1N): 3 hotel tiers, 5+ price ranges each`);
  console.log(`   - Complete itineraries with day-by-day activities`);
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

# Pembukuan Kasir & List - Sistem Rental MobilThis is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

✅ **Status:** Production Ready ## Getting Started

🔒 **Security:** Fully Secured with Authentication & Authorization

✅ **Audit:** Critical Issues Fixed (Nov 3, 2025)First, run the development server:

Sistem pembukuan kasir dan list untuk bisnis rental mobil dengan fitur lengkap manajemen transaksi, armada, sopir, paket rental, dan laporan keuangan.```bash

npm run dev

---# or

yarn dev

## 🎯 Recent Updates (November 2025)# or

pnpm dev

### ✅ Critical Fixes Completed# or

- **Fixed:** Duplikasi fungsi perhitungan finansial (inconsistent data)bun dev

- **Fixed:** Bug rekap BBM/Gaji per bulan (aggregate error)```

- **Added:** Date validation di accounting functions

- **Added:** Profit/Loss indicator & profit margin di laporanOpen [http://localhost:3000](http://localhost:3000) with your browser to see the result.

- **Improved:** Data consistency antara frontend dan backend

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

📄 **Detail:** Lihat [CRITICAL_FIXES_COMPLETE.md](./CRITICAL_FIXES_COMPLETE.md)

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

### 🔒 Security Features

- ✅ Complete authentication system dengan JWT## Learn More

- ✅ Role-based access control (Admin/Manager/Operator)

- ✅ API rate limiting & CSRF protectionTo learn more about Next.js, take a look at the following resources:

- ✅ Comprehensive audit logging

- ✅ Security headers & CORS configuration- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.

- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

📄 **Detail:** Lihat [SECURITY.md](./SECURITY.md)

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

---

## Deploy on Vercel

## 🚀 Fitur Utama

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

### 📊 Dashboard

- Overview statistik bisnis real-timeCheck out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

- Grafik pemasukan bulanan
- Status armada (Available, On Trip, Maintenance)
- Ringkasan transaksi hari ini

### 🚗 Manajemen Armada

- CRUD data mobil rental
- Track status armada (Available/On Trip/Maintenance)
- Fuel type & kapasitas
- Upload foto armada

### 👨‍✈️ Manajemen Sopir

- CRUD data sopir
- Status ketersediaan (Available/On Trip)
- Track gaji per transaksi
- Rekap gaji per bulan per sopir

### 📦 Manajemen Paket Rental

- Paket durasi rental (6 jam, 12 jam, 24 jam, custom)
- All-in rate pricing
- Overtime rate per jam
- Hotel count untuk paket tour

### 💰 Transaksi

- Invoice code generation otomatis
- Booking date & rental period tracking
- Checkout & Checkin datetime
- Overtime calculation otomatis
- Real-time financial calculations:
  - Durasi sewa (jam)
  - Overtime (jam)
  - Total overtime fee
  - Total pemasukan
  - Total biaya operasional (BBM + Gaji sopir)
  - Laba kotor
- Print invoice dengan barcode
- Status tracking (Booked/On Trip/Completed/Cancelled)

### 💸 Pengeluaran Kantor

- CRUD pengeluaran operasional kantor
- Kategori pengeluaran
- Track expenses by date
- Include in profit/loss calculation

### 📈 Laporan Keuangan

- **Laporan Transaksi:**
  - Total transaksi
  - Total pemasukan
  - Total pengeluaran ops
  - Total laba kotor
- **Laporan Laba/Rugi:**
  - Total pemasukan sewa
  - Total biaya operasional
  - Total biaya kantor
  - Laba/rugi bersih
  - Status (PROFIT/LOSS)
  - Profit margin (%)
- **Rekap BBM per Bulan per Armada:**
  - Breakdown BBM per mobil per bulan
  - Sorted dari bulan terbaru
- **Rekap Gaji per Bulan per Sopir:**
  - Breakdown gaji per sopir per bulan
  - Sorted dari bulan terbaru

- Filter by date range
- Export to Excel
- Audit trail logging

---

## 🛠️ Tech Stack

- **Framework:** Next.js 16.0.0 (App Router)
- **Database:** PostgreSQL with Prisma ORM
- **UI:** Shadcn/ui + Tailwind CSS
- **Authentication:** JWT with NextAuth.js
- **Charts:** Recharts
- **Date Handling:** date-fns with Indonesian locale
- **Excel Export:** xlsx
- **Icons:** Lucide React
- **Barcode:** react-barcode

---

## 📦 Installation

### Prerequisites

- Node.js 18.x or higher
- PostgreSQL database
- npm or yarn

### Steps

1. **Clone repository:**

```bash
git clone <repository-url>
cd pembukuan-kasir-dan-list
```

2. **Install dependencies:**

```bash
npm install
```

3. **Setup environment variables:**

```bash
cp .env.example .env
```

Edit `.env` dengan konfigurasi Anda:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/pembukuan_kasir"
JWT_SECRET="your-super-secret-jwt-key-min-32-chars"
NEXTAUTH_SECRET="your-nextauth-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NODE_ENV="development"

# Email Configuration (untuk reset password)
EMAIL_HOST="smtp.gmail.com"
EMAIL_PORT="587"
EMAIL_USER="your-email@gmail.com"
EMAIL_PASS="your-app-password"
EMAIL_FROM="noreply@yourdomain.com"
```

4. **Setup database:**

```bash
# Generate Prisma Client
npx prisma generate

# Run migrations
npx prisma migrate dev

# Seed initial data (optional)
npx prisma db seed
```

5. **Run development server:**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## 📂 Project Structure

```
pembukuan-kasir-dan-list/
├── prisma/
│   └── schema.prisma          # Database schema
├── src/
│   ├── app/
│   │   ├── (admin)/           # Protected admin routes
│   │   │   ├── dashboard/
│   │   │   ├── transaksi/
│   │   │   ├── armada/
│   │   │   ├── sopir/
│   │   │   ├── paket/
│   │   │   ├── pengeluaran/
│   │   │   └── laporan/
│   │   ├── api/               # API routes
│   │   │   ├── auth/
│   │   │   ├── transactions/
│   │   │   ├── vehicles/
│   │   │   ├── drivers/
│   │   │   ├── packages/
│   │   │   ├── expenses/
│   │   │   └── reports/
│   │   ├── reset-password/    # Public reset password flow
│   │   └── layout.js
│   ├── components/            # Reusable components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── dashboard/
│   │   ├── transaksi/
│   │   └── ...
│   ├── lib/
│   │   ├── accounting.js     # ✅ Financial calculation logic
│   │   ├── auth.js           # Authentication utilities
│   │   ├── prisma.js         # Prisma client
│   │   ├── middleware.js     # API middleware (auth, rate limit)
│   │   └── utils.js          # Utility functions
│   └── middleware.js          # Next.js middleware (route protection)
├── AUDIT_LOGIKA_AKUNTANSI.md # Audit report akuntansi
├── CRITICAL_FIXES_COMPLETE.md # Summary perbaikan critical
├── SECURITY.md                # Security documentation
└── README.md
```

---

## 🧪 Accounting Logic

### Perhitungan Finansial Transaksi

**Formula:**

```javascript
// 1. Durasi Sewa (jam)
lamaSewaJam = Math.round((checkin_datetime - checkout_datetime) / (1000 * 60 * 60))

// 2. Overtime (jam)
lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam)

// 3. Overtime Fee
totalOvertimeFee = lamaOvertimeJam × overtime_rate_per_hour

// 4. Total Pemasukan
totalPendapatan = all_in_rate + totalOvertimeFee

// 5. Total Biaya Operasional
Catatan: Sejak perubahan terbaru, biaya operasional per transaksi (BBM dan gaji sopir) tidak lagi dicatat. totalBiayaOps pada perhitungan transaksi kini bernilai 0.

// 6. Laba Kotor
labaKotor = totalPendapatan - totalBiayaOps

// 7. Laba Bersih (laporan)
labaRugiBersih = totalPemasukanSewa - totalBiayaOps - totalBiayaKantor
```

**Test Case Example:**

```javascript
Input:
- Checkout: 2024-11-01 08:00
- Checkin: 2024-11-01 20:00
- All-in Rate: Rp 500.000
- Package Duration: 12 jam
- Overtime Rate: Rp 50.000/jam
- Fuel Cost: Rp 100.000
- Driver Fee: Rp 150.000

Output:
- Lama Sewa: 12 jam
- Overtime: 0 jam
- Total Overtime Fee: Rp 0
- Total Pemasukan: Rp 500.000
- Total Biaya Ops: Rp 250.000
- Laba Kotor: Rp 250.000
```

📄 **Detail:** Lihat [AUDIT_LOGIKA_AKUNTANSI.md](./AUDIT_LOGIKA_AKUNTANSI.md) untuk test cases lengkap

---

## 📊 API Endpoints

### Authentication

- `POST /api/auth/register` - Register user baru
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Get current session
- `POST /api/auth/reset-password/request` - Request OTP
- `POST /api/auth/reset-password/verify` - Verify OTP
- `POST /api/auth/reset-password/reset` - Reset password

### Transactions

- `GET /api/transactions` - Get all transactions (with filters)
- `POST /api/transactions` - Create transaction
- `PUT /api/transactions/:id` - Update transaction
- `DELETE /api/transactions/:id` - Delete transaction

### Vehicles (Armada)

- `GET /api/vehicles` - Get all vehicles
- `POST /api/vehicles` - Create vehicle
- `PUT /api/vehicles/:id` - Update vehicle
- `DELETE /api/vehicles/:id` - Delete vehicle

### Drivers (Sopir)

- `GET /api/drivers` - Get all drivers
- `POST /api/drivers` - Create driver
- `PUT /api/drivers/:id` - Update driver
- `DELETE /api/drivers/:id` - Delete driver

### Packages (Paket)

- `GET /api/packages` - Get all packages
- `POST /api/packages` - Create package
- `PUT /api/packages/:id` - Update package
- `DELETE /api/packages/:id` - Delete package

### Expenses (Pengeluaran)

- `GET /api/expenses` - Get all expenses
- `POST /api/expenses` - Create expense
- `PUT /api/expenses/:id` - Update expense
- `DELETE /api/expenses/:id` - Delete expense

### Reports (Laporan)

- `GET /api/reports/summary` - Get financial summary report
  - Query params: `from` (YYYY-MM-DD), `to` (YYYY-MM-DD)
  - Returns: Laporan transaksi, laba/rugi, rekap BBM, rekap gaji

### Dashboard

- `GET /api/dashboard/stats` - Get dashboard statistics

---

## 📝 Documentation

- [SECURITY.md](./SECURITY.md) - Security implementation details
- [AUDIT_LOGIKA_AKUNTANSI.md](./AUDIT_LOGIKA_AKUNTANSI.md) - Audit akuntansi & test cases
- [CRITICAL_FIXES_COMPLETE.md](./CRITICAL_FIXES_COMPLETE.md) - Summary perbaikan critical
- [MIGRATION_COMPLETE_SUMMARY.md](./MIGRATION_COMPLETE_SUMMARY.md) - API migration summary

---

## 🐛 Known Issues & Roadmap

### Completed ✅

- [x] Fix duplikasi fungsi perhitungan
- [x] Fix bug rekap BBM/Gaji per bulan
- [x] Tambah validasi date
- [x] Tambah profit/loss indicator
- [x] Complete authentication system
- [x] API standardization (English naming)
- [x] Folder structure consistency

### Todo 📋

- [ ] Buat login page yang functional
- [ ] Add unit tests untuk accounting functions
- [ ] Diskusikan kebijakan pembulatan jam overtime
- [ ] Add monitoring & alerting

---

**Built with ❤️ using Next.js & Prisma**

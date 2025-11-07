# Laporan Pemasukan (Income Report) Feature

## Overview
Fitur Laporan Pemasukan memungkinkan analisis pendapatan berdasarkan jenis paket jasa yang ditawarkan. Fitur ini menampilkan data pada dashboard dan halaman laporan, serta menyediakan fungsi export untuk pelaporan.

## Deliverables
✅ Membangun API dan UI Laporan Pemasukan yang dapat difilter dan dikelompokkan berdasarkan "Jenis Jasa / Paket Jasa"
✅ Ditampilkan pada dashboard dan halaman laporan
✅ Tersedia fungsi export untuk pelaporan

## Implementation Details

### 1. Database Schema
Menggunakan skema yang sudah ada:
- `ServicePackage` model dengan field `type` (CAR_RENTAL, TOUR_PACKAGE, FULL_DAY_TRIP)
- `Transaction` model dengan relasi ke `ServicePackage` via `packageId`

### 2. API Endpoints

#### GET /api/reports/income
**Parameters:**
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)
- `packageType` (optional): Filter by package type (CAR_RENTAL, TOUR_PACKAGE, FULL_DAY_TRIP)

**Response:**
```json
{
  "success": true,
  "data": {
    "summary": {
      "totalPackages": 8,
      "totalTransactions": 15,
      "totalRevenue": 15000000,
      "totalOvertimeRevenue": 500000,
      "totalBaseRevenue": 14500000,
      "averageRevenuePerPackage": 1875000
    },
    "incomeByPackage": [
      {
        "packageId": "uuid",
        "packageName": "Sewa Mobil 12 Jam",
        "packageType": "CAR_RENTAL",
        "transactionCount": 5,
        "totalRevenue": 5000000,
        "totalOvertimeRevenue": 200000,
        "totalBaseRevenue": 4800000,
        "averageRevenue": 1000000,
        "transactions": [...]
      }
    ]
  }
}
```

#### GET /api/reports/income/export
**Parameters:**
- `from`, `to`, `packageType` (same as above)
- `format`: Export format (csv)

**Response:** CSV file download

### 3. UI Components

#### LaporanPemasukanTab.jsx
Komponen utama untuk halaman laporan pemasukan dengan:
- Filter berdasarkan jenis paket
- Summary cards (Total Paket, Total Transaksi, Total Pemasukan, Rata-rata/Paket)
- Tabel breakdown per paket jasa dengan collapsible transaction details
- Tombol export

#### TopPackagesWidget.jsx
Widget untuk dashboard menampilkan:
- Top 5 paket dengan pendapatan tertinggi
- Summary total paket dan pemasukan
- Badge jenis paket dengan warna berbeda

### 4. Dashboard Integration
- Menambahkan `TopPackagesWidget` ke dashboard
- Update API `/api/dashboard/stats` untuk include data top packages
- Widget menampilkan paket terlaris dengan pendapatan

### 5. Laporan Page Integration
- Menambahkan tab "Laporan Pemasukan" ke halaman laporan
- Update grid layout dari 3 kolom menjadi 4 kolom
- Fetch data dari API income report

### 6. Export Functionality
- CSV export dengan struktur:
  - Summary per paket (Jenis, Nama, Jumlah Transaksi, Total Pemasukan, dll)
  - Detail transaksi per paket (Invoice, Pelanggan, Tanggal, Armada, Sopir, Tarif Dasar, Overtime, Total)

## File Changes

### New Files Created:
1. `src/app/api/reports/income/route.js` - API endpoint untuk laporan pemasukan
2. `src/app/api/reports/income/export/route.js` - API endpoint untuk export CSV
3. `src/components/laporan/LaporanPemasukanTab.jsx` - Komponen UI utama
4. `src/components/dashboard/TopPackagesWidget.jsx` - Widget dashboard

### Modified Files:
1. `src/app/(admin)/laporan/page.jsx` - Tambah tab dan fetch data income
2. `src/app/(admin)/dashboard/page.jsx` - Tambah TopPackagesWidget
3. `src/app/api/dashboard/stats/route.js` - Tambah data top packages

## Features

### Filtering & Grouping
- Filter berdasarkan jenis paket jasa (Sewa Mobil, Paket Wisata, Trip Sehari Penuh)
- Grouping otomatis berdasarkan nama paket
- Sorting berdasarkan total pendapatan (descending)

### Analytics
- Total pemasukan per paket
- Breakdown tarif dasar vs overtime
- Rata-rata pendapatan per transaksi
- Persentase kontribusi per paket terhadap total pemasukan

### Export
- CSV format dengan summary dan detail lengkap
- Nama file otomatis dengan range tanggal dan filter
- Include semua transaksi detail per paket

## Testing
- ✅ Build berhasil tanpa error
- ✅ API endpoints terdaftar di Next.js routing
- ✅ Database memiliki data transaksi dengan paket
- ✅ Komponen UI terintegrasi dengan state management
- ✅ Export functionality siap untuk testing manual

## Usage
1. Akses halaman Laporan → tab "Laporan Pemasukan"
2. Pilih range tanggal menggunakan filter
3. Filter berdasarkan jenis paket (opsional)
4. Klik "Export" untuk download CSV
5. Lihat widget "Paket Terlaris" di dashboard untuk overview cepat

## Security
- Hanya ADMIN dan MANAGER yang dapat mengakses
- Rate limiting diterapkan
- Audit logging untuk setiap akses laporan
- Authentication required untuk semua endpoints
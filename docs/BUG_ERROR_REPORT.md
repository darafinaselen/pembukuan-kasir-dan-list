# Laporan Bug dan Error

## Ringkasan

Dokumen ini merinci bug, potensi error, dan masalah integritas data yang ditemukan selama peninjauan kode aplikasi. Setiap masalah dikategorikan berdasarkan fitur, dengan deskripsi terperinci, analisis dampak, dan saran perbaikan.

## Daftar Isi

1.  [Skema Basis Data](#skema-basis-data)
2.  [Manajemen Transaksi - Backend](#manajemen-transaksi---backend)
3.  [Manajemen Transaksi - Frontend](#manajemen-transaksi---frontend)

## Skema Basis Data

### 1. Status Driver Tidak Lengkap

**Deskripsi:**
Enum `DriverStatus` saat ini hanya memiliki status `READY`, `ON_TRIP`, dan `OFF_DUTY`. Status ini tidak mencakup kasus di mana seorang pengemudi dijadwalkan untuk pekerjaan di masa mendatang tetapi saat ini tidak sedang dalam perjalanan.

**Dampak:**
Hal ini menyebabkan logika bisnis yang tidak akurat, di mana pengemudi yang dipesan untuk pekerjaan di masa mendatang secara keliru ditandai sebagai `ON_TRIP`. Hal ini dapat menyebabkan kebingungan dalam penjadwalannya dan dapat mengakibatkan pemesanan ganda jika tidak ditangani dengan benar.

**Saran:**
Tambahkan status `BOOKED` ke enum `DriverStatus` di `prisma/schema.prisma`.

```prisma
enum DriverStatus {
  READY
  BOOKED // Tambahkan status ini
  ON_TRIP
  OFF_DUTY
}
```

### 2. Kategori Pengeluaran Berbasis String

**Deskripsi:**
Model `Expense` menggunakan tipe `String` untuk bidang `category`. Hal ini memungkinkan nilai kategori yang berubah-ubah dan tidak konsisten.

**Dampak:**
Tantangan dalam pelaporan dan analisis data karena potensi kesalahan ketik atau variasi dalam nama kategori (misalnya, "Servis" vs. "servis" vs. "Perbaikan"). Hal ini juga mempersulit penerapan logika bisnis khusus berdasarkan kategori.

**Saran:**
Ganti bidang `category` dengan `ExpenseCategory` enum untuk memastikan konsistensi data.

```prisma
enum ExpenseCategory {
  SERVICE
  OFFICE_SUPPLIES
  ADMIN_SALARY
  INCENTIVE_BONUS
  // Tambahkan kategori lain yang relevan
}

model Expense {
  // ...
  category ExpenseCategory
  // ...
}
```

## Manajemen Transaksi - Backend

### 1. Kondisi Balapan (Race Condition) saat Membuat & Memperbarui Transaksi

**Deskripsi:**
Endpoint `POST /api/transactions` dan `PUT /api/transactions/[id]` mengubah status armada dan pengemudi tanpa terlebih dahulu memverifikasi ketersediaannya dalam transaksi atomik. Jika dua permintaan tiba secara bersamaan untuk armada atau pengemudi yang sama, keduanya dapat berhasil memvalidasi dan membuat pemesanan, yang mengakibatkan konflik.

**Dampak:**
**Kritis.** Bug ini dapat menyebabkan pemesanan ganda untuk armada dan pengemudi yang sama, merusak integritas data inti dan menyebabkan masalah operasional yang signifikan.

**Saran:**
Lakukan operasi pengecekan dan pembaruan dalam satu transaksi basis data (`prisma.$transaction`). Sebelum membuat atau memperbarui transaksi, periksa apakah status armada dan pengemudi masih `READY`. Jika tidak, batalkan transaksi dan kembalikan pesan kesalahan.

**Contoh Solusi (untuk Pembuatan):**
```javascript
// Di dalam handleCreateTransaction

// ... (sebelum prisma.$transaction)

try {
  const result = await prisma.$transaction(async (tx) => {
    // 1. Kunci dan verifikasi ketersediaan armada
    const armada = await tx.armada.findFirst({
      where: {
        id: body.armadaId,
        status: 'READY',
      },
    });

    if (!armada) {
      throw new Error('Armada tidak tersedia atau tidak ditemukan.');
    }

    // 2. Kunci dan verifikasi ketersediaan pengemudi
    const driver = await tx.driver.findFirst({
      where: {
        id: body.driverId,
        status: 'READY',
      },
    });

    if (!driver) {
      throw new Error('Sopir tidak tersedia atau tidak ditemukan.');
    }

    // 3. Tentukan status baru berdasarkan tanggal
    const isStartingTodayOrPast = new Date(body.checkout_datetime) <= new Date();
    const newArmadaStatus = isStartingTodayOrPast ? 'ON_TRIP' : 'BOOKED';
    const newDriverStatus = isStartingTodayOrPast ? 'ON_TRIP' : 'BOOKED'; // Gunakan logika yang benar

    // 4. Buat transaksi
    const newTransaction = await tx.transaction.create({
      data: { /* ... data transaksi ... */ },
    });

    // 5. Perbarui status armada
    await tx.armada.update({
      where: { id: body.armadaId },
      data: { status: newArmadaStatus },
    });

    // 6. Perbarui status pengemudi
    await tx.driver.update({
      where: { id: body.driverId },
      data: { status: newDriverStatus },
    });

    return newTransaction;
  });

  // ... (lanjutkan dengan log audit dan respons sukses)

} catch (error) {
  if (error.message.includes('tidak tersedia')) {
    return errorResponse(error.message, 409); // 409 Conflict
  }
  // ... (penanganan kesalahan lainnya)
}
```

### 2. Logika Status Tidak Konsisten

**Deskripsi:**
Saat ini, status pengemudi selalu diatur ke `ON_TRIP`, bahkan untuk pemesanan di masa mendatang. Selain itu, enum `DriverStatus` tidak memiliki status `BOOKED`, yang menyebabkan ketidakakuratan ini.

**Dampak:**
**Sedang.** Data status tidak akurat, yang dapat membingungkan staf operasional saat melihat ketersediaan pengemudi. Hal ini mengurangi keandalan dasbor dan dapat menyebabkan kesalahan penjadwalan manual.

**Saran:**
Setelah menambahkan status `BOOKED` ke `DriverStatus` enum, perbarui logika backend untuk menetapkan status dengan benar berdasarkan `checkout_datetime`.

**Contoh Solusi:**
```javascript
// Di dalam handleCreateTransaction dan handleUpdateTransaction

const isStartingTodayOrPast = new Date(body.checkout_datetime) <= new Date();
const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
// Logika yang diperbaiki untuk status pengemudi
const driverStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";

// Gunakan variabel `armadaStatus` dan `driverStatus` saat memperbarui
// status di dalam prisma.armada.update dan prisma.driver.update
```

### 3. Pembuatan Kode Faktur Tidak Kuat

**Deskripsi:**
`invoice_code` dihasilkan menggunakan `RLM-${yyyymmdd}-${timestamp_terakhir_5_digit}`. Di bawah beban tinggi atau jika beberapa server berjalan secara bersamaan, ada kemungkinan kecil stempel waktu dapat bertabrakan, yang menyebabkan kesalahan basis data `P2002` (pelanggaran batasan unik).

**Dampak:**
**Rendah.** Kegagalan sporadis dalam pembuatan transaksi, yang dapat membuat pengguna frustrasi. Peluang terjadinya rendah tetapi meningkat seiring skala aplikasi.

**Saran:**
Gunakan pustaka yang dirancang untuk ID yang unik dan tahan tabrakan seperti `nanoid` atau `cuid` untuk membuat akhiran yang lebih acak.

**Contoh Solusi (menggunakan `nanoid`):**
```javascript
import { nanoid } from 'nanoid';

// ...

const date = new Date();
const yyyymmdd = date.toISOString().slice(0, 10).replace(/-/g, "");
const uniqueSuffix = nanoid(6).toUpperCase(); // Menghasilkan string acak 6 karakter
const invoice_code = `RLM-${yyyymmdd}-${uniqueSuffix}`;
```

### 4. Kurangnya Validasi Input Sisi Server

**Deskripsi:**
Endpoint API tidak memvalidasi tipe data, format, atau batasan dari data yang masuk (misalnya, `customer_name` tidak boleh kosong, `all_in_rate` harus berupa angka positif).

**Dampak:**
**Tinggi.** Tanpa validasi, data yang salah format atau berbahaya dapat disimpan di basis data. Hal ini dapat menyebabkan kerusakan data, bug yang tidak terduga di seluruh aplikasi (misalnya, kesalahan rendering di frontend), dan potensi kerentanan keamanan.

**Saran:**
Terapkan validasi skema yang ketat menggunakan pustaka seperti `zod`. Tentukan skema untuk setiap payload permintaan dan validasi badan permintaan terhadapnya sebelum melanjutkan.

**Contoh Solusi (menggunakan `zod`):**
```javascript
// src/lib/validators/transaction-validator.js
import { z } from 'zod';

export const createTransactionSchema = z.object({
  customer_name: z.string().min(1, "Nama pelanggan wajib diisi"),
  customer_phone: z.string().min(10, "Nomor telepon tidak valid"),
  booking_date: z.string().datetime(),
  checkout_datetime: z.string().datetime(),
  checkin_datetime: z.string().datetime(),
  all_in_rate: z.number().positive("Tarif harus angka positif"),
  // ... definisikan validasi untuk semua bidang lainnya
  armadaId: z.string().uuid("ID Armada tidak valid"),
  driverId: z.string().uuid("ID Sopir tidak valid"),
});

// Di dalam src/app/api/transactions/route.js
import { createTransactionSchema } from '@/lib/validators/transaction-validator';

async function handleCreateTransaction(request) {
  try {
    const body = await request.json();
    const validation = createTransactionSchema.safeParse(body);

    if (!validation.success) {
      return errorResponse(validation.error.errors, 400);
    }
    
    const validatedData = validation.data;
    // Gunakan `validatedData` untuk sisa fungsi

    // ...
  } catch (error) {
     // ...
  }
}
```

## Manajemen Transaksi - Frontend

### 1. Penanganan Kesalahan yang Tidak Memadai di Dasbor

**Deskripsi:**
Komponen `DashboardPage` (`src/app/(admin)/dashboard/page.jsx`) menangani kegagalan pengambilan data dengan mencatat kesalahan ke konsol dan mengatur status menjadi `null`. Ini tidak memberikan umpan balik visual yang jelas kepada pengguna bahwa telah terjadi kesalahan.

**Dampak:**
**Rendah.** Pengguna dibiarkan dengan widget dasbor yang kosong atau dalam keadaan memuat tanpa penjelasan, yang dapat disalahartikan sebagai tidak ada data. Ini menciptakan pengalaman pengguna yang membingungkan dan membuat proses debug menjadi lebih sulit bagi pengguna non-teknis.

**Saran:**
Perbarui komponen untuk mengelola status kesalahan secara eksplisit. Jika terjadi kesalahan API, tampilkan pesan kesalahan yang mudah dipahami kepada pengguna, idealnya dengan opsi untuk mencoba lagi. Ini dapat dilakukan dengan menambahkan status `error` dan menampilkannya secara kondisional di UI.

**Contoh Solusi:**
```jsx
// Di dalam DashboardPage component

const [stats, setStats] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null); // Tambahkan status kesalahan

const fetchDashboardData = async () => {
  setLoading(true);
  setError(null); // Reset kesalahan pada setiap pengambilan baru
  try {
    const res = await authFetch(`/api/dashboard/stats?period=${period}`);
    if (!res) return;
    if (!res.ok) {
      throw new Error(`Gagal mengambil data: ${res.statusText}`);
    }
    const result = await res.json();
    setStats(result.data || result);
  } catch (err) {
    console.error("Error fetching dashboard data:", err);
    setError(err.message || "Terjadi kesalahan yang tidak diketahui.");
    setStats(null);
  } finally {
    setLoading(false);
  }
};

// Di dalam JSX:
return (
  // ...
  <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
    {error ? (
      <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600 font-semibold">Gagal memuat data dasbor</p>
        <p className="text-sm text-gray-600 mt-2">{error}</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          Coba Lagi
        </Button>
      </div>
    ) : (
      <>
        {/* Render semua komponen dasbor seperti sebelumnya */}
        <DashboardStats stats={stats} loading={loading} />
        {/* ... chart lainnya ... */}
      </>
    )}
  </div>
  // ...
);
```

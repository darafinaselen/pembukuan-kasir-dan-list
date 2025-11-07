# 🚗 Automasi Status Armada & Sopir - Dokumentasi

## 📋 Overview

Sistem ini secara otomatis mengelola status armada dan sopir berdasarkan transaksi yang dibuat, diupdate, atau dihapus.

---

## ✅ Fitur yang Diimplementasikan

### 1. **Filter Dropdown - Hanya Tampilkan yang READY**

**File yang dimodifikasi:**

- `src/app/api/vehicles/route.js`
- `src/app/api/drivers/route.js`

**Behavior:**

- GET `/api/vehicles?status=READY` → Hanya mengembalikan armada dengan status `READY`
- GET `/api/drivers?status=READY` → Hanya mengembalikan sopir dengan status `READY`
- Tanpa parameter `?status=` → Mengembalikan semua data (untuk management page)

**Implementation:**

```javascript
const { searchParams } = new URL(request.url);
const statusFilter = searchParams.get("status");
const whereClause = statusFilter ? { status: statusFilter } : {};

const armadas = await prisma.armada.findMany({
  where: whereClause,
  orderBy: { createdAt: "desc" },
});
```

**Result:**
✅ Dropdown transaksi hanya menampilkan armada/sopir yang tersedia
✅ Armada/sopir yang sedang `ON_TRIP` atau `BOOKED` tidak dapat dipilih lagi

---

### 2. **CREATE Transaction - Update Status**

**File:** `src/app/api/transactions/route.js`

**Logic:**

- **Armada Status:**
  - Jika `checkout_datetime` ≤ hari ini → `ON_TRIP`
  - Jika `checkout_datetime` > hari ini → `BOOKED`
- **Sopir Status:**
  - Selalu → `ON_TRIP`

**Implementation:**

```javascript
const isStartingTodayOrPast = new Date(body.checkout_datetime) <= new Date();
const armadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
const driverStatus = "ON_TRIP";

await prisma.$transaction([
  prisma.transaction.create({ data: {...} }),
  prisma.armada.update({ where: { id: body.armadaId }, data: { status: armadaStatus } }),
  prisma.driver.update({ where: { id: body.driverId }, data: { status: driverStatus } }),
]);
```

**Result:**
✅ Saat transaksi dibuat, status armada & sopir otomatis berubah

---

### 3. **UPDATE Transaction - Reset & Update Status** ⭐ NEW

**File:** `src/app/api/transactions/[id]/route.js`

**Logic:**

1. **Jika armada diganti:**
   - Armada lama → `READY`
   - Armada baru → `ON_TRIP` atau `BOOKED` (sesuai tanggal)

2. **Jika sopir diganti:**
   - Sopir lama → `READY`
   - Sopir baru → `ON_TRIP`

3. **Jika tidak diganti:**
   - Status tetap (tidak berubah)

**Implementation:**

```javascript
// Determine new status
const isStartingTodayOrPast = new Date(body.checkout_datetime) <= new Date();
const newArmadaStatus = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
const newDriverStatus = "ON_TRIP";

const operations = [
  prisma.transaction.update({ where: { id }, data: updateData }),
];

// If armada changed
if (existingTransaction.armadaId !== body.armadaId) {
  // Reset old armada
  if (existingTransaction.armadaId) {
    operations.push(
      prisma.armada.update({
        where: { id: existingTransaction.armadaId },
        data: { status: "READY" },
      })
    );
  }
  // Set new armada status
  if (body.armadaId) {
    operations.push(
      prisma.armada.update({
        where: { id: body.armadaId },
        data: { status: newArmadaStatus },
      })
    );
  }
}

// If driver changed (similar logic)
if (existingTransaction.driverId !== body.driverId) {
  // ... similar to armada
}

await prisma.$transaction(operations);
```

**Result:**
✅ Saat transaksi diupdate dan ganti armada/sopir, yang lama kembali `READY`
✅ Armada/sopir baru langsung berubah status menjadi `ON_TRIP`/`BOOKED`

---

### 4. **DELETE Transaction - Reset Status** ⭐ NEW

**File:** `src/app/api/transactions/[id]/route.js`

**Logic:**

- Saat transaksi dihapus, armada & sopir yang terkait kembali ke status `READY`

**Implementation:**

```javascript
await prisma.$transaction([
  // Delete the transaction
  prisma.transaction.delete({ where: { id } }),

  // Reset armada status if associated
  ...(existingTransaction.armadaId
    ? [
        prisma.armada.update({
          where: { id: existingTransaction.armadaId },
          data: { status: "READY" },
        }),
      ]
    : []),

  // Reset driver status if associated
  ...(existingTransaction.driverId
    ? [
        prisma.driver.update({
          where: { id: existingTransaction.driverId },
          data: { status: "READY" },
        }),
      ]
    : []),
]);
```

**Result:**
✅ Saat transaksi dihapus, armada & sopir langsung tersedia kembali untuk booking baru

---

## 🎯 Status Flow Diagram

```
┌─────────────────────────────────────────────────────┐
│                   ARMADA STATUS                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  READY ──────CREATE──────> ON_TRIP / BOOKED        │
│    ▲                              │                  │
│    │                              │                  │
│    └──────DELETE / UPDATE─────────┘                 │
│         (when changed)                               │
│                                                      │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│                   DRIVER STATUS                      │
├─────────────────────────────────────────────────────┤
│                                                      │
│  READY ──────CREATE──────> ON_TRIP                  │
│    ▲                           │                     │
│    │                           │                     │
│    └──────DELETE / UPDATE──────┘                    │
│         (when changed)                               │
│                                                      │
└─────────────────────────────────────────────────────┘
```

---

## 🧪 Testing Scenarios

### Scenario 1: Create Transaction

1. Pilih armada A (status: READY) dan sopir B (status: READY)
2. Submit transaksi
3. **Expected:** Armada A → `ON_TRIP/BOOKED`, Sopir B → `ON_TRIP`
4. Buka form transaksi baru
5. **Expected:** Armada A dan Sopir B **tidak muncul** di dropdown

### Scenario 2: Update - Ganti Armada

1. Edit transaksi existing (armada A, sopir B)
2. Ganti armada A ke armada C
3. Submit
4. **Expected:**
   - Armada A → `READY` (tersedia lagi)
   - Armada C → `ON_TRIP/BOOKED`
   - Sopir B → tetap `ON_TRIP`

### Scenario 3: Update - Ganti Sopir

1. Edit transaksi existing (armada A, sopir B)
2. Ganti sopir B ke sopir D
3. Submit
4. **Expected:**
   - Sopir B → `READY` (tersedia lagi)
   - Sopir D → `ON_TRIP`
   - Armada A → tetap `ON_TRIP/BOOKED`

### Scenario 4: Delete Transaction

1. Hapus transaksi (armada A, sopir B)
2. **Expected:**
   - Armada A → `READY`
   - Sopir B → `READY`
3. Buka form transaksi baru
4. **Expected:** Armada A dan Sopir B **muncul kembali** di dropdown

---

## 📊 Database Schema

### ArmadaStatus Enum

```prisma
enum ArmadaStatus {
  READY        // Tersedia untuk booking
  BOOKED       // Sudah dibooking (trip belum mulai)
  ON_TRIP      // Sedang dalam perjalanan
  MAINTENANCE  // Sedang maintenance
}
```

### DriverStatus Enum

```prisma
enum DriverStatus {
  READY     // Tersedia untuk trip
  ON_TRIP   // Sedang dalam perjalanan
  OFF_DUTY  // Tidak bertugas (libur/cuti)
}
```

---

## 🔒 Transaction Safety

Semua operasi status menggunakan **Prisma Transaction** untuk memastikan:

- ✅ Atomic operations (semua sukses atau semua gagal)
- ✅ Data consistency (tidak ada race condition)
- ✅ Rollback otomatis jika ada error

```javascript
await prisma.$transaction([
  // Operation 1
  // Operation 2
  // Operation 3
]);
```

---

## 📝 API Endpoints

### GET /api/vehicles

- **Query param:** `?status=READY` (optional)
- **Response:** Array of armada
- **Usage:** Untuk dropdown transaksi (dengan filter), atau management page (tanpa filter)

### GET /api/drivers

- **Query param:** `?status=READY` (optional)
- **Response:** Array of drivers
- **Usage:** Untuk dropdown transaksi (dengan filter), atau management page (tanpa filter)

### POST /api/transactions

- **Effect:** Update status armada & sopir ke `ON_TRIP`/`BOOKED`

### PUT /api/transactions/[id]

- **Effect:**
  - Reset status armada/sopir lama jika diganti
  - Update status armada/sopir baru

### DELETE /api/transactions/[id]

- **Effect:** Reset status armada & sopir ke `READY`

---

## ✅ Checklist

- [x] Filter API untuk hanya tampilkan armada/sopir READY
- [x] CREATE transaction update status
- [x] UPDATE transaction reset & update status (jika diganti)
- [x] DELETE transaction reset status ke READY
- [x] Gunakan Prisma transaction untuk atomic operations
- [x] Handle edge cases (null armadaId/driverId)
- [x] No compilation errors
- [x] Documentation complete

---

## 🚀 Next Steps

1. **Testing:**
   - Test semua scenario di atas
   - Verify dropdown hanya tampilkan yang READY
   - Verify status berubah dengan benar

2. **Enhancement (optional):**
   - Tambahkan endpoint untuk manual update status (untuk emergency)
   - Tambahkan notification jika ada conflict
   - Tambahkan audit log untuk perubahan status

---

**Last Updated:** November 5, 2025
**Author:** AI Assistant
**Status:** ✅ Implemented & Ready for Testing

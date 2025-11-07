# 🚗 Fitur Akurasi Waktu Mobil In & Manajemen Overtime

## 📋 Overview

Fitur ini memungkinkan Operator untuk mencatat waktu mobil kembali yang sebenarnya dan menghitung biaya overtime secara akurat saat menyelesaikan transaksi.

---

## ✅ Fitur yang Diimplementasikan

### 1. **Database Schema Updates**

**File:** `prisma/schema.prisma`

**Fields baru ditambahkan:**

```prisma
model Transaction {
  // ... existing fields ...

  // Data Aktual (diisi saat transaksi selesai)
  actual_checkin_datetime DateTime? // Waktu mobil kembali yang sebenarnya
  actual_overtime_cost    Int? // Biaya overtime yang dikenakan
}
```

**Migration:** `20251107040000_add_actual_checkin_and_overtime_cost`

---

### 2. **Tombol "Selesaikan Transaksi"**

**File:** `src/components/transaksi/TransaksiTable.jsx`

**Perubahan:**

- ✅ Import `CheckCircle` icon dari lucide-react
- ✅ Tambah prop `onCompleteTransaction` ke function signature
- ✅ Tambah menu item "Selesaikan Transaksi" di dropdown mobile
- ✅ Tambah tombol "Selesai" dengan icon CheckCircle di desktop view

**UI Changes:**

```jsx
// Mobile dropdown
<DropdownMenuItem onClick={() => onCompleteTransaction(item)}>
  <CheckCircle className="mr-2 h-4 w-4" />
  Selesaikan Transaksi
</DropdownMenuItem>

// Desktop button
<Button onClick={() => onCompleteTransaction(item)} className="text-green-600">
  <CheckCircle className="mr-1 h-3 w-3" /> Selesai
</Button>
```

---

### 3. **Modal Selesaikan Transaksi**

**File:** `src/components/transaksi/TransaksiCompleteModal.jsx`

**Fitur lengkap:**

- ✅ **Informasi Transaksi:** Invoice, pelanggan, armada, sopir
- ✅ **Waktu Mobil:** Checkout (keluar), estimasi checkin, input aktual checkin
- ✅ **Perhitungan Overtime Otomatis:**
  - Durasi paket (default 12 jam)
  - Total durasi aktual berdasarkan input waktu kembali
  - Overtime hours = max(0, total_durasi - durasi_paket)
  - Biaya overtime = overtime_hours × rate_per_hour
- ✅ **Ringkasan Pembayaran:** Tarif dasar + biaya overtime = total tagihan
- ✅ **Validasi:** Waktu kembali harus diisi

**Logic Perhitungan:**

```javascript
const calculateOvertime = (checkinTime) => {
  const checkoutTime = new Date(transaction.checkout_datetime);
  const actualCheckin = new Date(checkinTime);

  if (actualCheckin <= checkoutTime) return;

  const diffMs = actualCheckin.getTime() - checkoutTime.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);

  const packageDuration = transaction.package?.durationHours || 12;
  const overtimeHours = Math.max(0, diffHours - packageDuration);
  const calculatedCost = Math.round(
    overtimeHours * transaction.overtime_rate_per_hour
  );

  setCalculatedOvertimeHours(overtimeHours);
  setOvertimeCost(calculatedCost);
};
```

---

### 4. **API Endpoint Complete Transaction**

**File:** `src/app/api/transactions/[id]/complete/route.js`

**Fitur:**

- ✅ **Validasi:** Cek permission, transaksi exists, belum pernah diselesaikan
- ✅ **Update Data:** Set `actual_checkin_datetime` dan `actual_overtime_cost`
- ✅ **Reset Status:** Armada & sopir kembali ke status `READY`
- ✅ **Audit Log:** Catat event "COMPLETE" dengan detail perubahan
- ✅ **Transaction Safety:** Gunakan Prisma transaction untuk atomic operations

**Logic:**

```javascript
await prisma.$transaction([
  // Update transaction
  prisma.transaction.update({
    where: { id },
    data: {
      actual_checkin_datetime: new Date(actual_checkin_datetime),
      actual_overtime_cost: actual_overtime_cost || 0,
    },
  }),

  // Reset armada status
  prisma.armada.update({
    where: { id: existingTransaction.armadaId },
    data: { status: "READY" },
  }),

  // Reset driver status
  prisma.driver.update({
    where: { id: existingTransaction.driverId },
    data: { status: "READY" },
  }),
]);
```

---

### 5. **Integration di Page Level**

**File:** `src/app/(admin)/transaksi/page.jsx`

**Perubahan:**

- ✅ Import `TransaksiCompleteModal`
- ✅ State management: `isCompleteOpen`, `completingData`
- ✅ Handler: `openCompleteDialog()`, `handleCompleteTransaction()`
- ✅ Props: Pass `onCompleteTransaction` ke `TransaksiTable`
- ✅ Render: Tambah `TransaksiCompleteModal` component

**Handler Logic:**

```javascript
const handleCompleteTransaction = async (completionData) => {
  const res = await fetch(`/api/transactions/${completingData.id}/complete`, {
    method: "PUT",
    body: JSON.stringify(completionData),
  });

  // Update UI, show toast, refresh data
};
```

---

### 6. **Form Transaksi - Field Jam Pulang**

**Status:** ✅ **SUDAH ADA** (tidak perlu perubahan)

**File:** `src/components/transaksi/TransaksiDialog.jsx`

Field `checkin_datetime` sudah dapat diedit manual oleh Operator saat membuat/mengedit transaksi.

---

## 🎯 Flow Penggunaan

### **Scenario 1: Input Transaksi Baru**

1. Operator buat transaksi dengan estimasi waktu kembali
2. Armada & sopir otomatis status `ON_TRIP`/`BOOKED`
3. Transaksi berjalan sesuai jadwal

### **Scenario 2: Selesaikan Transaksi**

1. Klik tombol "Selesaikan Transaksi" (hijau dengan icon CheckCircle)
2. Modal terbuka dengan informasi lengkap transaksi
3. Input waktu mobil kembali yang sebenarnya
4. Sistem otomatis hitung overtime berdasarkan:
   - Durasi aktual = waktu_kembali - waktu_keluar
   - Overtime = max(0, durasi_aktual - durasi_paket)
   - Biaya overtime = overtime × rate_per_jam
5. Operator bisa edit biaya overtime jika perlu
6. Klik "Selesaikan Transaksi"
7. Armada & sopir otomatis kembali status `READY`
8. Data tersimpan dengan waktu aktual dan biaya overtime

---

## 📊 Data Structure

### **Transaction Model (Updated)**

```javascript
{
  id: "uuid",
  invoice_code: "RLM-20251107-12345",
  customer_name: "John Doe",
  checkout_datetime: "2025-11-07T08:00:00Z", // Waktu keluar
  checkin_datetime: "2025-11-07T20:00:00Z",   // Estimasi kembali
  actual_checkin_datetime: "2025-11-07T22:30:00Z", // Waktu kembali aktual
  actual_overtime_cost: 150000, // Biaya overtime
  overtime_rate_per_hour: 50000,
  // ... other fields
}
```

### **Status Changes**

```
BEFORE: Armada (ON_TRIP) + Sopir (ON_TRIP)
AFTER:  Armada (READY) + Sopir (READY)
```

---

## 🧪 Testing Checklist

### **Functional Testing**

- [ ] Tombol "Selesaikan Transaksi" muncul di tabel
- [ ] Modal terbuka dengan data transaksi lengkap
- [ ] Input waktu kembali memicu perhitungan otomatis
- [ ] Biaya overtime dapat diedit manual
- [ ] Submit berhasil update database
- [ ] Armada & sopir status kembali ke READY
- [ ] Toast notification tampil
- [ ] Data refresh otomatis

### **Edge Cases**

- [ ] Transaksi sudah pernah diselesaikan (should reject)
- [ ] Waktu kembali sebelum waktu keluar (overtime = 0)
- [ ] Input waktu kosong (validation error)
- [ ] Rate per jam = 0 (overtime cost = 0)
- [ ] Network error saat submit

### **UI/UX Testing**

- [ ] Modal responsive di mobile & desktop
- [ ] Loading state saat submit
- [ ] Error handling dengan toast
- [ ] Form validation feedback

---

## 🔒 Security & Validation

### **API Security**

- ✅ Protected route dengan authentication
- ✅ Permission check untuk update transaction
- ✅ Input validation (required fields)
- ✅ Transaction safety dengan Prisma transaction

### **Business Logic Validation**

- ✅ Prevent double completion
- ✅ Automatic status reset
- ✅ Audit logging untuk tracking

---

## 📈 Benefits

### **Operational Benefits**

- ✅ **Akurasi Waktu:** Catat waktu kembali yang sebenarnya, bukan estimasi
- ✅ **Overtime Management:** Hitung biaya overtime secara akurat
- ✅ **Resource Availability:** Armada & sopir langsung tersedia setelah selesai
- ✅ **Financial Accuracy:** Total tagihan mencerminkan penggunaan aktual

### **User Experience**

- ✅ **Intuitive UI:** Tombol hijau dengan icon jelas
- ✅ **Auto Calculation:** Overtime dihitung otomatis
- ✅ **Flexible Input:** Biaya overtime dapat diadjust manual
- ✅ **Real-time Feedback:** Perhitungan langsung terupdate

---

## 🚀 Future Enhancements

### **Phase 2 Possibilities**

- **Notification System:** Alert saat transaksi melebihi estimasi
- **Reporting:** Laporan overtime per armada/sopir
- **Analytics:** Trend overtime untuk optimasi pricing
- **Mobile App:** Input waktu kembali via mobile app

---

**Last Updated:** November 7, 2025
**Status:** ✅ **COMPLETED & READY FOR TESTING**
**Files Modified:** 6 files
**New Features:** 1 complete workflow
**Database Changes:** 2 new fields + 1 migration

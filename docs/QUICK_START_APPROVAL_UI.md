# ✅ UI Approval Workflow - Quick Start Guide

## 🚀 Testing Langsung

### 1. Start Development Server

```bash
npm run dev
```

Server akan berjalan di: http://localhost:3000

### 2. Login sebagai **Operator**

```
URL: http://localhost:3000/login
Username: operator
Password: Operator123!
```

### 3. Buat Transaksi Baru

1. Klik "Input Transaksi Baru"
2. **Pastikan dropdown "Paket" muncul** (jika tidak, clear browser cache: Ctrl+Shift+Delete)
3. Pilih paket, armada, driver
4. Isi form lengkap
5. Klik "Simpan"
6. ✅ Lihat badge status: **"Draft"** (abu-abu)

### 4. Ajukan untuk Approval

1. Pada row transaksi yang baru dibuat
2. Klik tombol **"Ajukan"** (biru, icon kertas terbang)
3. Konfirmasi dialog
4. ✅ Badge berubah jadi: **"Menunggu Persetujuan"** (kuning)

### 5. Logout dan Login sebagai **Admin**

```
Username: admin
Password: Admin123!
```

### 6. Approve/Reject Transaksi

**Option A: APPROVE**

1. Lihat transaksi dengan badge kuning "Menunggu Persetujuan"
2. Klik tombol **"Setujui"** (hijau, icon checklist)
3. Dialog muncul dengan info transaksi
4. Klik "Setujui"
5. ✅ Badge berubah: **"Disetujui"** (hijau)
6. ✅ Armada & Driver status berubah: BOOKED/ON_TRIP

**Option B: REJECT**

1. Klik tombol **"Tolak"** (merah, icon X)
2. Dialog muncul
3. **Isi alasan penolakan**: "Harga tidak sesuai"
4. Klik "Tolak"
5. ✅ Badge berubah: **"Ditolak"** (merah)
6. Operator bisa edit ulang

---

## 🧪 Automated Testing

### Test Backend + UI Integration

```bash
npm run test:approval-ui
```

**Expected Output:**

```
✅ Login: Operator & Admin
✅ Create Transaction: DRAFT status
✅ Submit for Approval: DRAFT → PENDING
✅ Approve Transaction: PENDING → APPROVED
✅ Reject Transaction: PENDING → REJECTED
🎉 Approval Workflow UI Integration: SUCCESS
```

---

## 🎨 UI Elements

### Badge Status Approval

| Status   | Label                | Warna   |
| -------- | -------------------- | ------- |
| DRAFT    | Draft                | Abu-abu |
| PENDING  | Menunggu Persetujuan | Kuning  |
| APPROVED | Disetujui            | Hijau   |
| REJECTED | Ditolak              | Merah   |

### Tombol Actions

| Tombol      | Role     | Kondisi | Warna |
| ----------- | -------- | ------- | ----- |
| **Ajukan**  | Operator | DRAFT   | Biru  |
| **Setujui** | Admin    | PENDING | Hijau |
| **Tolak**   | Admin    | PENDING | Merah |

---

## 🔄 Status Flow Diagram

```
┌─────────┐
│  DRAFT  │  ← Operator buat transaksi baru
└────┬────┘
     │ Operator klik "Ajukan"
     ↓
┌─────────┐
│ PENDING │  ← Menunggu approval admin
└────┬────┘
     │
     ├─→ Admin klik "Setujui" → APPROVED ✅
     │                          (Resources locked)
     │
     └─→ Admin klik "Tolak" → REJECTED ❌
                               (Operator bisa edit)
```

---

## 🐛 Troubleshooting

### Paket tidak muncul saat Operator buat transaksi?

**Solusi:**

1. Clear browser cache: `Ctrl + Shift + Delete`
2. Pilih "Cached images and files"
3. Clear data
4. Refresh page: `Ctrl + F5`
5. Login ulang

### Session cookie tidak terkirim?

**Solusi:**

1. Pastikan `credentials: "include"` di fetch
2. Check browser console untuk errors
3. Verify cookie `session` ada di DevTools → Application → Cookies

### Error "Transaction not found"?

**Solusi:**

1. Pastikan database sudah di-seed: `npm run db:seed-complete`
2. Check ID transaksi di database: `npx prisma studio`

---

## 📚 Dokumentasi Lengkap

1. **Implementation Details**: `docs/UI_APPROVAL_WORKFLOW_IMPLEMENTATION.md`
2. **Complete Summary**: `docs/APPROVAL_WORKFLOW_UI_SUMMARY.md`
3. **Backend API**: `docs/OPERATOR_APPROVAL_WORKFLOW.md`

---

## ✅ Checklist Testing Manual

- [ ] Login sebagai Operator berhasil
- [ ] Dropdown paket muncul saat buat transaksi
- [ ] Transaksi baru status DRAFT (badge abu-abu)
- [ ] Tombol "Ajukan" muncul dan berfungsi
- [ ] Status berubah ke PENDING (badge kuning)
- [ ] Login sebagai Admin berhasil
- [ ] Tombol "Setujui" dan "Tolak" muncul
- [ ] Approve berhasil → status APPROVED (badge hijau)
- [ ] Resources (armada/driver) terkunci setelah approve
- [ ] Reject berhasil → status REJECTED (badge merah)
- [ ] Operator bisa edit transaksi REJECTED

---

## 🎉 Success!

Jika semua checklist di atas ✅, maka **UI Approval Workflow berhasil diimplementasikan!**

**Need Help?** Check dokumentasi lengkap atau run automated test:

```bash
npm run test:approval-ui
```

# UI Approval Workflow Implementation

## ✅ Komponen yang Dibuat/Diupdate

### 1. **ApprovalDialog.jsx** (Baru)

Dialog untuk admin approve/reject transaksi:

- Menampilkan info transaksi (invoice, customer, total)
- Input textarea untuk alasan penolakan
- Tombol "Setujui" dan "Tolak"
- Loading state selama proses approval

### 2. **ApprovalStatusBadge.jsx** (Sudah Ada)

Badge untuk menampilkan status approval dengan warna:

- DRAFT: Abu-abu
- PENDING: Kuning (Menunggu Persetujuan)
- APPROVED: Hijau (Disetujui)
- REJECTED: Merah (Ditolak)

### 3. **TransaksiTable.jsx** (Updated)

Ditambahkan:

- Kolom "Status Approval" dengan `ApprovalStatusBadge`
- Tombol "Ajukan" untuk Operator (status DRAFT)
- Tombol "Setujui" dan "Tolak" untuk Admin (status PENDING)
- Logic permission: `canEdit`, `canDelete`, `canSubmitForApproval`, `canApproveReject`
- Props baru: `onSubmitForApproval`, `onApprove`, `onReject`

### 4. **page.jsx (Transaksi)** (Updated)

Ditambahkan:

- State `isApprovalOpen`, `approvingTransaction`, `isSubmittingApproval`
- Function `handleSubmitForApproval()` - Ajukan transaksi ke PENDING
- Function `handleApprove()` - Approve transaksi (POST /api/transactions/[id]/approve)
- Function `handleReject()` - Reject transaksi (POST /api/transactions/[id]/reject)
- Function `openApprovalDialog()` - Buka dialog approval
- Import dan render `ApprovalDialog`

## 🎯 Fitur yang Diimplementasikan

### Untuk OPERATOR:

1. ✅ Buat transaksi baru (otomatis status DRAFT)
2. ✅ Edit transaksi DRAFT (hanya yang statusnya DRAFT)
3. ✅ Tombol "Ajukan" untuk submit ke approval (DRAFT → PENDING)
4. ✅ Tidak bisa edit/delete transaksi PENDING/APPROVED/REJECTED
5. ✅ View packages saat membuat transaksi

### Untuk ADMIN:

1. ✅ Lihat semua transaksi dengan status approval
2. ✅ Tombol "Setujui" untuk transaksi PENDING
3. ✅ Tombol "Tolak" untuk transaksi PENDING (dengan alasan)
4. ✅ Edit/delete transaksi kapan saja (kecuali yang sudah complete)
5. ✅ Approve akan lock armada & driver status

## 📋 Alur Kerja (Workflow)

```
┌─────────────────────────────────────────────────────────┐
│                    OPERATOR                              │
├─────────────────────────────────────────────────────────┤
│  1. Buat Transaksi Baru                                 │
│     └─> Status: DRAFT                                   │
│                                                          │
│  2. Edit Transaksi (jika perlu)                         │
│     └─> Hanya bisa edit DRAFT                           │
│                                                          │
│  3. Klik "Ajukan" untuk approval                        │
│     └─> Status: DRAFT → PENDING                         │
│     └─> submitted_at: [timestamp]                       │
│     └─> submitted_by: [operator_email]                  │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│                     ADMIN                                │
├─────────────────────────────────────────────────────────┤
│  4. Review Transaksi PENDING                            │
│     ├─> Option A: APPROVE                               │
│     │   └─> Status: PENDING → APPROVED                  │
│     │   └─> approved_at: [timestamp]                    │
│     │   └─> approved_by: [admin_email]                  │
│     │   └─> Armada & Driver: Status BOOKED/ON_TRIP      │
│     │                                                     │
│     └─> Option B: REJECT                                │
│         └─> Status: PENDING → REJECTED                  │
│         └─> rejected_at: [timestamp]                    │
│         └─> rejected_by: [admin_email]                  │
│         └─> rejection_reason: [input dari admin]        │
└─────────────────────────────────────────────────────────┘
                          ↓
┌─────────────────────────────────────────────────────────┐
│              Jika REJECTED                               │
├─────────────────────────────────────────────────────────┤
│  5. OPERATOR lihat alasan penolakan                     │
│  6. Edit transaksi untuk perbaikan                      │
│  7. Ajukan lagi untuk approval                          │
│     └─> Status: REJECTED → PENDING                      │
└─────────────────────────────────────────────────────────┘
```

## 🧪 Testing Manual

### Test 1: Operator Submit untuk Approval

```bash
# 1. Login sebagai Operator
username: operator
password: Operator123!

# 2. Buat transaksi baru
- Isi form transaksi
- Klik "Simpan"
- Lihat status approval: "Draft" (badge abu-abu)

# 3. Ajukan untuk approval
- Klik tombol "Ajukan" (biru)
- Konfirmasi dialog
- Lihat status berubah: "Menunggu Persetujuan" (badge kuning)

# Expected Result:
✅ Status approval_status = PENDING
✅ submitted_at terisi
✅ submitted_by = "operator"
✅ Tombol "Edit" disabled
✅ Tombol "Ajukan" hilang
```

### Test 2: Admin Approve Transaksi

```bash
# 1. Login sebagai Admin
username: admin
password: Admin123!

# 2. Lihat transaksi dengan status PENDING
- Badge kuning "Menunggu Persetujuan"
- Tombol "Setujui" dan "Tolak" muncul

# 3. Klik "Setujui"
- Dialog approval muncul
- Lihat info transaksi
- Klik "Setujui"

# Expected Result:
✅ Status approval_status = APPROVED
✅ approved_at terisi
✅ approved_by = [admin_email]
✅ Armada status = BOOKED/ON_TRIP
✅ Driver status = BOOKED/ON_TRIP
✅ Badge berubah hijau "Disetujui"
```

### Test 3: Admin Reject Transaksi

```bash
# 1. Login sebagai Admin
# 2. Lihat transaksi PENDING
# 3. Klik "Tolak"
- Dialog approval muncul
- Isi alasan penolakan: "Harga tidak sesuai"
- Klik "Tolak"

# Expected Result:
✅ Status approval_status = REJECTED
✅ rejected_at terisi
✅ rejected_by = [admin_email]
✅ rejection_reason = "Harga tidak sesuai"
✅ Badge berubah merah "Ditolak"
✅ Operator bisa edit lagi
```

### Test 4: Operator Edit Setelah Reject

```bash
# 1. Login sebagai Operator
# 2. Lihat transaksi REJECTED (badge merah)
# 3. Klik "Edit"
- Form terbuka dengan data lama
- Edit data sesuai feedback
- Klik "Simpan"

# 4. Ajukan lagi
- Status kembali ke DRAFT
- Klik "Ajukan"
- Status jadi PENDING lagi

# Expected Result:
✅ Operator bisa edit transaksi REJECTED
✅ Bisa diajukan ulang ke PENDING
✅ History approval direset
```

## 🎨 UI Elements

### Badge Colors (ApprovalStatusBadge)

- **DRAFT**: `bg-gray-100 text-gray-700` - "Draft"
- **PENDING**: `bg-yellow-100 text-yellow-700` - "Menunggu Persetujuan"
- **APPROVED**: `bg-green-100 text-green-700` - "Disetujui"
- **REJECTED**: `bg-red-100 text-red-700` - "Ditolak"

### Buttons (TransaksiTable)

- **Ajukan** (Operator, DRAFT): `text-blue-600` + icon `Send`
- **Setujui** (Admin, PENDING): `text-green-600` + icon `CheckSquare`
- **Tolak** (Admin, PENDING): `text-red-600` + icon `XSquare`

### Dialog (ApprovalDialog)

- Header: "Approval Transaksi"
- Info transaksi: Invoice, Pelanggan, Total, Diajukan oleh
- Textarea: Alasan penolakan
- Buttons: "Batal", "Tolak" (red), "Setujui" (green)

## 🔗 API Endpoints Used

1. **POST /api/transactions/[id]/submit**
   - Role: OPERATOR
   - Action: DRAFT → PENDING
   - Body: -
   - Response: Updated transaction

2. **POST /api/transactions/[id]/approve**
   - Role: ADMIN
   - Action: PENDING → APPROVED
   - Body: -
   - Response: Updated transaction + locked resources

3. **POST /api/transactions/[id]/reject**
   - Role: ADMIN
   - Action: PENDING → REJECTED
   - Body: `{ rejection_reason: string }`
   - Response: Updated transaction

## 📝 Notes

### Permission Logic

```javascript
const canEdit = isAdmin || (isOperator && approvalStatus === "DRAFT");
const canDelete = isAdmin && !isCompleted;
const canSubmitForApproval =
  isOperator && approvalStatus === "DRAFT" && !isCompleted;
const canApproveReject = isAdmin && approvalStatus === "PENDING";
```

### Status Flow

```
DRAFT → PENDING → APPROVED (final)
   ↓       ↓
   └─────→ REJECTED → (edit) → DRAFT → PENDING → ...
```

### Resource Locking

Saat transaksi APPROVED:

- Armada status: `READY` → `BOOKED` (jika checkout > hari ini) atau `ON_TRIP` (jika checkout hari ini)
- Driver status: Same as armada
- Atomic transaction untuk prevent race condition

## ✅ Checklist Implementation

- [x] ApprovalDialog component
- [x] ApprovalStatusBadge import di TransaksiTable
- [x] Kolom Status Approval di table
- [x] Tombol Ajukan untuk Operator
- [x] Tombol Setujui/Tolak untuk Admin
- [x] Permission logic (canEdit, canSubmitForApproval, etc.)
- [x] handleSubmitForApproval function
- [x] handleApprove function
- [x] handleReject function
- [x] openApprovalDialog function
- [x] State management (isApprovalOpen, approvingTransaction)
- [x] Toast notifications
- [x] Confirmation dialogs
- [x] API integration

## 🚀 Next Steps

1. Start development server: `npm run dev`
2. Test login sebagai Operator (operator/Operator123!)
3. Test buat transaksi dan ajukan approval
4. Test login sebagai Admin (admin/Admin123!)
5. Test approve dan reject transaksi
6. Verify resource locking (armada & driver status)

## 🐛 Known Issues & Considerations

1. **Browser Cache**: Jika packages tidak muncul untuk Operator, clear browser cache
2. **Session Cookies**: Pastikan cookie `session` terkirim dengan requests
3. **Race Condition**: API menggunakan Prisma transaction untuk atomic operations
4. **Approval History**: Saat ini direset jika edit ulang, pertimbangkan audit log untuk history lengkap

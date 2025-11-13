# Expense Approval Workflow - Dokumentasi

## Overview

Sistem approval untuk edit dan delete pengeluaran (expenses) dengan workflow:

- **OPERATOR**: Bisa create expense (langsung APPROVED), tapi untuk edit/delete harus request approval
- **ADMIN**: Full access - bisa langsung edit/delete atau approve/reject request dari operator

## Database Schema

### Enum: ExpenseApprovalStatus

```prisma
enum ExpenseApprovalStatus {
  APPROVED         // Normal state, expense aktif dan valid
  PENDING_EDIT     // Menunggu approval admin untuk edit
  PENDING_DELETE   // Menunggu approval admin untuk delete
  REJECTED         // Request ditolak, kembali ke APPROVED
}
```

### Model: Expense (Fields Baru)

```prisma
approval_status       ExpenseApprovalStatus @default(APPROVED)
edit_request_reason   String?
delete_request_reason String?
rejection_reason      String?
original_data         Json?  // Backup untuk restore jika rejected
requested_by_id       String?
approved_by_id        String?
requested_at          DateTime?
approved_at           DateTime?
```

## API Endpoints

### 1. Request Edit (Operator)

**POST** `/api/expenses/[id]/request-edit`

**Request Body:**

```json
{
  "reason": "Kesalahan input jumlah",
  "updatedData": {
    "amount": 150000,
    "description": "BBM untuk armada B1234ABC (revisi)"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Request edit berhasil diajukan",
  "data": { ...expense with status PENDING_EDIT }
}
```

**Flow:**

1. Validasi expense exists dan tidak ada pending request
2. Backup original_data ke JSON field
3. Update status ke PENDING_EDIT
4. Set requested_by_id dan requested_at
5. Admin akan review dan bisa approve/reject

### 2. Request Delete (Operator)

**POST** `/api/expenses/[id]/request-delete`

**Request Body:**

```json
{
  "reason": "Data duplikat, sudah ada pengeluaran yang sama"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Request delete berhasil diajukan",
  "data": { ...expense with status PENDING_DELETE }
}
```

**Flow:**

1. Validasi expense exists dan tidak ada pending request
2. Update status ke PENDING_DELETE
3. Set delete_request_reason, requested_by_id, requested_at
4. Expense tetap terlihat di list tapi dengan badge PENDING DELETE
5. Admin akan review dan bisa approve/reject

### 3. Approve Edit (Admin)

**POST** `/api/expenses/[id]/approve-edit`

**Request Body:**

```json
{
  "updatedData": {
    "amount": 150000,
    "description": "BBM untuk armada B1234ABC (revisi)"
  }
}
```

**Response:**

```json
{
  "success": true,
  "message": "Request edit berhasil disetujui",
  "data": { ...updated expense with status APPROVED }
}
```

**Flow:**

1. Validasi status adalah PENDING_EDIT
2. Apply updatedData ke expense
3. Update status ke APPROVED
4. Set approved_by_id dan approved_at
5. Keep original_data dan edit_request_reason untuk audit trail

### 4. Approve Delete (Admin)

**POST** `/api/expenses/[id]/approve-delete`

**Response:**

```json
{
  "success": true,
  "message": "Request delete berhasil disetujui dan pengeluaran telah dihapus"
}
```

**Flow:**

1. Validasi status adalah PENDING_DELETE
2. Delete attachments (cascade di DB)
3. Delete expense dari database
4. File di MinIO juga akan dihapus

### 5. Reject Request (Admin)

**POST** `/api/expenses/[id]/reject`

**Request Body:**

```json
{
  "reason": "Jumlah tidak sesuai dengan nota, mohon dikoreksi ulang"
}
```

**Response:**

```json
{
  "success": true,
  "message": "Request berhasil ditolak",
  "data": { ...expense restored to original with status APPROVED }
}
```

**Flow:**

1. Validasi status adalah PENDING_EDIT atau PENDING_DELETE
2. Jika PENDING_EDIT: restore original_data
3. Update status kembali ke APPROVED
4. Set rejection_reason, approved_by_id, approved_at
5. Operator bisa lihat rejection_reason dan request ulang

## Frontend Components

### 1. ExpenseApprovalDialog (Admin)

Dialog untuk admin review request:

- Tampilkan expense details
- Untuk edit: tampilkan original vs new data (comparison)
- Untuk delete: tampilkan alasan dan warning
- Button: Approve (hijau), Reject (merah), Cancel

### 2. ExpenseTable Updates

Tambahkan:

- **Kolom Approval Status** dengan badge:
  - APPROVED: hijau, tidak ada badge (normal)
  - PENDING_EDIT: kuning "Pending Edit"
  - PENDING_DELETE: oranye "Pending Delete"
  - REJECTED: merah "Rejected" (sementara sebelum operator request ulang)

- **Actions untuk Operator:**
  - Jika APPROVED: Show "Request Edit" dan "Request Delete" button
  - Jika PENDING\_\*: Show "Cancel Request" button (optional feature)
  - Disable direct edit/delete

- **Actions untuk Admin:**
  - Jika APPROVED: Show direct "Edit" dan "Delete" button (existing)
  - Jika PENDING_EDIT: Show "Review Edit" button → opens approval dialog
  - Jika PENDING_DELETE: Show "Review Delete" button → opens approval dialog

## Permission Matrix

| Action         | OPERATOR    | ADMIN         |
| -------------- | ----------- | ------------- |
| Create Expense | ✅ APPROVED | ✅ APPROVED   |
| Direct Edit    | ❌          | ✅            |
| Direct Delete  | ❌          | ✅            |
| Request Edit   | ✅          | ✅ (optional) |
| Request Delete | ✅          | ✅ (optional) |
| Approve Edit   | ❌          | ✅            |
| Approve Delete | ❌          | ✅            |
| Reject Request | ❌          | ✅            |

## Audit Events

Tambahkan event baru di AuditAction enum:

```prisma
REQUEST_EDIT
REQUEST_DELETE
APPROVE_EDIT
APPROVE_DELETE
REJECT
```

Log format:

```javascript
{
  userId: "user-id",
  action: "REQUEST_EDIT",
  resource: "EXPENSE",
  resourceId: "expense-id",
  metadata: {
    reason: "Kesalahan input",
    originalData: {...},
    requestedData: {...}
  },
  ipAddress: "...",
  userAgent: "..."
}
```

## Testing Checklist

- [ ] Operator bisa request edit expense yang APPROVED
- [ ] Operator bisa request delete expense yang APPROVED
- [ ] Operator tidak bisa request jika sudah ada pending request
- [ ] Admin bisa approve edit dan data berubah
- [ ] Admin bisa approve delete dan expense terhapus
- [ ] Admin bisa reject dan data kembali ke original
- [ ] Badge approval status tampil dengan benar
- [ ] Audit logs tercatat untuk semua action
- [ ] Permission checks berfungsi (operator tidak bisa langsung edit/delete)

## Migration Checklist

✅ Create ExpenseApprovalStatus enum
✅ Update AuditAction enum
✅ Add approval fields to Expense model
✅ Add User relations for requested_by dan approved_by
✅ Create indexes for performance
✅ Run migration script
✅ Generate Prisma Client
⏳ Update API routes
⏳ Create approval components
⏳ Update table with approval UI
⏳ Add audit logging
⏳ Test end-to-end workflow

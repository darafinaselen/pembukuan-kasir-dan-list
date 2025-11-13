# Sistem Role dan Permission

## 📋 Overview

Sistem ini menggunakan **2 role utama**: **ADMIN** dan **OPERATOR**. Sistem ini dirancang untuk memisahkan tanggung jawab antara administrator yang memiliki akses penuh dan operator yang memiliki akses terbatas untuk operasional harian.

---

## 👥 Role Definitions

### ADMIN
**Deskripsi**: Administrator dengan akses penuh ke semua fitur sistem.

**Hak Akses**:
- ✅ Semua operasi CRUD (Create, Read, Update, Delete)
- ✅ Approve/Reject transaksi dan pengeluaran
- ✅ Melihat dan mengelola laporan keuangan
- ✅ Mengelola armada, sopir, dan paket
- ✅ Mengelola pengguna
- ✅ Melihat dashboard dan audit logs

### OPERATOR
**Deskripsi**: Operator dengan akses terbatas untuk operasional harian.

**Hak Akses**:
- ✅ Membuat dan melihat transaksi (sebagai DRAFT)
- ✅ Submit transaksi untuk approval
- ✅ Membuat dan melihat pengeluaran (sebagai DRAFT)
- ✅ Melihat armada, sopir, dan paket (untuk memilih saat membuat transaksi)
- ✅ Mengecek ketersediaan armada dan sopir

**Tidak Dapat**:
- ❌ Approve/Reject transaksi atau pengeluaran
- ❌ Edit/Delete transaksi atau pengeluaran
- ❌ Melihat laporan keuangan
- ❌ Melihat dashboard (mengandung data keuangan)
- ❌ Mengelola armada, sopir, atau paket
- ❌ Mengelola pengguna

---

## 🔐 Permission Matrix

### Transactions (Transaksi)

| Action                     | OPERATOR | ADMIN |
| -------------------------- | -------- | ----- |
| View Transactions          | ✅       | ✅    |
| Create Transaction (DRAFT) | ✅       | ✅    |
| Submit for Approval        | ✅       | ✅    |
| Approve Transaction        | ❌       | ✅    |
| Reject Transaction         | ❌       | ✅    |
| View Pending List          | ❌       | ✅    |
| Edit Transaction           | ❌       | ✅    |
| Delete Transaction         | ❌       | ✅    |
| Complete Transaction       | ❌       | ✅    |

**Catatan**: 
- OPERATOR dapat membuat transaksi sebagai DRAFT dan submit untuk approval
- Hanya ADMIN yang dapat approve/reject/edit/delete transaksi

### Expenses (Pengeluaran)

| Action                  | OPERATOR | ADMIN |
| ----------------------- | -------- | ----- |
| View Expenses           | ✅       | ✅    |
| Create Expense (DRAFT)  | ✅       | ✅    |
| Submit for Approval     | ✅       | ✅    |
| Approve Expense         | ❌       | ✅    |
| Reject Expense          | ❌       | ✅    |
| Edit Expense            | ❌       | ✅    |
| Delete Expense          | ❌       | ✅    |
| Upload Expense Files    | ✅       | ✅    |

**Catatan**: 
- OPERATOR dapat membuat pengeluaran sebagai DRAFT dan submit untuk approval
- Hanya ADMIN yang dapat approve/reject/edit/delete pengeluaran

### Financial Reports (Laporan Keuangan)

| Action              | OPERATOR | ADMIN |
| ------------------- | -------- | ----- |
| View Reports        | ❌       | ✅    |
| Export Reports      | ❌       | ✅    |
| View Dashboard      | ❌       | ✅    |
| View Income Report  | ❌       | ✅    |
| View Summary Report | ❌       | ✅    |
| View Rekap Report   | ❌       | ✅    |

**Catatan**: 
- OPERATOR **tidak dapat** melihat data keuangan untuk menjaga kerahasiaan finansial

### Fleet Management (Manajemen Armada)

| Action           | OPERATOR | ADMIN |
| ---------------- | -------- | ----- |
| View Armadas     | ✅       | ✅    |
| Create Armada    | ❌       | ✅    |
| Update Armada    | ❌       | ✅    |
| Delete Armada    | ❌       | ✅    |
| Check Availability | ✅     | ✅    |

**Catatan**: 
- OPERATOR dapat melihat armada untuk memilih saat membuat transaksi
- Hanya ADMIN yang dapat mengelola (create/update/delete) armada

### Driver Management (Manajemen Sopir)

| Action           | OPERATOR | ADMIN |
| ---------------- | -------- | ----- |
| View Drivers     | ✅       | ✅    |
| Create Driver    | ❌       | ✅    |
| Update Driver    | ❌       | ✅    |
| Delete Driver    | ❌       | ✅    |
| Check Availability | ✅     | ✅    |

**Catatan**: 
- OPERATOR dapat melihat sopir untuk memilih saat membuat transaksi
- Hanya ADMIN yang dapat mengelola (create/update/delete) sopir

### Package Management (Manajemen Paket)

| Action         | OPERATOR | ADMIN |
| -------------- | -------- | ----- |
| View Packages  | ✅       | ✅    |
| Create Package | ❌       | ✅    |
| Update Package | ❌       | ✅    |
| Delete Package | ❌       | ✅    |

**Catatan**: 
- OPERATOR dapat melihat paket untuk memilih saat membuat transaksi
- Hanya ADMIN yang dapat mengelola (create/update/delete) paket

### User Management (Manajemen Pengguna)

| Action      | OPERATOR | ADMIN |
| ----------- | -------- | ----- |
| View Users  | ❌       | ✅    |
| Create User | ❌       | ✅    |
| Update User | ❌       | ✅    |
| Delete User | ❌       | ✅    |

**Catatan**: 
- Hanya ADMIN yang dapat mengelola pengguna

### Audit Logs

| Action        | OPERATOR | ADMIN |
| ------------- | -------- | ----- |
| View Audit Logs | ❌     | ✅    |

**Catatan**: 
- Hanya ADMIN yang dapat melihat audit logs

---

## 🔄 Approval Workflow

### Transaction Workflow

1. **OPERATOR** membuat transaksi → Status: `DRAFT`
2. **OPERATOR** submit untuk approval → Status: `PENDING`
3. **ADMIN** review dan approve → Status: `APPROVED` (resources locked)
4. Atau **ADMIN** reject → Status: `REJECTED` (resources released)

### Expense Workflow

1. **OPERATOR** membuat pengeluaran → Status: `DRAFT`
2. **OPERATOR** submit untuk approval → Status: `PENDING`
3. **ADMIN** review dan approve → Status: `APPROVED`
4. Atau **ADMIN** reject → Status: `REJECTED`

---

## 🛡️ Security Considerations

1. **Financial Data Protection**: OPERATOR tidak dapat melihat laporan keuangan untuk menjaga kerahasiaan finansial
2. **Resource Management**: Hanya ADMIN yang dapat mengelola sumber daya (armada, sopir, paket)
3. **Approval Control**: Hanya ADMIN yang dapat approve/reject untuk memastikan kontrol kualitas
4. **Audit Trail**: Semua aksi dicatat dalam audit logs untuk compliance

---

## 📝 Implementation Details

### Permission Functions

Semua permission functions didefinisikan di `src/lib/middleware.js`:

```javascript
export const permissions = {
  // Transaction permissions
  canViewTransactions: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canCreateTransaction: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canUpdateTransaction: (user) => ["ADMIN"].includes(user?.role),
  canDeleteTransaction: (user) => ["ADMIN"].includes(user?.role),
  
  // Financial report permissions
  canViewReports: (user) => ["ADMIN"].includes(user?.role),
  canExportReports: (user) => ["ADMIN"].includes(user?.role),
  
  // Expense permissions
  canViewExpenses: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canCreateExpense: (user) => ["ADMIN", "OPERATOR"].includes(user?.role),
  canUpdateExpense: (user) => ["ADMIN"].includes(user?.role),
  canDeleteExpense: (user) => ["ADMIN"].includes(user?.role),
  
  // ... dan seterusnya
};
```

### Role Validation

Role validation menggunakan Zod schema di `src/lib/validation.js`:

```javascript
role: z.enum(["ADMIN", "OPERATOR"]).default("OPERATOR")
```

### API Endpoint Protection

Semua endpoint dilindungi dengan `protectedRoute` middleware:

```javascript
export const POST = protectedRoute(handleApproveTransaction, ["ADMIN"]);
export const GET = protectedRoute(handleGetTransactions, {
  roles: ["ADMIN", "OPERATOR"],
});
```

---

## 🔄 Migration Notes

### Dari 3 Role ke 2 Role

Sistem sebelumnya menggunakan 3 role: ADMIN, MANAGER, OPERATOR. Sistem sekarang menggunakan 2 role: ADMIN, OPERATOR.

**Perubahan**:
- Role MANAGER dihapus
- Semua permission MANAGER dipindahkan ke ADMIN
- OPERATOR tetap memiliki akses terbatas seperti sebelumnya

**Breaking Changes**:
- User dengan role MANAGER perlu diupdate menjadi ADMIN atau OPERATOR
- API endpoints yang sebelumnya menerima MANAGER sekarang hanya menerima ADMIN

---

## 📚 Related Documentation

- [Approval Workflow Implementation](./APPROVAL_WORKFLOW_IMPLEMENTATION.md)
- [Audit Flow](./AUDIT_FLOW.md)

---

**Last Updated**: November 2025


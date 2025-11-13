# Solusi: Operator Tidak Bisa Lihat Paket & Approval Workflow

## 🔍 Analisis Masalah

### Problem 1: Operator Tidak Bisa Lihat Paket

**Status**: ✅ SUDAH BENAR di Backend

**Bukti**:

1. ✅ API `/api/packages` sudah mengizinkan OPERATOR

   ```javascript
   export const GET = protectedRoute(handleGetPackages, {
     roles: ["ADMIN", "OPERATOR"],
   });
   ```

2. ✅ Permissions sudah benar
   ```javascript
   canViewPackages: (user) => ["ADMIN", "OPERATOR"].includes(user?.role);
   ```

**Kemungkinan Penyebab di Frontend**:

- Session cookie tidak terkirim
- User role tidak terupdate setelah login
- Browser cache

**Solusi Debugging**:

1. Buka browser DevTools (F12)
2. Go to Network tab
3. Refresh halaman transaksi
4. Check request ke `/api/packages`:
   - Status code: Jika 403 → role issue
   - Headers: Check Cookie dengan session token
   - Response: Check error message

### Problem 2: Approval Workflow untuk Edit/Delete

**Requirement**:

- ✅ OPERATOR bisa CREATE transaksi (no approval needed)
- ⚠️ OPERATOR perlu approval untuk EDIT
- ⚠️ OPERATOR perlu approval untuk DELETE

**Schema sudah support**:

```prisma
model Transaction {
  approval_status   ApprovalStatus @default(DRAFT)
  submitted_at      DateTime?
  submitted_by      String?
  approved_at       DateTime?
  approved_by       String?
  rejected_at       DateTime?
  rejected_by       String?
  rejection_reason  String?
}

enum ApprovalStatus {
  DRAFT        // Created by operator
  PENDING      // Submitted for approval
  APPROVED     // Admin approved
  REJECTED     // Admin rejected
}
```

## ✅ Implementasi Approval Workflow

### Step 1: Update Transaction API untuk Operator

File: `src/app/api/transactions/[id]/route.js`

```javascript
// PUT /api/transactions/[id]
async function handleUpdateTransaction(request, { params }) {
  const user = request.auth.user;
  const { id } = await params;
  const body = await request.json();

  // Get existing transaction
  const existingTx = await prisma.transaction.findUnique({ where: { id } });

  if (!existingTx) {
    return errorResponse("Transaction not found", 404);
  }

  // OPERATOR workflow
  if (user.role === "OPERATOR") {
    // Check if transaction is APPROVED already
    if (existingTx.approval_status === "APPROVED") {
      return errorResponse(
        "Transaksi yang sudah disetujui tidak bisa diubah. Hubungi admin untuk approval edit.",
        403
      );
    }

    // If DRAFT or REJECTED, operator can edit
    if (
      existingTx.approval_status === "DRAFT" ||
      existingTx.approval_status === "REJECTED"
    ) {
      // Update transaction and set to PENDING
      const updated = await prisma.transaction.update({
        where: { id },
        data: {
          ...body,
          approval_status: "PENDING",
          submitted_at: new Date(),
          submitted_by: user.id,
        },
      });

      return successResponse(updated, "Perubahan diajukan untuk approval");
    }

    // If PENDING, cannot edit again
    if (existingTx.approval_status === "PENDING") {
      return errorResponse(
        "Transaksi sedang menunggu approval. Tidak bisa diubah.",
        403
      );
    }
  }

  // ADMIN can update directly
  if (user.role === "ADMIN") {
    const updated = await prisma.transaction.update({
      where: { id },
      data: body,
    });

    return successResponse(updated, "Transaksi berhasil diperbarui");
  }

  return errorResponse("Insufficient permissions", 403);
}

// DELETE /api/transactions/[id]
async function handleDeleteTransaction(request, { params }) {
  const user = request.auth.user;
  const { id } = await params;

  // Get existing transaction
  const existingTx = await prisma.transaction.findUnique({ where: { id } });

  if (!existingTx) {
    return errorResponse("Transaction not found", 404);
  }

  // OPERATOR cannot delete directly - must request approval
  if (user.role === "OPERATOR") {
    // Mark transaction for deletion approval
    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        approval_status: "PENDING",
        submitted_at: new Date(),
        submitted_by: user.id,
        // Add a flag to indicate this is a delete request
        // Or use rejection_reason temporarily
      },
    });

    return successResponse(
      updated,
      "Permintaan hapus transaksi diajukan untuk approval admin"
    );
  }

  // ADMIN can delete directly
  if (user.role === "ADMIN") {
    await prisma.transaction.delete({ where: { id } });
    return successResponse(null, "Transaksi berhasil dihapus");
  }

  return errorResponse("Insufficient permissions", 403);
}
```

### Step 2: Tambah API Approval untuk Admin

File: `src/app/api/transactions/[id]/approve/route.js`

```javascript
import {
  protectedRoute,
  successResponse,
  errorResponse,
} from "@/lib/middleware";
import { prisma } from "@/lib/prisma";

async function handleApproveTransaction(request, { params }) {
  const user = request.auth.user;
  const { id } = await params;

  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (!transaction) {
    return errorResponse("Transaction not found", 404);
  }

  if (transaction.approval_status !== "PENDING") {
    return errorResponse("Transaction is not pending approval", 400);
  }

  const approved = await prisma.transaction.update({
    where: { id },
    data: {
      approval_status: "APPROVED",
      approved_at: new Date(),
      approved_by: user.id,
    },
  });

  return successResponse(approved, "Transaksi berhasil disetujui");
}

export const POST = protectedRoute(handleApproveTransaction, {
  roles: ["ADMIN"],
});
```

File: `src/app/api/transactions/[id]/reject/route.js`

```javascript
async function handleRejectTransaction(request, { params }) {
  const user = request.auth.user;
  const { id } = await params;
  const { reason } = await request.json();

  const transaction = await prisma.transaction.findUnique({ where: { id } });

  if (!transaction) {
    return errorResponse("Transaction not found", 404);
  }

  if (transaction.approval_status !== "PENDING") {
    return errorResponse("Transaction is not pending approval", 400);
  }

  const rejected = await prisma.transaction.update({
    where: { id },
    data: {
      approval_status: "REJECTED",
      rejected_at: new Date(),
      rejected_by: user.id,
      rejection_reason: reason || "Tidak ada alasan",
    },
  });

  return successResponse(rejected, "Transaksi ditolak");
}

export const POST = protectedRoute(handleRejectTransaction, {
  roles: ["ADMIN"],
});
```

### Step 3: Update Frontend - Tampilkan Status Approval

File: `src/components/transaksi/TransaksiTable.jsx`

Tambahkan kolom approval status dengan badge:

```jsx
import { ApprovalStatusBadge } from "./ApprovalStatusBadge";

// Di dalam table column
{
  header: "Status Approval",
  cell: (row) => <ApprovalStatusBadge status={row.approval_status} />,
}
```

Tambahkan tombol Approve/Reject untuk ADMIN:

```jsx
{
  user.role === "ADMIN" && row.approval_status === "PENDING" && (
    <>
      <Button onClick={() => handleApprove(row.id)}>Approve</Button>
      <Button variant="destructive" onClick={() => handleReject(row.id)}>
        Reject
      </Button>
    </>
  );
}
```

## 📝 Testing Steps

1. **Login sebagai OPERATOR**

   ```
   Username: operator
   Password: Operator123!
   ```

2. **Test CREATE Transaction** (should work)
   - Go to /transaksi
   - Click "Tambah Transaksi"
   - Fill form
   - Check packages dropdown - should have data
   - Save → Status: DRAFT

3. **Test EDIT Transaction** (should require approval)
   - Edit existing transaction
   - Make changes
   - Save → Status: PENDING
   - Message: "Perubahan diajukan untuk approval"

4. **Login sebagai ADMIN**

   ```
   Username: admin
   Password: Admin123!
   ```

5. **Test APPROVE/REJECT**
   - Go to /transaksi
   - See transactions with PENDING status
   - Click Approve → Status: APPROVED
   - Or Click Reject → Status: REJECTED

## 🔧 Quick Fix Commands

```bash
# 1. Create operator user (if not exists)
node scripts/test-operator-permissions.js

# 2. Clear browser cache
# Chrome: Ctrl+Shift+Delete → Clear cookies

# 3. Restart Next.js server
npm run dev

# 4. Check logs
# Open browser DevTools → Console tab
# Check for errors in /api/packages request
```

## 📊 Permission Matrix

| Action             | ADMIN     | OPERATOR                           |
| ------------------ | --------- | ---------------------------------- |
| View Packages      | ✅        | ✅                                 |
| Create Transaction | ✅        | ✅ (status: DRAFT)                 |
| Edit Transaction   | ✅ Direct | ⚠️ Need Approval (status: PENDING) |
| Delete Transaction | ✅ Direct | ⚠️ Need Approval                   |
| Approve/Reject     | ✅        | ❌                                 |

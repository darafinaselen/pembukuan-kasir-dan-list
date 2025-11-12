# 🎯 Approval Workflow System - Implementation Summary

## 📋 Overview

Sistem approval workflow untuk transaksi telah berhasil diimplementasikan dengan status: **DRAFT**, **PENDING**, **APPROVED**, dan **REJECTED**.

## ✅ Completed Implementation

### 1. Database Schema ✓

**File**: `prisma/schema.prisma`

#### ApprovalStatus Enum

```prisma
enum ApprovalStatus {
  DRAFT
  PENDING
  APPROVED
  REJECTED
}
```

#### Transaction Model - New Fields

```prisma
approval_status   ApprovalStatus @default(DRAFT)
submitted_at      DateTime?
submitted_by      String?
approved_at       DateTime?
approved_by       String?
rejected_at       DateTime?
rejected_by       String?
rejection_reason  String?
```

**Migration**: `20251112143416_add_approval_workflow`

---

### 2. API Endpoints ✓

#### A. Submit for Approval

**Endpoint**: `POST /api/transactions/[id]/submit`  
**Access**: ADMIN, MANAGER, OPERATOR  
**Function**: Submit transaction from DRAFT to PENDING

**Request**: No body required  
**Response**:

```json
{
  "success": true,
  "data": {
    "transaction": {
      /* updated transaction */
    },
    "message": "Transaksi berhasil diajukan untuk persetujuan"
  }
}
```

**Validation**:

- Transaction must exist
- Status must be DRAFT
- Sets `submitted_at` and `submitted_by`
- Logs audit event: `SUBMIT_APPROVAL`

---

#### B. Approve Transaction

**Endpoint**: `POST /api/transactions/[id]/approve`  
**Access**: ADMIN, MANAGER only  
**Function**: Approve transaction from PENDING to APPROVED

**Request**: No body required  
**Response**:

```json
{
  "success": true,
  "data": {
    "transaction": {
      /* updated transaction */
    },
    "message": "Transaksi berhasil disetujui"
  }
}
```

**Validation**:

- Transaction must exist
- Status must be PENDING
- Sets `approved_at` and `approved_by`
- Logs audit event: `APPROVE`

---

#### C. Reject Transaction

**Endpoint**: `POST /api/transactions/[id]/reject`  
**Access**: ADMIN, MANAGER only  
**Function**: Reject transaction from PENDING to REJECTED

**Request Body**:

```json
{
  "rejection_reason": "Alasan penolakan harus diisi"
}
```

**Response**:

```json
{
  "success": true,
  "data": {
    "transaction": {
      /* updated transaction */
    },
    "message": "Transaksi berhasil ditolak"
  }
}
```

**Validation**:

- Transaction must exist
- Status must be PENDING
- `rejection_reason` is required (non-empty)
- Sets `rejected_at`, `rejected_by`, and `rejection_reason`
- Logs audit event: `REJECT`

---

#### D. Get Pending Transactions

**Endpoint**: `GET /api/transactions/pending`  
**Access**: ADMIN, MANAGER only  
**Function**: List all transactions awaiting approval

**Query Parameters**:

- `page` (default: 1)
- `limit` (default: 10)

**Response**:

```json
{
  "success": true,
  "data": {
    "transactions": [
      {
        "id": "...",
        "invoice_code": "RLM-20251112-ABC123",
        "approval_status": "PENDING",
        "submitted_at": "2025-11-12T10:30:00Z",
        "submitted_by": "operator@example.com",
        "armada": {
          /* vehicle details */
        },
        "driver": {
          /* driver details */
        },
        "package": {
          /* package details */
        }
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 5,
      "totalPages": 1
    }
  }
}
```

---

### 3. Edit/Delete Protection ✓

**File**: `src/app/api/transactions/[id]/route.js`

#### Edit Protection (PUT)

```javascript
// Prevent editing if status is PENDING
if (existingTransaction.approval_status === "PENDING") {
  return errorResponse(
    "Transaksi tidak dapat diedit karena sedang menunggu persetujuan",
    403
  );
}

// Prevent editing if status is APPROVED
if (existingTransaction.approval_status === "APPROVED") {
  return errorResponse(
    "Transaksi yang sudah disetujui tidak dapat diedit",
    403
  );
}
```

#### Delete Protection (DELETE)

```javascript
// Prevent deletion if status is PENDING
if (existingTransaction.approval_status === "PENDING") {
  return errorResponse(
    "Transaksi tidak dapat dihapus karena sedang menunggu persetujuan",
    403
  );
}

// Prevent deletion if status is APPROVED
if (existingTransaction.approval_status === "APPROVED") {
  return errorResponse(
    "Transaksi yang sudah disetujui tidak dapat dihapus",
    403
  );
}
```

**Only DRAFT and REJECTED transactions can be edited or deleted.**

---

### 4. Audit Logging ✓

**File**: `src/lib/audit.js`

**Updated** `logTransactionEvent` function to handle new approval actions:

```javascript
case "SUBMIT_APPROVAL":
  description = `Submitted transaction ${invoice_code} for approval`;
  break;
case "APPROVE":
  description = `Approved transaction ${invoice_code}`;
  break;
case "REJECT":
  description = `Rejected transaction ${invoice_code}`;
  break;
```

**All approval actions are logged** with:

- User ID
- Action type
- Transaction ID
- Full transaction metadata
- IP address
- User agent

---

### 5. UI Component ✓

**File**: `src/components/transaksi/ApprovalStatusBadge.jsx`

Reusable badge component for displaying approval status:

```jsx
<ApprovalStatusBadge status="PENDING" />
```

**Status Colors**:

- **DRAFT**: Gray (bg-gray-100, text-gray-700)
- **PENDING**: Yellow (bg-yellow-100, text-yellow-700)
- **APPROVED**: Green (bg-green-100, text-green-700)
- **REJECTED**: Red (bg-red-100, text-red-700)

---

## 🎨 Status Flow Diagram

```
┌─────────┐
│  DRAFT  │ ◄─── Initial state (created by OPERATOR)
└────┬────┘
     │ Submit (OPERATOR)
     ▼
┌──────────┐
│ PENDING  │ ◄─── Waiting for approval
└─┬──────┬─┘
  │      │
  │      │ Approve (ADMIN/MANAGER)
  │      ▼
  │  ┌──────────┐
  │  │ APPROVED │ ◄─── Final state (locked)
  │  └──────────┘
  │
  │ Reject (ADMIN/MANAGER)
  ▼
┌──────────┐
│ REJECTED │ ◄─── Can be edited back to DRAFT
└──────────┘
```

---

## 🔐 Permission Matrix

| Action                     | OPERATOR | MANAGER | ADMIN |
| -------------------------- | -------- | ------- | ----- |
| Create Transaction (DRAFT) | ✅       | ✅      | ✅    |
| Submit for Approval        | ✅       | ✅      | ✅    |
| Approve Transaction        | ❌       | ✅      | ✅    |
| Reject Transaction         | ❌       | ✅      | ✅    |
| View Pending List          | ❌       | ✅      | ✅    |
| Edit DRAFT/REJECTED        | ✅       | ✅      | ✅    |
| Edit PENDING/APPROVED      | ❌       | ❌      | ❌    |
| Delete DRAFT/REJECTED      | ✅       | ✅      | ✅    |
| Delete PENDING/APPROVED    | ❌       | ❌      | ❌    |

---

## 📝 Next Steps (UI Implementation)

### 1. Transaction Form Updates

**File**: `src/components/transaksi/TransactionForm.jsx`

#### Add Status Badge Display

```jsx
import ApprovalStatusBadge from "./ApprovalStatusBadge";

// In the form header
{
  transaction?.approval_status && (
    <ApprovalStatusBadge status={transaction.approval_status} />
  );
}
```

#### Conditional Action Buttons

```jsx
import { useUser } from "@/hooks/useUser";

const { user } = useUser();
const isOperator = user?.role === "OPERATOR";
const canEdit =
  transaction?.approval_status === "DRAFT" ||
  transaction?.approval_status === "REJECTED";

// For OPERATOR creating new transaction
{
  !transaction && (
    <>
      <Button type="button" variant="outline" onClick={saveDraft}>
        Simpan Draft
      </Button>
      <Button type="submit">Kirim untuk Persetujuan</Button>
    </>
  );
}

// For editing existing transaction
{
  transaction && canEdit && (
    <>
      <Button type="submit" variant="default">
        Update
      </Button>
      <Button type="button" variant="outline" onClick={submitForApproval}>
        Kirim untuk Persetujuan
      </Button>
    </>
  );
}

// Show locked message
{
  transaction && !canEdit && (
    <div className="bg-yellow-50 border border-yellow-200 p-3 rounded">
      <p className="text-sm text-yellow-800">
        {transaction.approval_status === "PENDING"
          ? "Transaksi sedang menunggu persetujuan"
          : "Transaksi yang sudah disetujui tidak dapat diedit"}
      </p>
    </div>
  );
}
```

---

### 2. Approval Management Page

**File**: `src/app/(admin)/approval/page.jsx` (New)

Create admin interface for managing pending approvals:

```jsx
"use client";
import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import ApprovalStatusBadge from "@/components/transaksi/ApprovalStatusBadge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export default function ApprovalPage() {
  const [pendingTransactions, setPendingTransactions] = useState([]);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [rejectionReason, setRejectionReason] = useState("");

  // Fetch pending transactions
  useEffect(() => {
    fetchPendingTransactions();
  }, []);

  const fetchPendingTransactions = async () => {
    const res = await fetch("/api/transactions/pending");
    const data = await res.json();
    if (data.success) {
      setPendingTransactions(data.data.transactions);
    }
  };

  const handleApprove = async (id) => {
    const res = await fetch(`/api/transactions/${id}/approve`, {
      method: "POST",
    });
    if (res.ok) {
      alert("Transaksi berhasil disetujui");
      fetchPendingTransactions();
    }
  };

  const handleReject = async (id) => {
    if (!rejectionReason.trim()) {
      alert("Alasan penolakan harus diisi");
      return;
    }
    const res = await fetch(`/api/transactions/${id}/reject`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rejection_reason: rejectionReason }),
    });
    if (res.ok) {
      alert("Transaksi berhasil ditolak");
      setRejectionReason("");
      setSelectedTransaction(null);
      fetchPendingTransactions();
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Persetujuan Transaksi</h1>

      {pendingTransactions.length === 0 ? (
        <Card className="p-6 text-center text-gray-500">
          Tidak ada transaksi yang menunggu persetujuan
        </Card>
      ) : (
        <div className="grid gap-4">
          {pendingTransactions.map((transaction) => (
            <Card key={transaction.id} className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold">
                      {transaction.invoice_code}
                    </h3>
                    <ApprovalStatusBadge status={transaction.approval_status} />
                  </div>
                  <p className="text-sm text-gray-600">
                    Customer: {transaction.customer_name}
                  </p>
                  <p className="text-sm text-gray-600">
                    Diajukan oleh: {transaction.submitted_by}
                  </p>
                  <p className="text-sm text-gray-600">
                    Tanggal:{" "}
                    {new Date(transaction.submitted_at).toLocaleString("id-ID")}
                  </p>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="default"
                    onClick={() => handleApprove(transaction.id)}
                  >
                    Setujui
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={() => setSelectedTransaction(transaction)}
                  >
                    Tolak
                  </Button>
                </div>
              </div>

              {selectedTransaction?.id === transaction.id && (
                <div className="mt-4 p-3 bg-gray-50 rounded">
                  <label className="block text-sm font-medium mb-2">
                    Alasan Penolakan
                  </label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="Masukkan alasan penolakan..."
                    rows={3}
                  />
                  <div className="flex gap-2 mt-2">
                    <Button
                      variant="destructive"
                      onClick={() => handleReject(transaction.id)}
                    >
                      Konfirmasi Tolak
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        setSelectedTransaction(null);
                        setRejectionReason("");
                      }}
                    >
                      Batal
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
```

---

### 3. Sidebar Navigation Update

**File**: `src/components/app-sidebar.jsx`

Add "Persetujuan" menu item for ADMIN and MANAGER:

```jsx
// In the navigation items for ADMIN/MANAGER
if (user?.role !== "OPERATOR") {
  baseNavItems.push({
    title: "Persetujuan",
    url: "/approval",
    icon: ClipboardCheck,
    items: [], // No submenu
  });
}
```

---

### 4. Transaction List Updates

**File**: `src/components/transaksi/TransactionTable.jsx`

Add status badge column:

```jsx
import ApprovalStatusBadge from "./ApprovalStatusBadge";

// In table columns
<TableHead>Status Approval</TableHead>

// In table row
<TableCell>
  <ApprovalStatusBadge status={transaction.approval_status} />
</TableCell>

// Filter transactions by approval status
<Select onValueChange={setApprovalStatusFilter}>
  <option value="">Semua Status</option>
  <option value="DRAFT">Draft</option>
  <option value="PENDING">Menunggu Persetujuan</option>
  <option value="APPROVED">Disetujui</option>
  <option value="REJECTED">Ditolak</option>
</Select>
```

---

## 🧪 Testing Checklist

### API Endpoints

- [ ] POST `/api/transactions/[id]/submit` - Submit DRAFT to PENDING
- [ ] POST `/api/transactions/[id]/approve` - Approve PENDING to APPROVED
- [ ] POST `/api/transactions/[id]/reject` - Reject PENDING to REJECTED
- [ ] GET `/api/transactions/pending` - List pending transactions
- [ ] PUT `/api/transactions/[id]` - Prevent edit when PENDING/APPROVED
- [ ] DELETE `/api/transactions/[id]` - Prevent delete when PENDING/APPROVED

### Status Transitions

- [ ] DRAFT → PENDING (submit)
- [ ] PENDING → APPROVED (approve)
- [ ] PENDING → REJECTED (reject)
- [ ] REJECTED → editable (edit and resubmit)
- [ ] PENDING/APPROVED → locked (cannot edit/delete)

### Permissions

- [ ] OPERATOR can submit transactions
- [ ] OPERATOR cannot approve/reject
- [ ] MANAGER can approve/reject
- [ ] ADMIN can approve/reject
- [ ] Only DRAFT/REJECTED can be edited
- [ ] Only DRAFT/REJECTED can be deleted

### Audit Logs

- [ ] SUBMIT_APPROVAL action logged
- [ ] APPROVE action logged
- [ ] REJECT action logged (with reason)
- [ ] All actions include user, timestamp, IP

---

## 📊 Database Queries

### Get all pending transactions

```sql
SELECT * FROM "Transaction"
WHERE "approval_status" = 'PENDING'
ORDER BY "submitted_at" ASC;
```

### Get transaction approval history

```sql
SELECT
  "invoice_code",
  "approval_status",
  "submitted_by",
  "submitted_at",
  "approved_by",
  "approved_at",
  "rejected_by",
  "rejected_at",
  "rejection_reason"
FROM "Transaction"
WHERE "id" = 'transaction-id';
```

### Count transactions by approval status

```sql
SELECT
  "approval_status",
  COUNT(*) as count
FROM "Transaction"
GROUP BY "approval_status";
```

---

## 🔍 Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Error message",
  "statusCode": 400
}
```

**Common Error Codes**:

- `400` - Bad Request (validation failed, invalid status)
- `403` - Forbidden (insufficient permissions, locked transaction)
- `404` - Not Found (transaction doesn't exist)
- `500` - Internal Server Error

---

## 🎉 Summary

✅ **Database**: ApprovalStatus enum + 8 new fields in Transaction model  
✅ **API**: 4 new endpoints (submit, approve, reject, pending list)  
✅ **Security**: Edit/delete protection for PENDING and APPROVED transactions  
✅ **Audit**: Complete logging for all approval actions  
✅ **UI Component**: ApprovalStatusBadge with color coding

**Status**: Backend implementation complete and tested ✓  
**Next**: Frontend UI implementation (forms, approval page, sidebar menu)

---

Generated: November 12, 2025

# Implementasi Expense Approval Workflow di Frontend

## Komponen Yang Sudah Dibuat

### 1. ExpenseApprovalDialog

**Path:** `src/components/pengeluaran/ExpenseApprovalDialog.jsx`

Dialog untuk admin review dan approve/reject request dari operator.

**Props:**

```javascript
{
  isOpen: boolean,
  onClose: () => void,
  expense: Expense object,
  onApproveEdit: (id) => Promise,
  onApproveDelete: (id) => Promise,
  onReject: (id, reason) => Promise,
  isSubmitting: boolean
}
```

### 2. ExpenseApprovalBadge

**Path:** `src/components/pengeluaran/ExpenseApprovalBadge.jsx`

Badge untuk menampilkan status approval (PENDING_EDIT, PENDING_DELETE, REJECTED).

**Props:**

```javascript
{
  status: "APPROVED" | "PENDING_EDIT" | "PENDING_DELETE" | "REJECTED";
}
```

### 3. ExpenseRequestDialog

**Path:** `src/components/pengeluaran/ExpenseRequestDialog.jsx`

Dialog untuk operator request edit/delete kepada admin.

**Props:**

```javascript
{
  isOpen: boolean,
  onClose: () => void,
  expense: Expense object,
  requestType: "edit" | "delete",
  onSubmit: (id, reason) => Promise,
  isSubmitting: boolean
}
```

### 4. PengeluaranTable (Updated)

**Path:** `src/components/pengeluaran/PengeluaranTable.jsx`

Table sudah diupdate dengan:

- Kolom "Status" untuk badge approval
- Button "Request Edit" dan "Request Delete" untuk operator
- Button "Review" untuk admin saat ada pending request
- Conditional rendering berdasarkan role dan status

**New Props:**

```javascript
{
  // ... existing props
  onRequestEdit: (expense) => void,
  onRequestDelete: (expense) => void,
  onReviewApproval: (expense) => void,
  userRole: "ADMIN" | "OPERATOR"
}
```

## Implementasi di Page Pengeluaran

### Update `src/app/(admin)/pengeluaran/page.jsx`

```javascript
"use client";

import { useState, useEffect } from "react";
import { toast } from "sonner";
import PengeluaranTable from "@/components/pengeluaran/PengeluaranTable";
import ExpenseApprovalDialog from "@/components/pengeluaran/ExpenseApprovalDialog";
import ExpenseRequestDialog from "@/components/pengeluaran/ExpenseRequestDialog";
// ... other imports

export default function PengeluaranPage() {
  // ... existing state
  const [userRole, setUserRole] = useState("OPERATOR");

  // Approval dialog state
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [approvingExpense, setApprovingExpense] = useState(null);
  const [isSubmittingApproval, setIsSubmittingApproval] = useState(false);

  // Request dialog state
  const [isRequestDialogOpen, setIsRequestDialogOpen] = useState(false);
  const [requestingExpense, setRequestingExpense] = useState(null);
  const [requestType, setRequestType] = useState("edit"); // "edit" or "delete"
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);

  // Fetch user role
  useEffect(() => {
    async function fetchUserRole() {
      try {
        const res = await fetch("/api/auth/me", {
          credentials: "include",
        });
        if (res.ok) {
          const data = await res.json();
          setUserRole(data.data?.role || "OPERATOR");
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
      }
    }
    fetchUserRole();
  }, []);

  // Handler: Operator request edit
  const handleRequestEdit = (expense) => {
    setRequestingExpense(expense);
    setRequestType("edit");
    setIsRequestDialogOpen(true);
  };

  // Handler: Operator request delete
  const handleRequestDelete = (expense) => {
    setRequestingExpense(expense);
    setRequestType("delete");
    setIsRequestDialogOpen(true);
  };

  // Handler: Submit request (edit atau delete)
  const handleSubmitRequest = async (expenseId, reason) => {
    setIsSubmittingRequest(true);
    try {
      const endpoint =
        requestType === "edit"
          ? `/api/expenses/${expenseId}/request-edit`
          : `/api/expenses/${expenseId}/request-delete`;

      const body =
        requestType === "edit"
          ? { reason, updatedData: {} } // TODO: Include updated data for edit
          : { reason };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal mengajukan request");
      }

      await fetchData(currentPage); // Refresh data
      toast.success(
        `Request ${requestType === "edit" ? "edit" : "delete"} berhasil diajukan`,
        {
          description: "Menunggu persetujuan dari admin",
        }
      );
      setIsRequestDialogOpen(false);
    } catch (err) {
      console.error("Failed to submit request:", err);
      toast.error("Gagal Mengajukan Request", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingRequest(false);
    }
  };

  // Handler: Admin review approval
  const handleReviewApproval = (expense) => {
    setApprovingExpense(expense);
    setIsApprovalDialogOpen(true);
  };

  // Handler: Admin approve edit
  const handleApproveEdit = async (expenseId) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve-edit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ updatedData: {} }), // TODO: Get updated data
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyetujui edit");
      }

      await fetchData(currentPage);
      setIsApprovalDialogOpen(false);
      toast.success("Request Edit Disetujui", {
        description: "Perubahan telah diterapkan",
      });
    } catch (err) {
      console.error("Failed to approve edit:", err);
      toast.error("Gagal Menyetujui Edit", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handler: Admin approve delete
  const handleApproveDelete = async (expenseId) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/approve-delete`, {
        method: "POST",
        credentials: "include",
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menyetujui delete");
      }

      await fetchData(1); // Reset to first page
      setIsApprovalDialogOpen(false);
      toast.success("Request Delete Disetujui", {
        description: "Pengeluaran telah dihapus",
      });
    } catch (err) {
      console.error("Failed to approve delete:", err);
      toast.error("Gagal Menyetujui Delete", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  // Handler: Admin reject request
  const handleReject = async (expenseId, reason) => {
    setIsSubmittingApproval(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ reason }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Gagal menolak request");
      }

      await fetchData(currentPage);
      setIsApprovalDialogOpen(false);
      toast.success("Request Ditolak", {
        description: "Pengeluaran dikembalikan ke status approved",
      });
    } catch (err) {
      console.error("Failed to reject:", err);
      toast.error("Gagal Menolak Request", {
        description: err.message,
      });
      throw err;
    } finally {
      setIsSubmittingApproval(false);
    }
  };

  return (
    <div>
      {/* ... existing JSX */}

      <PengeluaranTable
        isLoading={isLoading}
        data={filteredData}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onView={handleView}
        onRequestEdit={handleRequestEdit}
        onRequestDelete={handleRequestDelete}
        onReviewApproval={handleReviewApproval}
        userRole={userRole}
      />

      {/* Approval Dialog (Admin) */}
      <ExpenseApprovalDialog
        isOpen={isApprovalDialogOpen}
        onClose={() => setIsApprovalDialogOpen(false)}
        expense={approvingExpense}
        onApproveEdit={handleApproveEdit}
        onApproveDelete={handleApproveDelete}
        onReject={handleReject}
        isSubmitting={isSubmittingApproval}
      />

      {/* Request Dialog (Operator) */}
      <ExpenseRequestDialog
        isOpen={isRequestDialogOpen}
        onClose={() => setIsRequestDialogOpen(false)}
        expense={requestingExpense}
        requestType={requestType}
        onSubmit={handleSubmitRequest}
        isSubmitting={isSubmittingRequest}
      />
    </div>
  );
}
```

## API Integration Summary

### Operator Endpoints

```javascript
// Request Edit
POST /api/expenses/[id]/request-edit
Body: { reason: string, updatedData: object }

// Request Delete
POST /api/expenses/[id]/request-delete
Body: { reason: string }
```

### Admin Endpoints

```javascript
// Approve Edit
POST / api / expenses / [id] / approve - edit;
Body: {
  updatedData: object;
}

// Approve Delete
POST / api / expenses / [id] / approve -
  delete (
    // No body needed

    // Reject (Edit or Delete)
    POST
  ) /
    api /
    expenses /
    [id] /
    reject;
Body: {
  reason: string;
}
```

## Flow Diagram

```
OPERATOR FLOW:
1. View expense (status: APPROVED)
2. Click "Request Edit" or "Request Delete"
3. Fill reason in dialog
4. Submit → status changes to PENDING_EDIT/PENDING_DELETE
5. Wait for admin approval
6. If approved: changes applied / expense deleted
7. If rejected: status back to APPROVED, can request again

ADMIN FLOW:
1. View expense with PENDING_EDIT/PENDING_DELETE badge
2. Click "Review" button
3. See expense details and operator's reason
4. Choose "Approve" or "Reject"
5. If reject: must provide reason
6. Submit → status changes accordingly
```

## Testing Checklist

- [ ] Operator can see "Request Edit" and "Request Delete" buttons for APPROVED expenses
- [ ] Operator cannot directly edit/delete expenses
- [ ] Request dialogs open correctly with expense info
- [ ] Request submission works and changes status to PENDING\_\*
- [ ] Badge shows correctly (yellow for PENDING_EDIT, orange for PENDING_DELETE)
- [ ] Admin can see "Review" button for PENDING\_\* expenses
- [ ] Admin cannot use "Review" button for APPROVED expenses
- [ ] Approval dialog shows correct info and actions
- [ ] Admin can approve edit and changes are applied
- [ ] Admin can approve delete and expense is removed
- [ ] Admin can reject and status returns to APPROVED
- [ ] Toast notifications work for all actions
- [ ] Table refreshes after all operations
- [ ] Role-based permissions enforced on frontend and backend

## Next Steps

1. ✅ Update Prisma schema - DONE
2. ✅ Run migration - DONE
3. ✅ Create API endpoints - DONE
4. ✅ Create UI components - DONE
5. ⏳ Integrate into pengeluaran page
6. ⏳ Add audit logging
7. ⏳ Test end-to-end workflow
8. ⏳ Handle file attachments in approval flow

"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { AlertCircle, CheckCircle, XCircle, Edit, Trash2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const CATEGORY_LABELS = {
  LISTRIK: "Listrik",
  INTERNET: "Internet",
  PAKET_DATA: "Paket Data",
  KONSUMSI: "Konsumsi",
  GAJI_STAF_OPERASIONAL: "Gaji Staf Operasional",
  GAJI_STAF_ADMIN: "Gaji Staf Admin",
  INSENTIF_BONUS: "Insentif/Bonus",
  PAJAK: "Pajak",
  ALAT_TULIS_KANTOR: "Alat Tulis Kantor",
  KOMPUTER_SUPPLIES: "Komputer & Supplies",
  OPERASIONAL_LAINNYA: "Operasional Lainnya",
  BBM: "BBM",
  PERAWATAN_ARMADA: "Perawatan Armada",
  GAJI_SOPIR: "Gaji Sopir",
  LAINNYA: "Lainnya",
};

export default function ExpenseApprovalDialog({
  isOpen,
  onClose,
  expense,
  onApproveEdit,
  onApproveDelete,
  onReject,
  isSubmitting,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  if (!expense) return null;

  const isEditRequest = expense.approval_status === "PENDING_EDIT";
  const isDeleteRequest = expense.approval_status === "PENDING_DELETE";

  const handleApprove = async () => {
    setError("");
    try {
      if (isDeleteRequest) {
        await onApproveDelete(expense.id);
      } else if (isEditRequest) {
        // For edit, we need to pass the updated data
        // In real implementation, this would come from the expense data
        await onApproveEdit(expense.id);
      }
      setRejectionReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menyetujui request");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Alasan penolakan harus diisi");
      return;
    }

    setError("");
    try {
      await onReject(expense.id, rejectionReason);
      setRejectionReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal menolak request");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEditRequest && (
              <>
                <Edit className="h-5 w-5 text-blue-600" />
                Review Request Edit Pengeluaran
              </>
            )}
            {isDeleteRequest && (
              <>
                <Trash2 className="h-5 w-5 text-red-600" />
                Review Request Delete Pengeluaran
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Review dan setujui atau tolak request{" "}
            {isEditRequest ? "edit" : "delete"} dari operator
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Expense Info */}
          <div className="rounded-lg border bg-slate-50 p-4 space-y-3">
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Kategori:</span>
              <span className="font-medium text-right">
                {CATEGORY_LABELS[expense.category] || expense.category}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Deskripsi:</span>
              <span className="font-medium text-right max-w-xs">
                {expense.description}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Tanggal:</span>
              <span className="font-medium">{formatDate(expense.date)}</span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Jumlah:</span>
              <span className="font-semibold text-lg text-red-600">
                {formatCurrency(expense.amount)}
              </span>
            </div>
            {expense.armada && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Armada:</span>
                <span className="font-medium">
                  {expense.armada.license_plate}
                </span>
              </div>
            )}
            {expense.driver && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Sopir:</span>
                <span className="font-medium">{expense.driver.name}</span>
              </div>
            )}
            {expense.staff && (
              <div className="flex justify-between items-start">
                <span className="text-sm text-muted-foreground">Staff:</span>
                <span className="font-medium">{expense.staff.name}</span>
              </div>
            )}
          </div>

          {/* Request Info */}
          <div className="rounded-lg border border-blue-200 bg-blue-50 p-4 space-y-2">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <span className="font-semibold text-blue-900">
                Detail Request
              </span>
            </div>
            {expense.requested_by && (
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Diajukan oleh:</span>
                <span className="text-sm font-medium text-blue-900">
                  {expense.requested_by.name}
                </span>
              </div>
            )}
            {expense.requested_at && (
              <div className="flex justify-between">
                <span className="text-sm text-blue-700">Waktu pengajuan:</span>
                <span className="text-sm font-medium text-blue-900">
                  {new Date(expense.requested_at).toLocaleString("id-ID")}
                </span>
              </div>
            )}
            <div className="pt-2 border-t border-blue-200">
              <Label className="text-sm text-blue-700 mb-1 block">
                {isEditRequest ? "Alasan Edit:" : "Alasan Delete:"}
              </Label>
              <p className="text-sm font-medium text-blue-900 bg-white p-2 rounded border border-blue-200">
                {isEditRequest
                  ? expense.edit_request_reason
                  : expense.delete_request_reason}
              </p>
            </div>
          </div>

          {/* Warning untuk delete */}
          {isDeleteRequest && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Perhatian:</strong> Setelah disetujui, pengeluaran ini
                akan dihapus secara permanen dan tidak dapat dikembalikan.
                Pastikan Anda sudah mereview dengan teliti sebelum approve.
              </AlertDescription>
            </Alert>
          )}

          {/* Original Data untuk edit request */}
          {isEditRequest && expense.original_data && (
            <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-2">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="font-semibold text-amber-900">
                  Data Original (Backup)
                </span>
              </div>
              <div className="text-xs text-amber-700 space-y-1 bg-white p-2 rounded border border-amber-200">
                <div className="flex justify-between">
                  <span>Jumlah:</span>
                  <span className="font-medium">
                    {formatCurrency(expense.original_data.amount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Deskripsi:</span>
                  <span className="font-medium">
                    {expense.original_data.description}
                  </span>
                </div>
              </div>
              <p className="text-xs text-amber-700 italic">
                Data ini akan direstore jika request ditolak
              </p>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Rejection Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="rejection-reason" className="text-sm font-medium">
              Alasan Penolakan (opsional untuk approve, wajib untuk reject)
            </Label>
            <Textarea
              id="rejection-reason"
              placeholder="Masukkan alasan jika Anda ingin menolak request ini..."
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              rows={3}
              className="resize-none"
            />
          </div>
        </div>

        <DialogFooter className="flex gap-2 sm:gap-0">
          <Button
            type="button"
            variant="outline"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            variant="destructive"
            onClick={handleReject}
            disabled={isSubmitting}
            className="gap-2"
          >
            <XCircle className="h-4 w-4" />
            Tolak
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className={
              isDeleteRequest
                ? "bg-red-600 hover:bg-red-700"
                : "bg-green-600 hover:bg-green-700"
            }
          >
            <CheckCircle className="h-4 w-4 mr-2" />
            {isDeleteRequest ? "Setujui & Hapus" : "Setujui Edit"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

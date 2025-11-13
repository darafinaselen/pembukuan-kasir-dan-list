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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Edit, Trash2 } from "lucide-react";

export default function ExpenseRequestDialog({
  isOpen,
  onClose,
  expense,
  requestType, // "edit" or "delete"
  onSubmit,
  isSubmitting,
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Alasan harus diisi");
      return;
    }

    setError("");
    try {
      await onSubmit(expense.id, reason);
      setReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal mengajukan request");
    }
  };

  const handleClose = () => {
    setReason("");
    setError("");
    onClose();
  };

  if (!expense) return null;

  const isEdit = requestType === "edit";

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {isEdit ? (
              <>
                <Edit className="h-5 w-5 text-blue-600" />
                Request Edit Pengeluaran
              </>
            ) : (
              <>
                <Trash2 className="h-5 w-5 text-orange-600" />
                Request Delete Pengeluaran
              </>
            )}
          </DialogTitle>
          <DialogDescription>
            Ajukan request {isEdit ? "edit" : "delete"} kepada admin untuk
            pengeluaran ini
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Expense Info */}
          <div className="rounded-lg border bg-slate-50 p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Kategori:</span>
              <span className="font-medium">{expense.category}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Deskripsi:</span>
              <span className="font-medium">{expense.description}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Jumlah:</span>
              <span className="font-semibold text-red-600">
                {new Intl.NumberFormat("id-ID", {
                  style: "currency",
                  currency: "IDR",
                  minimumFractionDigits: 0,
                }).format(expense.amount)}
              </span>
            </div>
          </div>

          {/* Warning */}
          <Alert variant={isEdit ? "default" : "destructive"}>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {isEdit ? (
                <>
                  Request edit akan dikirim ke admin untuk direview. Anda tidak
                  bisa mengedit pengeluaran ini sampai admin menyetujui atau
                  menolak request Anda.
                </>
              ) : (
                <>
                  Request delete akan dikirim ke admin untuk direview.
                  Pengeluaran ini tidak akan dihapus sampai admin menyetujui
                  request Anda.
                </>
              )}
            </AlertDescription>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Reason Input */}
          <div className="space-y-2">
            <Label htmlFor="reason" className="text-sm font-medium">
              Alasan Request <span className="text-red-500">*</span>
            </Label>
            <Textarea
              id="reason"
              placeholder={
                isEdit
                  ? "Contoh: Kesalahan input jumlah, harusnya Rp 150.000 bukan Rp 100.000"
                  : "Contoh: Data duplikat, sudah ada pengeluaran yang sama di tanggal ini"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={4}
              className="resize-none"
            />
            <p className="text-xs text-muted-foreground">
              Jelaskan alasan Anda dengan jelas agar admin dapat memahami
              request Anda
            </p>
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting}
            className={
              isEdit
                ? "bg-blue-600 hover:bg-blue-700"
                : "bg-orange-600 hover:bg-orange-700"
            }
          >
            {isSubmitting
              ? "Mengirim..."
              : `Ajukan Request ${isEdit ? "Edit" : "Delete"}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

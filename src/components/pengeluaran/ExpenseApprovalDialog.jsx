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
import { AlertCircle, CheckCircle, XCircle, Edit, Trash2, FileText, Calendar, DollarSign, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Spinner } from "@/components/ui/spinner";
import { LoadingOverlay } from "@/components/ui/loading-overlay";

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

  const handleOpenChange = (newOpen) => {
    // Prevent closing dialog when submitting
    if (isSubmitting && !newOpen) return;
    onClose();
  };

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
      setError(err.message || "Gagal memproses persetujuan permintaan");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Alasan penolakan wajib diisi untuk memproses penolakan");
      return;
    }

    setError("");
    try {
      await onReject(expense.id, rejectionReason);
      setRejectionReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal memproses penolakan permintaan");
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[650px] max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-3 pb-4 border-b bg-gradient-to-r from-slate-50 to-slate-100/50 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-3">
            {isEditRequest && (
              <>
                <div className="p-2.5 rounded-xl bg-blue-100 ring-1 ring-blue-200">
                  <Edit className="h-5 w-5 text-blue-600" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Persetujuan Permintaan Edit Pengeluaran
                </span>
              </>
            )}
            {isDeleteRequest && (
              <>
                <div className="p-2.5 rounded-xl bg-red-100 ring-1 ring-red-200">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <span className="text-xl font-bold tracking-tight">
                  Persetujuan Permintaan Hapus Pengeluaran
                </span>
              </>
            )}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Tinjau detail permintaan dan putuskan untuk menyetujui atau menolak
            perubahan {isEditRequest ? "edit" : "penghapusan"} yang diajukan operator
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4">
          {/* Expense Info */}
          <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2.5 rounded-xl bg-slate-100 ring-1 ring-slate-200">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-900">Detail Pengeluaran</h3>
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50 ring-1 ring-purple-200">
                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Kategori
                </span>
                <Badge variant="secondary" className="font-medium">
                  {CATEGORY_LABELS[expense.category] || expense.category}
                </Badge>
              </div>
              
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 ring-1 ring-blue-200">
                    <Info className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Deskripsi
                </span>
                <span className="font-medium text-right max-w-xs text-slate-900">
                  {expense.description}
                </span>
              </div>
              
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-50 ring-1 ring-green-200">
                    <Calendar className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Tanggal
                </span>
                <span className="font-medium text-slate-900">{formatDate(expense.date)}</span>
              </div>
              
              <div className="flex justify-between items-start gap-4 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-50 ring-1 ring-red-200">
                    <DollarSign className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  Jumlah
                </span>
                <span className="font-bold text-xl text-red-600">
                  {formatCurrency(expense.amount)}
                </span>
              </div>
              
              {expense.armada && (
                <div className="flex justify-between items-start gap-4 pt-2 border-t border-slate-200">
                  <span className="text-sm text-slate-600">Armada</span>
                  <Badge variant="outline" className="font-medium">
                    {expense.armada.license_plate}
                  </Badge>
                </div>
              )}
              
              {expense.driver && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm text-slate-600">Sopir</span>
                  <span className="font-medium text-slate-900">{expense.driver.name}</span>
                </div>
              )}
              
              {expense.staff && (
                <div className="flex justify-between items-start gap-4">
                  <span className="text-sm text-slate-600">Staff</span>
                  <span className="font-medium text-slate-900">{expense.staff.name}</span>
                </div>
              )}
            </div>
          </div>

          {/* Request Info */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-blue-200">
              <div className="p-2 rounded-xl bg-blue-100 ring-1 ring-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-bold text-blue-900 text-base">
                Detail Permintaan
              </span>
            </div>
            
            <div className="space-y-3">
              {expense.requested_by && (
                <div className="flex justify-between items-center gap-4 bg-white/60 p-3 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-700 font-medium">Diajukan oleh</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-900 border-blue-200">
                    {expense.requested_by.name}
                  </Badge>
                </div>
              )}
              
              {expense.requested_at && (
                <div className="flex justify-between items-center gap-4 bg-white/60 p-3 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-700 font-medium">Waktu pengajuan</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {new Date(expense.requested_at).toLocaleString("id-ID")}
                  </span>
                </div>
              )}
              
              <div className="pt-2 space-y-2">
                <Label className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  {isEditRequest ? "Alasan Edit" : "Alasan Penghapusan"}
                </Label>
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                  <p className="text-sm font-medium text-blue-900 leading-relaxed">
                    {isEditRequest
                      ? expense.edit_request_reason
                      : expense.delete_request_reason}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Warning untuk delete */}
          {isDeleteRequest && (
            <Alert variant="destructive" className="border-l-4 border-red-600 bg-gradient-to-r from-red-50 to-red-100/50 shadow-sm">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-red-100 ring-1 ring-red-200 h-fit">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDescription className="text-red-900 leading-relaxed pt-1">
                  <strong className="font-bold text-red-800">⚠️ Perhatian:</strong> Persetujuan penghapusan akan menghapus
                  data pengeluaran secara permanen. Tindakan ini tidak dapat dibatalkan.
                  Pastikan semua detail telah ditinjau dengan cermat sebelum memutuskan.
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Proposed Changes untuk edit request */}
          {isEditRequest && expense.proposed_changes && (
            <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-green-200">
                <div className="p-2 rounded-xl bg-green-100 ring-1 ring-green-200">
                  <Edit className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-bold text-green-900 text-base">
                  Perubahan yang Diajukan
                </span>
              </div>

              <div className="bg-white/80 p-4 rounded-xl border-2 border-green-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center gap-4 p-2 bg-green-50/50 rounded-lg">
                  <span className="text-sm text-green-700 font-medium">Jumlah</span>
                  <span className="font-bold text-green-900">
                    {formatCurrency(expense.proposed_changes.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 p-2 bg-green-50/50 rounded-lg">
                  <span className="text-sm text-green-700 font-medium">Deskripsi</span>
                  <span className="font-medium text-green-900 text-right">
                    {expense.proposed_changes.description}
                  </span>
                </div>
                {expense.proposed_changes.category && expense.proposed_changes.category !== expense.category && (
                  <div className="flex justify-between items-start gap-4 p-2 bg-green-50/50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Kategori</span>
                    <span className="font-medium text-green-900 text-right">
                      {CATEGORY_LABELS[expense.proposed_changes.category] || expense.proposed_changes.category}
                    </span>
                  </div>
                )}
                {expense.proposed_changes.date && expense.proposed_changes.date !== expense.date && (
                  <div className="flex justify-between items-start gap-4 p-2 bg-green-50/50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Tanggal</span>
                    <span className="font-medium text-green-900 text-right">
                      {formatDate(expense.proposed_changes.date)}
                    </span>
                  </div>
                )}
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs text-green-700 italic">
                  Perubahan ini akan diterapkan jika permintaan disetujui
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Original Data untuk edit request */}
          {isEditRequest && expense.original_data && (
            <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
                <div className="p-2 rounded-xl bg-amber-100 ring-1 ring-amber-200">
                  <AlertCircle className="h-4 w-4 text-amber-600" />
                </div>
                <span className="font-bold text-amber-900 text-base">
                  Data Saat Ini (Akan Direstore jika Ditolak)
                </span>
              </div>

              <div className="bg-white/80 p-4 rounded-xl border-2 border-amber-200 shadow-sm space-y-3">
                <div className="flex justify-between items-center gap-4 p-2 bg-amber-50/50 rounded-lg">
                  <span className="text-sm text-amber-700 font-medium">Jumlah</span>
                  <span className="font-bold text-amber-900">
                    {formatCurrency(expense.amount)}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 p-2 bg-amber-50/50 rounded-lg">
                  <span className="text-sm text-amber-700 font-medium">Deskripsi</span>
                  <span className="font-medium text-amber-900 text-right">
                    {expense.description}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 p-2 bg-amber-50/50 rounded-lg">
                  <span className="text-sm text-amber-700 font-medium">Kategori</span>
                  <span className="font-medium text-amber-900 text-right">
                    {CATEGORY_LABELS[expense.category] || expense.category}
                  </span>
                </div>
                <div className="flex justify-between items-start gap-4 p-2 bg-amber-50/50 rounded-lg">
                  <span className="text-sm text-amber-700 font-medium">Tanggal</span>
                  <span className="font-medium text-amber-900 text-right">
                    {formatDate(expense.date)}
                  </span>
                </div>
              </div>

              <Alert className="bg-amber-50 border-amber-200">
                <Info className="h-4 w-4 text-amber-600" />
                <AlertDescription className="text-xs text-amber-700 italic">
                  Data ini akan dipertahankan jika permintaan ditolak
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <Alert variant="destructive" className="border-l-4 border-red-600 bg-gradient-to-r from-red-50 to-red-100/50 shadow-sm">
              <div className="flex gap-3">
                <div className="p-2 rounded-lg bg-red-100 ring-1 ring-red-200 h-fit">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDescription className="text-red-900 leading-relaxed pt-1">
                  {error}
                </AlertDescription>
              </div>
            </Alert>
          )}

          {/* Rejection Reason Input */}
          <div className="space-y-3">
            <Label htmlFor="rejection-reason" className="text-sm font-semibold text-slate-900 flex items-center gap-2">
              <Info className="h-4 w-4 text-slate-600" />
              Alasan Penolakan
              <span className="text-xs font-normal text-slate-500">
                (wajib untuk penolakan)
              </span>
            </Label>
            <div className="relative">
              <Textarea
                id="rejection-reason"
                placeholder="Jelaskan alasan penolakan permintaan ini..."
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                rows={3}
                maxLength={500}
                className="resize-none rounded-xl border-2 focus:border-red-300 focus:ring-4 focus:ring-red-100 transition-all"
                disabled={isSubmitting}
              />
              <div className="mt-2 flex justify-between items-center text-xs">
                <span className="text-slate-500">
                  Minimal 10 karakter untuk penolakan
                </span>
                <span className={`font-medium ${rejectionReason.length > 450 ? 'text-red-600' : 'text-slate-400'}`}>
                  {rejectionReason.length}/500
                </span>
              </div>
            </div>
          </div>
        </div>

        <LoadingOverlay
          isVisible={isSubmitting}
          message="Memproses permintaan..."
        />

        <DialogFooter className="flex gap-3 sm:gap-3 flex-shrink-0 bg-gradient-to-r from-slate-50 to-slate-100/50 -mx-6 -mb-6 px-6 py-4 border-t rounded-b-lg">
           <Button
             type="button"
             variant="outline"
             onClick={onClose}
             disabled={isSubmitting}
             className="rounded-xl px-6 py-2.5 border-2 hover:bg-slate-50"
           >
             Batal
           </Button>
           <Button
             type="button"
             variant="destructive"
             onClick={handleReject}
             disabled={isSubmitting || !rejectionReason.trim()}
             className="gap-2 rounded-xl px-6 py-2.5 bg-red-600 hover:bg-red-700 shadow-sm"
           >
             {isSubmitting ? (
               <Spinner size="sm" />
             ) : (
               <XCircle className="h-4 w-4" />
             )}
             Tolak Permintaan
           </Button>
           <Button
             type="button"
             onClick={handleApprove}
             disabled={isSubmitting}
             className={`gap-2 rounded-xl px-6 py-2.5 shadow-sm ${
               isDeleteRequest
                 ? "bg-red-600 hover:bg-red-700"
                 : "bg-green-600 hover:bg-green-700"
             }`}
           >
             {isSubmitting ? (
               <Spinner size="sm" />
             ) : (
               <CheckCircle className="h-4 w-4" />
             )}
             {isDeleteRequest ? "Setujui Penghapusan" : "Setujui Perubahan"}
           </Button>
         </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

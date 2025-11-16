"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CheckCircle, Edit, Trash2, FileText, Calendar, DollarSign } from "lucide-react";

export default function ExpenseRequestDialog({
  isOpen,
  onClose,
  expense,
  requestType, // "edit" or "delete"
  onSubmit,
  isSubmitting,
  proposedChanges, // For edit requests
}) {
  const [reason, setReason] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async () => {
    if (!reason.trim()) {
      setError("Alasan permintaan wajib diisi");
      return;
    }

    setError("");
    try {
      await onSubmit(expense.id, reason);
      setReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal mengirim permintaan");
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
      <DialogContent className="sm:max-w-[540px] max-h-[90vh] flex flex-col p-0 gap-0 overflow-hidden">
        {/* Header dengan warna background */}
        <div className={`border-b px-6 py-6 ${isEdit ? "bg-gradient-to-br from-blue-50 to-blue-100/50" : "bg-gradient-to-br from-orange-50 to-orange-100/50"}`}>
          <DialogHeader className="space-y-0">
            <DialogTitle className={`flex items-center gap-3.5 text-lg font-bold ${isEdit ? "text-blue-900" : "text-orange-900"}`}>
              <div className={`p-2.5 rounded-xl shadow-sm ${isEdit ? "bg-blue-100 ring-1 ring-blue-200" : "bg-orange-100 ring-1 ring-orange-200"}`}>
                {isEdit ? (
                  <Edit className="h-5 w-5 text-blue-600" />
                ) : (
                  <Trash2 className="h-5 w-5 text-orange-600" />
                )}
              </div>
              <span>Permintaan {isEdit ? "Edit" : "Hapus"} Pengeluaran</span>
            </DialogTitle>
            <p className={`text-sm mt-2 leading-relaxed ${isEdit ? "text-blue-700/90" : "text-orange-700/90"}`}>
              Ajukan permintaan {isEdit ? "perubahan" : "penghapusan"} data pengeluaran kepada administrator
            </p>
          </DialogHeader>
        </div>

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          {/* Expense Information Card */}
          <div className="rounded-xl border border-slate-200 bg-gradient-to-br from-white to-slate-50/30 p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-2 pb-3 border-b border-slate-200">
              <div className="p-1.5 rounded-lg bg-slate-100">
                <FileText className="h-4 w-4 text-slate-600" />
              </div>
              <h3 className="font-semibold text-slate-900 text-sm">Informasi Pengeluaran</h3>
            </div>
            
            {/* Category */}
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 ring-1 ring-slate-200 mt-0.5 flex-shrink-0">
                <FileText className="h-4.5 w-4.5 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Kategori</p>
                <p className="text-sm font-bold text-slate-900 truncate">{expense.category}</p>
              </div>
            </div>

            {/* Description */}
            <div className="flex items-start gap-4">
              <div className="p-2.5 rounded-xl bg-slate-100 ring-1 ring-slate-200 mt-0.5 flex-shrink-0">
                <FileText className="h-4.5 w-4.5 text-slate-600" />
              </div>
              <div className="flex-1 min-w-0 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Deskripsi</p>
                <p className="text-sm font-bold text-slate-900 line-clamp-2 leading-relaxed">{expense.description}</p>
              </div>
            </div>

            {/* Amount - Highlighted */}
            <div className="flex items-start gap-4 pt-4 border-t border-slate-200">
              <div className="p-2.5 rounded-xl bg-red-100 ring-1 ring-red-200 mt-0.5 flex-shrink-0">
                <DollarSign className="h-4.5 w-4.5 text-red-600" />
              </div>
              <div className="flex-1 space-y-1">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Jumlah</p>
                <p className="text-xl font-extrabold text-red-600">
                  {new Intl.NumberFormat("id-ID", {
                    style: "currency",
                    currency: "IDR",
                    minimumFractionDigits: 0,
                  }).format(expense.amount)}
                </p>
              </div>
            </div>

            {/* Date if available */}
            {expense.date && (
              <div className="flex items-start gap-4 pt-4 border-t border-slate-200">
                <div className="p-2.5 rounded-xl bg-slate-100 ring-1 ring-slate-200 mt-0.5 flex-shrink-0">
                  <Calendar className="h-4.5 w-4.5 text-slate-600" />
                </div>
                <div className="flex-1 space-y-1">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Tanggal</p>
                  <p className="text-sm font-bold text-slate-900">
                    {new Date(expense.date).toLocaleDateString("id-ID", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Proposed Changes for Edit */}
          {isEdit && proposedChanges && (
            <div className="rounded-xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-green-100/50 p-5 space-y-4 shadow-sm">
              <div className="flex items-center gap-3 pb-3 border-b border-green-200">
                <div className="p-2 rounded-xl bg-green-100 ring-1 ring-green-200">
                  <Edit className="h-4 w-4 text-green-600" />
                </div>
                <span className="font-bold text-green-900 text-base">
                  Perubahan yang Akan Diajukan
                </span>
              </div>

              <div className="bg-white/80 p-4 rounded-xl border-2 border-green-200 shadow-sm space-y-3">
                {proposedChanges.amount !== undefined && proposedChanges.amount !== expense.amount && (
                  <div className="flex justify-between items-center gap-4 p-2 bg-green-50/50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Jumlah</span>
                    <span className="font-bold text-green-900">
                      {new Intl.NumberFormat("id-ID", {
                        style: "currency",
                        currency: "IDR",
                        minimumFractionDigits: 0,
                      }).format(proposedChanges.amount)}
                    </span>
                  </div>
                )}
                {proposedChanges.description && proposedChanges.description !== expense.description && (
                  <div className="flex justify-between items-start gap-4 p-2 bg-green-50/50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Deskripsi</span>
                    <span className="font-medium text-green-900 text-right max-w-xs">
                      {proposedChanges.description}
                    </span>
                  </div>
                )}
                {proposedChanges.category && proposedChanges.category !== expense.category && (
                  <div className="flex justify-between items-start gap-4 p-2 bg-green-50/50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Kategori</span>
                    <span className="font-medium text-green-900 text-right">
                      {proposedChanges.category}
                    </span>
                  </div>
                )}
                {proposedChanges.date && proposedChanges.date !== expense.date && (
                  <div className="flex justify-between items-start gap-4 p-2 bg-green-50/50 rounded-lg">
                    <span className="text-sm text-green-700 font-medium">Tanggal</span>
                    <span className="font-medium text-green-900 text-right">
                      {new Date(proposedChanges.date).toLocaleDateString("id-ID", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                )}
                {(!proposedChanges.amount || proposedChanges.amount === expense.amount) &&
                 (!proposedChanges.description || proposedChanges.description === expense.description) &&
                 (!proposedChanges.category || proposedChanges.category === expense.category) &&
                 (!proposedChanges.date || proposedChanges.date === expense.date) && (
                  <div className="text-center py-4 text-green-700">
                    <p className="font-medium">Tidak ada perubahan yang terdeteksi</p>
                    <p className="text-sm">Pastikan Anda telah mengubah data sebelum mengajukan permintaan</p>
                  </div>
                )}
              </div>

              <Alert className="bg-green-50 border-green-200">
                <CheckCircle className="h-4 w-4 text-green-600" />
                <AlertDescription className="text-xs text-green-700 italic">
                  Perubahan ini akan diterapkan jika permintaan disetujui oleh administrator
                </AlertDescription>
              </Alert>
            </div>
          )}

          {/* Warning Alert */}
          <Alert className={`rounded-xl border-l-4 shadow-sm ${isEdit ? "bg-gradient-to-br from-blue-50 to-blue-100/30 border-blue-400" : "bg-gradient-to-br from-orange-50 to-orange-100/30 border-orange-400"}`}>
            <div className="flex items-start gap-4">
              <div className={`p-2 rounded-lg flex-shrink-0 ${isEdit ? "bg-blue-100" : "bg-orange-100"}`}>
                <AlertCircle className={`h-5 w-5 ${isEdit ? "text-blue-600" : "text-orange-600"}`} />
              </div>
              <AlertDescription className={`flex-1 space-y-2 ${isEdit ? "text-blue-900" : "text-orange-900"}`}>
                <p className="font-bold text-sm">
                  {isEdit ? "Permintaan Perubahan" : "Permintaan Penghapusan"}
                </p>
                <p className="text-sm leading-relaxed">
                  {isEdit ? (
                    "Permintaan ini akan dikirim ke administrator untuk ditinjau. Data pengeluaran tidak akan diubah sampai permintaan disetujui."
                  ) : (
                    "Permintaan ini akan dikirim ke administrator untuk ditinjau. Data pengeluaran akan tetap ada sampai permintaan disetujui."
                  )}
                </p>
              </AlertDescription>
            </div>
          </Alert>

          {/* Error Message */}
          {error && (
            <Alert className="rounded-xl border-l-4 border-red-400 bg-gradient-to-br from-red-50 to-red-100/30 shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-2 rounded-lg bg-red-100 flex-shrink-0">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
                <AlertDescription className="text-red-900 font-semibold text-sm flex-1">{error}</AlertDescription>
              </div>
            </Alert>
          )}

          {/* Reason Input */}
          <div className="space-y-3.5">
            <div className="flex items-center justify-between gap-4">
              <Label htmlFor="reason" className="text-sm font-bold text-slate-900">
                Alasan Permintaan <span className="text-red-500">*</span>
              </Label>
              <span className={`text-xs font-semibold px-2 py-1 rounded-md ${reason.length > 450 ? "bg-red-100 text-red-700" : "bg-slate-100 text-slate-600"}`}>
                {reason.length}/500
              </span>
            </div>
            <Textarea
              id="reason"
              placeholder={
                isEdit
                  ? "Contoh: Kesalahan input jumlah, seharusnya Rp 150.000 bukan Rp 100.000"
                  : "Contoh: Data duplikat, sudah ada pengeluaran yang sama di tanggal ini"
              }
              value={reason}
              onChange={(e) => setReason(e.target.value.slice(0, 500))}
              rows={4}
              className="resize-none rounded-xl border-2 border-slate-300 bg-white px-4 py-3 text-sm leading-relaxed shadow-sm transition-all focus:border-blue-500 focus:ring-4 focus:ring-blue-100 placeholder:text-slate-400"
            />
            <div className="flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-slate-400 mt-0.5 flex-shrink-0" />
              <p className="text-xs text-slate-500 leading-relaxed">
                Jelaskan alasan Anda dengan jelas agar administrator dapat memahami permintaan ini
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 border-t bg-gradient-to-br from-slate-50 to-slate-100/50 px-6 py-5 flex gap-3 justify-end">
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-xl px-5 py-2.5 font-semibold border-2 hover:bg-slate-100 transition-all"
          >
            Batal
          </Button>
          <Button
            type="button"
            onClick={handleSubmit}
            disabled={isSubmitting || !reason.trim()}
            className={`rounded-xl px-6 py-2.5 font-bold shadow-md transition-all ${
              isEdit
                ? "bg-blue-600 hover:bg-blue-700 hover:shadow-lg text-white disabled:bg-blue-400"
                : "bg-orange-600 hover:bg-orange-700 hover:shadow-lg text-white disabled:bg-orange-400"
            }`}
          >
            {isSubmitting ? (
              <div className="flex items-center gap-2.5">
                <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Mengirim...</span>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                {isEdit ? <Edit className="h-4 w-4" /> : <Trash2 className="h-4 w-4" />}
                <span>{isEdit ? "Ajukan Perubahan" : "Ajukan Penghapusan"}</span>
              </div>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

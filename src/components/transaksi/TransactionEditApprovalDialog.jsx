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
import { AlertCircle, CheckCircle, XCircle, Edit, FileText, Calendar, DollarSign, Info, User } from "lucide-react";
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

function formatDateTime(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleString("id-ID");
}

export default function TransactionEditApprovalDialog({
  isOpen,
  onClose,
  transaction,
  onApproveEdit,
  onRejectEdit,
  isSubmitting,
}) {
  const [rejectionReason, setRejectionReason] = useState("");
  const [error, setError] = useState("");

  if (!transaction) return null;

  const handleOpenChange = (newOpen) => {
    // Prevent closing dialog when submitting
    if (isSubmitting && !newOpen) return;
    onClose();
  };

  const handleApprove = async () => {
    setError("");
    try {
      await onApproveEdit(transaction.id);
      setRejectionReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal memproses persetujuan permintaan edit");
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError("Alasan penolakan wajib diisi untuk memproses penolakan");
      return;
    }

    setError("");
    try {
      await onRejectEdit(transaction.id, rejectionReason);
      setRejectionReason("");
      onClose();
    } catch (err) {
      setError(err.message || "Gagal memproses penolakan permintaan edit");
    }
  };

  const originalData = transaction.original_data || {};
  const proposedChanges = transaction.proposed_changes || {};

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader className="space-y-3 pb-4 border-b bg-gradient-to-r from-blue-50 to-blue-100/50 -mx-6 -mt-6 px-6 pt-6 rounded-t-lg">
          <DialogTitle className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100 ring-1 ring-blue-200">
              <Edit className="h-5 w-5 text-blue-600" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Persetujuan Permintaan Edit Transaksi
            </span>
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            Tinjau data original dan perubahan yang diusulkan, kemudian putuskan untuk menyetujui atau menolak
            permintaan edit transaksi ini
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto space-y-5 py-4">
          {/* Transaction Info */}
          <div className="rounded-xl border-2 border-slate-200 bg-gradient-to-br from-white to-slate-50/50 p-6 space-y-5 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-200">
              <div className="p-2.5 rounded-xl bg-slate-100 ring-1 ring-slate-200">
                <FileText className="h-5 w-5 text-slate-600" />
              </div>
              <h3 className="font-bold text-slate-900">Detail Transaksi</h3>
            </div>

            <div className="space-y-4">
              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-purple-50 ring-1 ring-purple-200">
                    <FileText className="h-3.5 w-3.5 text-purple-600" />
                  </div>
                  Invoice
                </span>
                <Badge variant="secondary" className="font-medium">
                  {transaction.invoice_code}
                </Badge>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-blue-50 ring-1 ring-blue-200">
                    <User className="h-3.5 w-3.5 text-blue-600" />
                  </div>
                  Pelanggan
                </span>
                <span className="font-medium text-right max-w-xs text-slate-900">
                  {transaction.customer_name}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-green-50 ring-1 ring-green-200">
                    <Calendar className="h-3.5 w-3.5 text-green-600" />
                  </div>
                  Tanggal Booking
                </span>
                <span className="font-medium text-slate-900">{formatDate(transaction.booking_date)}</span>
              </div>

              <div className="flex justify-between items-start gap-4 pt-2 border-t border-slate-200">
                <span className="text-sm text-slate-600 flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-red-50 ring-1 ring-red-200">
                    <DollarSign className="h-3.5 w-3.5 text-red-600" />
                  </div>
                  Tarif Sewa
                </span>
                <span className="font-bold text-xl text-red-600">
                  {formatCurrency(transaction.all_in_rate)}
                </span>
              </div>
            </div>
          </div>

          {/* Request Info */}
          <div className="rounded-xl border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100/50 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-blue-200">
              <div className="p-2 rounded-xl bg-blue-100 ring-1 ring-blue-200">
                <AlertCircle className="h-4 w-4 text-blue-600" />
              </div>
              <span className="font-bold text-blue-900 text-base">
                Detail Permintaan Edit
              </span>
            </div>

            <div className="space-y-3">
              {transaction.requested_by && (
                <div className="flex justify-between items-center gap-4 bg-white/60 p-3 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-700 font-medium">Diajukan oleh</span>
                  <Badge variant="secondary" className="bg-blue-100 text-blue-900 border-blue-200">
                    {transaction.requested_by.name}
                  </Badge>
                </div>
              )}

              {transaction.requested_at && (
                <div className="flex justify-between items-center gap-4 bg-white/60 p-3 rounded-lg border border-blue-100">
                  <span className="text-sm text-blue-700 font-medium">Waktu pengajuan</span>
                  <span className="text-sm font-semibold text-blue-900">
                    {formatDateTime(transaction.requested_at)}
                  </span>
                </div>
              )}

              <div className="pt-2 space-y-2">
                <Label className="text-sm text-blue-700 font-semibold flex items-center gap-2">
                  <Info className="h-4 w-4" />
                  Alasan Edit
                </Label>
                <div className="bg-white p-4 rounded-xl border-2 border-blue-200 shadow-sm">
                  <p className="text-sm font-medium text-blue-900 leading-relaxed">
                    {transaction.edit_request_reason}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Comparison: Original vs Proposed */}
          <div className="rounded-xl border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-amber-100/50 p-5 space-y-4 shadow-sm">
            <div className="flex items-center gap-3 pb-3 border-b border-amber-200">
              <div className="p-2 rounded-xl bg-amber-100 ring-1 ring-amber-200">
                <AlertCircle className="h-4 w-4 text-amber-600" />
              </div>
              <span className="font-bold text-amber-900 text-base">
                Perbandingan Data
              </span>
            </div>

            <div className="bg-white/80 p-4 rounded-xl border-2 border-amber-200 shadow-sm space-y-4">
              {/* Customer Name */}
              {(originalData.customer_name !== proposedChanges.customer_name) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-700">Nama Pelanggan</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-xs text-red-600 font-medium">Original:</span>
                      <p className="text-sm text-red-900">{originalData.customer_name || transaction.customer_name}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs text-green-600 font-medium">Proposed:</span>
                      <p className="text-sm text-green-900">{proposedChanges.customer_name}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Customer Phone */}
              {(originalData.customer_phone !== proposedChanges.customer_phone) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-700">No. HP</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-xs text-red-600 font-medium">Original:</span>
                      <p className="text-sm text-red-900">{originalData.customer_phone || transaction.customer_phone}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs text-green-600 font-medium">Proposed:</span>
                      <p className="text-sm text-green-900">{proposedChanges.customer_phone}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* All In Rate */}
              {(originalData.all_in_rate !== proposedChanges.all_in_rate) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-700">Tarif Sewa</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-xs text-red-600 font-medium">Original:</span>
                      <p className="text-sm text-red-900 font-bold">{formatCurrency(originalData.all_in_rate || transaction.all_in_rate)}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs text-green-600 font-medium">Proposed:</span>
                      <p className="text-sm text-green-900 font-bold">{formatCurrency(proposedChanges.all_in_rate)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Overtime Rate */}
              {(originalData.overtime_rate_per_hour !== proposedChanges.overtime_rate_per_hour) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-700">Overtime/Jam</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-xs text-red-600 font-medium">Original:</span>
                      <p className="text-sm text-red-900 font-bold">{formatCurrency(originalData.overtime_rate_per_hour || transaction.overtime_rate_per_hour)}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs text-green-600 font-medium">Proposed:</span>
                      <p className="text-sm text-green-900 font-bold">{formatCurrency(proposedChanges.overtime_rate_per_hour)}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* DP Amount */}
              {(originalData.dp_amount !== proposedChanges.dp_amount) && (
                <div className="space-y-2">
                  <Label className="text-sm font-medium text-amber-700">DP Amount</Label>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="p-2 bg-red-50 rounded border border-red-200">
                      <span className="text-xs text-red-600 font-medium">Original:</span>
                      <p className="text-sm text-red-900 font-bold">{formatCurrency(originalData.dp_amount || transaction.dp_amount || 0)}</p>
                    </div>
                    <div className="p-2 bg-green-50 rounded border border-green-200">
                      <span className="text-xs text-green-600 font-medium">Proposed:</span>
                      <p className="text-sm text-green-900 font-bold">{formatCurrency(proposedChanges.dp_amount || 0)}</p>
                    </div>
                  </div>
                </div>
              )}

              {Object.keys(proposedChanges).length === 0 && (
                <div className="text-center py-4">
                  <p className="text-sm text-amber-700 italic">Tidak ada perubahan data yang terdeteksi</p>
                </div>
              )}
            </div>

            <Alert className="bg-amber-50 border-amber-200">
              <Info className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-xs text-amber-700 italic">
                Jika disetujui, data akan diubah sesuai dengan yang diusulkan. Jika ditolak, data akan tetap seperti original.
              </AlertDescription>
            </Alert>
          </div>

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
                placeholder="Jelaskan alasan penolakan permintaan edit ini..."
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
          message="Memproses permintaan edit..."
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
            Tolak Edit
          </Button>
          <Button
            type="button"
            onClick={handleApprove}
            disabled={isSubmitting}
            className="gap-2 rounded-xl px-6 py-2.5 bg-green-600 hover:bg-green-700 shadow-sm"
          >
            {isSubmitting ? (
              <Spinner size="sm" />
            ) : (
              <CheckCircle className="h-4 w-4" />
            )}
            Setujui Edit
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
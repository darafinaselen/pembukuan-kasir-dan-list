"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  CalendarDays,
  Tag,
  FileText,
  DollarSign,
  Car,
  User,
  Briefcase,
  Download,
  File,
  Image,
  FileSpreadsheet,
} from "lucide-react";

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

function formatMonth(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
  });
}

function formatCategory(category) {
  const categoryMap = {
    LISTRIK: "Listrik",
    INTERNET: "Internet",
    PAKET_DATA: "Paket Data",
    KONSUMSI: "Konsumsi",
    GAJI_STAF_OPERASIONAL: "Gaji Staf Operasional",
    GAJI_STAF_ADMIN: "Gaji Staf Admin",
    PAJAK: "Pajak",
    ALAT_TULIS_KANTOR: "Alat Tulis Kantor (ATK)",
    KOMPUTER_SUPPLIES: "Komputer Supplies",
    OPERASIONAL_LAINNYA: "Operasional Lainnya",
    BBM: "BBM (Armada)",
    PERAWATAN_ARMADA: "Perawatan Armada",
    GAJI_SOPIR: "Gaji Sopir",
  };
  return categoryMap[category] || category;
}

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-5 w-5 text-blue-500" />;
  } else if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return <FileSpreadsheet className="h-5 w-5 text-green-500" />;
  } else if (mimeType.includes("pdf")) {
    return <FileText className="h-5 w-5 text-red-500" />;
  }
  return <File className="h-5 w-5 text-gray-500" />;
}

export default function PengeluaranDetailModal({ open, onOpenChange, data }) {
  if (!data) return null;

  const handleDownloadFile = async (fileId, fileName) => {
    try {
      const res = await fetch(`/api/expenses/${data.id}/files/${fileId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Gagal mendownload file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      alert("Gagal mendownload file: " + err.message);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Detail Pengeluaran</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Basic Information Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informasi Dasar</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Tanggal Transaksi</span>
                  </div>
                  <p className="font-medium">{formatDate(data.date)}</p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <CalendarDays className="h-4 w-4" />
                    <span>Bulan/Periode</span>
                  </div>
                  <p className="font-medium">
                    {formatMonth(data.paymentMonth)}
                  </p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Tag className="h-4 w-4" />
                  <span>Kategori</span>
                </div>
                <Badge variant="secondary" className="text-sm">
                  {formatCategory(data.category)}
                </Badge>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="h-4 w-4" />
                  <span>Deskripsi</span>
                </div>
                <p className="font-medium">{data.description}</p>
              </div>

              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <DollarSign className="h-4 w-4" />
                  <span>Jumlah</span>
                </div>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(data.amount)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Related Information Card */}
          {(data.armada || data.driver || data.staff) && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Informasi Terkait</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {data.armada && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Car className="h-4 w-4" />
                      <span>Armada</span>
                    </div>
                    <p className="font-medium">
                      {data.armada.license_plate} - {data.armada.brand}{" "}
                      {data.armada.model}
                    </p>
                  </div>
                )}

                {data.driver && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <User className="h-4 w-4" />
                      <span>Sopir</span>
                    </div>
                    <p className="font-medium">{data.driver.driver_name}</p>
                  </div>
                )}

                {data.staff && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Briefcase className="h-4 w-4" />
                      <span>Staff</span>
                    </div>
                    <p className="font-medium">
                      {data.staff.staff_name} ({data.staff.position})
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Attachments Card */}
          {data.attachments && data.attachments.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Lampiran File</CardTitle>
                <CardDescription>
                  {data.attachments.length} file terlampir
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {data.attachments.map((file) => (
                    <div
                      key={file.id}
                      className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        {getFileIcon(file.mimeType)}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">
                            {file.fileName}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatFileSize(file.fileSize)} •{" "}
                            {new Date(file.createdAt).toLocaleDateString(
                              "id-ID"
                            )}
                          </p>
                        </div>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          handleDownloadFile(file.id, file.fileName)
                        }
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Metadata Card */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Dibuat pada</span>
                <span className="font-medium">
                  {new Date(data.createdAt).toLocaleString("id-ID", {
                    dateStyle: "long",
                    timeStyle: "short",
                  })}
                </span>
              </div>
              {data.updatedAt && data.updatedAt !== data.createdAt && (
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Terakhir diubah</span>
                  <span className="font-medium">
                    {new Date(data.updatedAt).toLocaleString("id-ID", {
                      dateStyle: "long",
                      timeStyle: "short",
                    })}
                  </span>
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Tutup</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

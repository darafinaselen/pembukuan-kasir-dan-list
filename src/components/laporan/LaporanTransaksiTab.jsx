"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { exportToExcel } from "@/lib/utils";
import { cn } from "@/lib/utils";

const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function LaporanTransaksiTab({ data, isLoading }) {
  const handleDownload = () => {
    if (!data) return;
    const excelData = [
      {
        Deskripsi: "Total Transaksi (Order)",
        Jumlah: data.totalTransaksi,
      },
      {
        Deskripsi: "Total Pemasukan Sewa",
        Jumlah: data.totalPemasukan,
      },
      {
        Deskripsi: "Total Pengeluaran (BBM + Gaji)",
        Jumlah: data.totalPengeluaranOps,
      },
      {
        Deskripsi: "Total Laba Kotor",
        Jumlah: data.totalLabaKotor,
      },
    ];
    exportToExcel(excelData, "Laporan_Transaksi_Laba_Kotor");
  };

  if (isLoading) {
    return <Skeleton className="h-64 w-full" />;
  }

  if (!data) {
    return (
      <div className="p-4 text-center">
        Tidak ada data untuk rentang tanggal ini.
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <div className="p-4">
        <Button onClick={handleDownload} size="sm" className="mb-4">
          <Download className="mr-2 h-4 w-4" />
          Download Laporan (Excel)
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-4 pt-0">
        <StatCard
          title="Total Transaksi"
          value={data.totalTransaksi || 0}
          unit="Order"
        />
        <StatCard
          title="Total Pemasukan"
          value={formatCurrency(data.totalPemasukan)}
          isCurrency
        />
        <StatCard
          title="Total Pengeluaran (Ops)"
          value={formatCurrency(data.totalPengeluaranOps)}
          isCurrency
        />
        <StatCard
          title="Total Laba Kotor"
          value={formatCurrency(data.totalLabaKotor)}
          isCurrency
          isPositive={data.totalLabaKotor > 0}
        />
      </div>
    </div>
  );
}

const StatCard = ({ title, value, unit, isCurrency, isPositive }) => (
  <div className="rounded-md border bg-card p-4">
    <div className="text-sm font-medium text-muted-foreground">{title}</div>
    <div
      className={cn(
        "text-2xl font-bold",
        isCurrency && (isPositive ? "text-green-600" : "text-red-600"),
        isCurrency && !isPositive && "text-inherit"
      )}
    >
      {value} {!isCurrency && unit}
    </div>
  </div>
);

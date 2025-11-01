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

export default function LaporanLabaRugiTab({ data, isLoading }) {
  const handleDownload = () => {
    if (!data) return;
    const excelData = [
      { Kategori: "Total Pemasukan Sewa", Jumlah: data.totalPemasukanSewa },
      {
        Kategori: "Total Biaya Operasional (Transaksi)",
        Jumlah: -data.totalBiayaOps,
      },
      {
        Kategori: "Total Biaya Operasional (Kantor)",
        Jumlah: -data.totalBiayaKantor,
      },
      { Kategori: "LABA / RUGI BERSIH", Jumlah: data.labaRugiBersih },
    ];
    exportToExcel(excelData, "Laporan_Laba_Rugi");
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

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <tbody>
            <tr className="border-b">
              <td className="p-4 font-medium">PEMASUKAN</td>
              <td className="p-4"></td>
            </tr>
            <tr className="border-b">
              <td className="p-4 pl-8">Total Pendapatan Sewa</td>
              <td className="p-4 text-right font-medium">
                {formatCurrency(data.totalPemasukanSewa)}
              </td>
            </tr>

            <tr className="border-b">
              <td className="p-4 font-medium">PENGELUARAN</td>
              <td className="p-4"></td>
            </tr>
            <tr className="border-b">
              <td className="p-4 pl-8">
                Total Biaya Operasional (BBM & Gaji Sopir)
              </td>
              <td className="p-4 text-right font-medium text-red-600">
                ({formatCurrency(data.totalBiayaOps)})
              </td>
            </tr>
            <tr className="border-b">
              <td className="p-4 pl-8">Total Biaya Operasional Kantor</td>
              <td className="p-4 text-right font-medium text-red-600">
                ({formatCurrency(data.totalBiayaKantor)})
              </td>
            </tr>

            <tr className="bg-muted">
              <td className="p-4 font-bold text-base">LABA / RUGI BERSIH</td>
              <td
                className={cn(
                  "p-4 text-right font-bold text-base",
                  data.labaRugiBersih >= 0 ? "text-green-600" : "text-red-600"
                )}
              >
                {formatCurrency(data.labaRugiBersih)}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

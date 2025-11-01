"use client";
import React from "react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { exportToExcel } from "@/lib/utils";
import { cn } from "@/lib/utils";

// Helper
const formatCurrency = (amount) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount || 0);

export default function LaporanRekapTab({ rekapBBM, rekapGaji, isLoading }) {
  const handleDownloadBBM = () => {
    console.log("--- DEBUG: handleDownloadBBM dipanggil ---");
    console.log("Menerima rekapBBM:", rekapBBM);
    if (!rekapBBM || rekapBBM.length === 0) return;

    const cleanData = rekapBBM.map((item) => ({
      Bulan: item.bulan,
      "Plat Mobil (Model)": item.platMobil,
      "Total Biaya BBM": item.totalBBM,
    }));

    exportToExcel(cleanData, "Laporan_Rekap_BBM");
  };

  const handleDownloadGaji = () => {
    console.log("--- DEBUG: handleDownloadGaji dipanggil ---");
    console.log("Menerima rekapGaji:", rekapGaji);
    if (!rekapGaji || rekapGaji.length === 0) return;

    const cleanData = rekapGaji.map((item) => ({
      Bulan: item.bulan,
      "Nama Sopir": item.namaSopir,
      "Total Gaji": item.totalGaji,
    }));

    exportToExcel(cleanData, "Laporan_Rekap_Gaji_Sopir");
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="rounded-md border">
        <div className="flex justify-between items-center p-4">
          <h3 className="font-semibold">Rekap Biaya BBM per Armada</h3>
          <Button onClick={handleDownloadBBM} size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bulan</TableHead>
              <TableHead>Plat Mobil (Model)</TableHead>
              <TableHead className="text-right">Total Biaya BBM</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rekapBBM && rekapBBM.length > 0 ? (
              rekapBBM.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="whitespace-nowrap">
                    {item.bulan}
                  </TableCell>
                  <TableCell>{item.platMobil}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.totalBBM)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="rounded-md border">
        <div className="flex justify-between items-center p-4">
          <h3 className="font-semibold">Rekap Gaji per Sopir</h3>
          <Button onClick={handleDownloadGaji} size="sm" variant="outline">
            <Download className="mr-2 h-4 w-4" /> Download
          </Button>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bulan</TableHead>
              <TableHead>Nama Sopir</TableHead>
              <TableHead className="text-right">Total Gaji</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rekapGaji && rekapGaji.length > 0 ? (
              rekapGaji.map((item, index) => (
                <TableRow key={index}>
                  <TableCell className="whitespace-nowrap">
                    {item.bulan}
                  </TableCell>
                  <TableCell>{item.namaSopir}</TableCell>
                  <TableCell className="text-right">
                    {formatCurrency(item.totalGaji)}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="text-center h-24">
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

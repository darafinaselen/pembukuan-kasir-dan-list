"use client";

import React, { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import LaporanFilter from "@/components/laporan/LaporanFilter";
import LaporanTransaksiTab from "@/components/laporan/LaporanTransaksiTab";
import LaporanLabaRugiTab from "@/components/laporan/LaporanLabaRugiTab";
import LaporanRekapTab from "@/components/laporan/LaporanRekapTab";

const getThisMonthRange = () => {
  const start = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const end = new Date();
  return { from: start, to: end };
};

export default function LaporanPage() {
  const [dateRange, setDateRange] = useState(getThisMonthRange);
  const [reportData, setReportData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchReportData = async () => {
    if (!dateRange.from || !dateRange.to) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        from: dateRange.from.toISOString(),
        to: dateRange.to.toISOString(),
      });

      const res = await fetch(`/api/laporan/ringkasan?${params.toString()}`);
      if (!res.ok) throw new Error("Gagal mengambil data laporan");

      const data = await res.json();
      setReportData(data);
    } catch (err) {
      console.error(err);
      setReportData(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, [dateRange]);

  return (
    <div className="flex w-full flex-col gap-4">
      <LaporanFilter
        dateRange={dateRange}
        onDateChange={setDateRange}
        onRefresh={fetchReportData}
        isLoading={isLoading}
      />

      <Tabs defaultValue="laporan-transaksi" className="w-full">
        <TabsList className="grid w-full grid-cols-3 md:w-[700px]">
          <TabsTrigger value="laporan-transaksi">Laporan Transaksi</TabsTrigger>
          <TabsTrigger value="laporan-laba-rugi">Laporan Laba Rugi</TabsTrigger>
          <TabsTrigger value="laporan-rekap">Rekapitulasi</TabsTrigger>
        </TabsList>

        <TabsContent value="laporan-transaksi" className="mt-4">
          <LaporanTransaksiTab
            data={reportData?.laporanTransaksi}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="laporan-laba-rugi" className="mt-4">
          <LaporanLabaRugiTab
            data={reportData?.laporanLabaRugi}
            isLoading={isLoading}
          />
        </TabsContent>

        <TabsContent value="laporan-rekap" className="mt-4">
          <LaporanRekapTab
            rekapBBM={reportData?.rekapBBM}
            rekapGaji={reportData?.rekapGaji}
            isLoading={isLoading}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}

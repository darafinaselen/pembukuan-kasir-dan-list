"use client";
import React, { useState, useEffect } from "react";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { exportToExcel, formatCurrency } from "@/lib/utils";

export default function LaporanRekapTab({ startDate, endDate }) {
  const [rekapData, setRekapData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  const fetchRekapData = async () => {
    if (!startDate || !endDate) return;

    setIsLoading(true);
    try {
      const params = new URLSearchParams({
        startDate: startDate,
        endDate: endDate,
      });

      const response = await fetch(`/api/reports/rekap?${params}`);
      const result = await response.json();

      if (result.success) {
        setRekapData(result.data);
      } else {
        console.error("Failed to fetch rekap:", result.message);
      }
    } catch (error) {
      console.error("Error fetching rekap:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRekapData();
  }, [startDate, endDate]);

  const handleDownloadCategory = (categoryData) => {
    if (
      !categoryData ||
      !categoryData.months ||
      categoryData.months.length === 0
    )
      return;

    const cleanData = categoryData.months.map((monthData) => ({
      Bulan: new Date(monthData.month + "-01").toLocaleDateString("id-ID", {
        year: "numeric",
        month: "long",
      }),
      "Jumlah Transaksi": monthData.count,
      Total: monthData.total,
      "Rata-rata": Math.round(monthData.total / monthData.count),
    }));

    exportToExcel(
      cleanData,
      `Laporan_Rekap_${categoryData.category.replace(/\s+/g, "_")}`
    );
  };

  if (isLoading) {
    return <Skeleton className="h-96 w-full" />;
  }

  if (!rekapData) {
    return (
      <div className="flex items-center justify-center py-8">
        <p className="text-muted-foreground">
          Silakan pilih rentang tanggal untuk melihat rekapitulasi pengeluaran
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Pengeluaran
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(rekapData.summary.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Jumlah Transaksi
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rekapData.summary.totalTransactions}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Kategori
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {rekapData.summary.categories}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Rekap by Category */}
      {rekapData.rekap.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground">
              Tidak ada data pengeluaran pada periode ini
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {rekapData.rekap.map((categoryData) => (
            <Card key={categoryData.category}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>{categoryData.category}</CardTitle>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="text-lg font-bold">
                        {formatCurrency(categoryData.totalAmount)}
                      </div>
                      <div className="text-sm text-muted-foreground">
                        {categoryData.totalCount} transaksi
                      </div>
                    </div>
                    <Button
                      onClick={() => handleDownloadCategory(categoryData)}
                      size="sm"
                      variant="outline"
                    >
                      <Download className="mr-2 h-4 w-4" /> Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Bulan</TableHead>
                      <TableHead className="text-right">
                        Jumlah Transaksi
                      </TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Rata-rata</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {categoryData.months.map((monthData) => (
                      <TableRow key={monthData.month}>
                        <TableCell className="font-medium">
                          {new Date(monthData.month + "-01").toLocaleDateString(
                            "id-ID",
                            {
                              year: "numeric",
                              month: "long",
                            }
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          {monthData.count}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(monthData.total)}
                        </TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(
                            Math.round(monthData.total / monthData.count)
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

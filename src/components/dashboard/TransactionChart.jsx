"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart, TrendingUp } from "lucide-react";

export function TransactionChart({ data, period, loading }) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Tren Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            Tren Transaksi
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data transaksi
          </div>
        </CardContent>
      </Card>
    );
  }

  // Find max values for scaling
  const maxCount = Math.max(...data.map((d) => d.count));
  const maxRevenue = Math.max(...data.map((d) => d.revenue));

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
      notation: "compact",
    }).format(value || 0);
  };

  const getPeriodLabel = () => {
    if (period === "today") return "per Jam";
    if (period === "month") return "per Hari";
    return "per Bulan";
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Tren Transaksi {getPeriodLabel()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Simple bar chart using divs */}
          <div className="h-[250px] flex items-end gap-1">
            {data.map((item, index) => {
              const heightPercent = (item.count / maxCount) * 100;
              return (
                <div
                  key={index}
                  className="flex-1 flex flex-col items-center gap-1 group"
                  title={`${item.date}: ${
                    item.count
                  } transaksi, ${formatCurrency(item.revenue)}`}
                >
                  <div
                    className="w-full bg-linear-to-t from-blue-500 to-blue-400 rounded-t hover:from-blue-600 hover:to-blue-500 transition-all cursor-pointer relative"
                    style={{ height: `${heightPercent}%`, minHeight: "4px" }}
                  >
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white px-2 py-1 rounded">
                      {item.count}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground truncate w-full text-center">
                    {item.date.split("-").pop() || item.date}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Legend */}
          <div className="flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-blue-500 rounded" />
              <span>Jumlah Transaksi</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-green-500 rounded" />
              <span>Pendapatan</span>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-2 gap-4 pt-4 border-t">
            <div>
              <p className="text-sm text-muted-foreground">Total Transaksi</p>
              <p className="text-2xl font-bold">
                {data.reduce((sum, d) => sum + d.count, 0)}
              </p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Total Pendapatan</p>
              <p className="text-2xl font-bold">
                {formatCurrency(data.reduce((sum, d) => sum + d.revenue, 0))}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

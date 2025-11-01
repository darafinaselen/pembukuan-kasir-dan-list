"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { TrendingUp, Loader2 } from "lucide-react";

export function TransactionChart({ data, period, loading }) {
  console.log("TransactionChart - data:", data);
  console.log("TransactionChart - period:", period);
  console.log("TransactionChart - loading:", loading);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-5 w-5 animate-spin" />
            Tren Transaksi
          </CardTitle>
          <CardDescription>Memuat data...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-blue-600" />
            Tren Transaksi
          </CardTitle>
          <CardDescription>Tidak ada data yang tersedia</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-[300px] flex items-center justify-center text-muted-foreground">
            Tidak ada data transaksi untuk periode ini
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

  const totalTransactions = data.reduce((sum, d) => sum + d.count, 0);
  const totalRevenue = data.reduce((sum, d) => sum + d.revenue, 0);
  const avgTransaction = totalRevenue / totalTransactions;
  const avgPerPeriod = totalTransactions / data.length;

  // Find peak performance
  const peakDay = data.reduce(
    (max, d) => (d.count > max.count ? d : max),
    data[0]
  );
  const lowestDay = data.reduce(
    (min, d) => (d.count < min.count ? d : min),
    data[0]
  );

  // Calculate trend (comparing first half vs second half)
  const midpoint = Math.floor(data.length / 2);
  const firstHalf = data.slice(0, midpoint);
  const secondHalf = data.slice(midpoint);
  const firstHalfAvg =
    firstHalf.reduce((sum, d) => sum + d.count, 0) / firstHalf.length;
  const secondHalfAvg =
    secondHalf.reduce((sum, d) => sum + d.count, 0) / secondHalf.length;
  const trendPercentage = (
    ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) *
    100
  ).toFixed(1);
  const isGrowing = secondHalfAvg > firstHalfAvg;

  // Calculate Y-axis labels with better scaling
  const getYAxisLabels = (max) => {
    if (max <= 0) return [0, 0, 0, 0, 0];

    // For very small numbers, use fixed intervals
    if (max <= 2) {
      return [4, 3, 2, 1, 0];
    } else if (max <= 4) {
      return [5, 4, 3, 2, 0];
    } else if (max <= 8) {
      return [10, 8, 6, 4, 0];
    } else if (max <= 10) {
      return [12, 9, 6, 3, 0];
    }

    // For larger numbers, use nice intervals
    let niceMax = Math.ceil(max * 1.1); // 10% padding

    // Round to nearest 5, 10, 20, 50, 100, etc.
    const magnitude = Math.pow(10, Math.floor(Math.log10(niceMax)));
    const normalized = niceMax / magnitude;

    if (normalized <= 1) niceMax = magnitude;
    else if (normalized <= 2) niceMax = 2 * magnitude;
    else if (normalized <= 5) niceMax = 5 * magnitude;
    else niceMax = 10 * magnitude;

    const step = niceMax / 4;
    return [niceMax, niceMax - step, niceMax - 2 * step, niceMax - 3 * step, 0];
  };

  const yAxisLabels = getYAxisLabels(maxCount);
  const yAxisMax = yAxisLabels[0];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-blue-600" />
          Tren Transaksi
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <span>Statistik transaksi {getPeriodLabel().toLowerCase()}</span>
          {data.length > 3 && (
            <span
              className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                isGrowing
                  ? "bg-green-100 text-green-700"
                  : "bg-red-100 text-red-700"
              }`}
            >
              {isGrowing ? "↑" : "↓"} {Math.abs(parseFloat(trendPercentage))}%
              trend
            </span>
          )}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          {/* Bar Chart dengan Grid Lines */}
          <div className="relative">
            {/* Y-axis labels */}
            <div className="absolute left-0 top-0 bottom-12 w-12 flex flex-col justify-between text-xs text-muted-foreground">
              {yAxisLabels.map((label, i) => (
                <span key={i} className="text-right pr-2">
                  {label}
                </span>
              ))}
            </div>

            {/* Chart area with grid */}
            <div className="ml-12 relative">
              {/* Horizontal grid lines */}
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none mb-12">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div key={i} className="h-px bg-gray-200" />
                ))}
              </div>

              {/* Bars */}
              <div className="h-[250px] flex items-end justify-start gap-1 px-2 relative">
                {data.map((item, index) => {
                  // Calculate height in pixels directly using yAxisMax for proper scaling
                  const heightInPixels = (item.count / yAxisMax) * 250;
                  const minHeightPx = item.count > 0 ? 15 : 0; // Minimum 15px if there's data
                  const displayHeightPx = Math.max(heightInPixels, minHeightPx);

                  return (
                    <div
                      key={index}
                      className="flex-1 flex flex-col items-center gap-2 group"
                      style={{ maxWidth: data.length > 15 ? "40px" : "60px" }}
                    >
                      <div className="relative w-full">
                        <div
                          className="w-full bg-blue-600 hover:bg-blue-700 rounded-t-md transition-all cursor-pointer relative shadow-sm"
                          style={{ height: `${displayHeightPx}px` }}
                        >
                          {/* Tooltip on hover */}
                          <div className="absolute -top-20 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap bg-gray-900 text-white px-3 py-2 rounded shadow-lg z-10 text-center pointer-events-none">
                            <div className="text-xs font-medium mb-1">
                              {item.date}
                            </div>
                            <div className="text-sm font-bold">
                              {item.count} transaksi
                            </div>
                            <div className="text-xs text-gray-300 mt-1">
                              {formatCurrency(item.revenue)}
                            </div>
                          </div>

                          {/* Count label on bar - only show if bar is tall enough */}
                          {item.count > 0 && (
                            <div className="absolute top-1 left-1/2 -translate-x-1/2 text-xs font-bold text-white">
                              {item.count}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* X-axis label */}
                      <span className="text-[10px] text-muted-foreground truncate w-full text-center font-medium">
                        {period === "today"
                          ? item.date.split(":")[0] + ":00"
                          : period === "month"
                          ? item.date.split("-").pop()
                          : item.date}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* X-axis line */}
              <div className="h-px bg-gray-300 mt-2" />

              {/* X-axis label */}
              <div className="text-center text-xs text-muted-foreground mt-2 font-medium">
                {period === "today"
                  ? "Jam"
                  : period === "month"
                  ? "Tanggal"
                  : "Bulan"}
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="space-y-4">
            {/* Main Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-4 border-t">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Transaksi
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-700 rounded-full font-medium">
                    {getPeriodLabel()}
                  </span>
                </div>
                <p className="text-3xl font-bold text-blue-600">
                  {totalTransactions}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rata-rata {avgPerPeriod.toFixed(1)} transaksi{" "}
                  {getPeriodLabel().toLowerCase()}
                </p>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Total Pendapatan
                  </p>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </div>
                <p className="text-3xl font-bold text-green-600">
                  {formatCurrency(totalRevenue)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Rata-rata {formatCurrency(avgTransaction)} per transaksi
                </p>
              </div>

              <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-muted-foreground">
                    Puncak Transaksi
                  </p>
                  <span className="text-xs px-2 py-0.5 bg-purple-100 text-purple-700 rounded-full font-medium">
                    Tertinggi
                  </span>
                </div>
                <p className="text-3xl font-bold text-purple-600">
                  {peakDay.count}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  Pada {peakDay.date} • {formatCurrency(peakDay.revenue)}
                </p>
              </div>
            </div>

            {/* Performance Insight */}
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-xs font-semibold text-amber-700">
                      📊 Analisis Trend
                    </p>
                    <span
                      className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                        isGrowing
                          ? "bg-green-100 text-green-700"
                          : "bg-red-100 text-red-700"
                      }`}
                    >
                      {isGrowing ? "↑ Naik" : "↓ Turun"}{" "}
                      {Math.abs(parseFloat(trendPercentage))}%
                    </span>
                  </div>
                  <p className="text-sm text-amber-900 mb-2">
                    <span className="font-bold">
                      Performa {isGrowing ? "meningkat" : "menurun"}
                    </span>
                    : Rata-rata paruh pertama periode{" "}
                    <span className="font-bold">
                      {firstHalfAvg.toFixed(1)} transaksi
                    </span>
                    , paruh kedua{" "}
                    <span className="font-bold">
                      {secondHalfAvg.toFixed(1)} transaksi
                    </span>
                    ({isGrowing ? "+" : ""}
                    {trendPercentage}%).
                  </p>
                  <p className="text-sm text-amber-900">
                    <span className="font-bold">Peak & Low</span>: Tertinggi
                    pada <span className="font-bold">{peakDay.date}</span>{" "}
                    dengan {peakDay.count} transaksi (
                    {formatCurrency(peakDay.revenue)}). Terendah pada{" "}
                    <span className="font-bold">{lowestDay.date}</span> dengan{" "}
                    {lowestDay.count} transaksi.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

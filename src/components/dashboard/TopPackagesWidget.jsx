"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Loader2, PieChart } from "lucide-react";

const PACKAGE_TYPE_LABELS = {
  CAR_RENTAL: "Sewa Mobil",
  TOUR_PACKAGE: "Paket Wisata",
  FULL_DAY_TRIP: "Trip Sehari Penuh",
};

const PACKAGE_TYPE_COLORS = {
  CAR_RENTAL: "bg-blue-100 text-blue-800",
  TOUR_PACKAGE: "bg-green-100 text-green-800",
  FULL_DAY_TRIP: "bg-purple-100 text-purple-800",
};

export function TopPackagesWidget({ incomeData, loading }) {
  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Loader2 className="h-4 w-4 animate-spin" />
            Paket Terlaris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div
                key={i}
                className="flex items-center justify-between p-3 border rounded-lg"
              >
                <div className="space-y-1">
                  <div className="h-4 bg-muted animate-pulse rounded w-32"></div>
                  <div className="h-3 bg-muted animate-pulse rounded w-20"></div>
                </div>
                <div className="h-6 bg-muted animate-pulse rounded w-24"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!incomeData?.incomeByPackage || incomeData.incomeByPackage.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-4 w-4" />
            Paket Terlaris
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6 text-muted-foreground">
            <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Belum ada data paket</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Get top 5 packages by revenue
  const topPackages = incomeData.incomeByPackage.slice(0, 5);
  const totalRevenue = topPackages.reduce(
    (sum, pkg) => sum + pkg.totalRevenue,
    0
  );

  // Colors for pie chart
  const chartColors = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-purple-500",
    "bg-pink-500",
  ];

  // Calculate pie chart angles
  const calculateAngle = (value, total) => {
    return (value / total) * 360;
  };

  // Build pie chart segments
  let currentAngle = 0;
  const pieSegments = topPackages.map((pkg, index) => {
    const angle = calculateAngle(pkg.totalRevenue, totalRevenue);
    const segment = {
      ...pkg,
      angle,
      startAngle: currentAngle,
      endAngle: currentAngle + angle,
      color: chartColors[index % chartColors.length],
      percentage: ((pkg.totalRevenue / totalRevenue) * 100).toFixed(1),
    };
    currentAngle += angle;
    return segment;
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <PieChart className="h-4 w-4" />
          Top 5 Paket Jasa Terlaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid gap-6 md:grid-cols-2">
          {/* Pie Chart */}
          <div className="flex flex-col items-center justify-center">
            <div className="relative w-48 h-48">
              <svg
                viewBox="0 0 100 100"
                className="transform -rotate-90"
                style={{ width: "100%", height: "100%" }}
              >
                {pieSegments.map((segment, index) => {
                  const largeArcFlag = segment.angle > 180 ? 1 : 0;
                  const x1 =
                    50 + 50 * Math.cos((segment.startAngle * Math.PI) / 180);
                  const y1 =
                    50 + 50 * Math.sin((segment.startAngle * Math.PI) / 180);
                  const x2 =
                    50 + 50 * Math.cos((segment.endAngle * Math.PI) / 180);
                  const y2 =
                    50 + 50 * Math.sin((segment.endAngle * Math.PI) / 180);

                  return (
                    <path
                      key={segment.packageId}
                      d={`M 50 50 L ${x1} ${y1} A 50 50 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                      className={segment.color}
                      style={{
                        filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                      }}
                    />
                  );
                })}
              </svg>
              {/* Center text */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <div className="text-xs text-muted-foreground">Total</div>
                  <div className="text-lg font-bold">
                    {formatCurrency(totalRevenue)}
                  </div>
                </div>
              </div>
            </div>
            {/* Legend */}
            <div className="mt-4 space-y-2 w-full">
              {pieSegments.map((segment, index) => (
                <div
                  key={segment.packageId}
                  className="flex items-center gap-2 text-xs"
                >
                  <div
                    className={`w-3 h-3 rounded-full ${segment.color}`}
                  />
                  <span className="font-medium flex-1 truncate">
                    {segment.packageName}
                  </span>
                  <span className="text-muted-foreground">
                    {segment.percentage}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* List View */}
          <div className="space-y-3">
            {topPackages.map((pkg, index) => (
              <div
                key={pkg.packageId}
                className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`w-4 h-4 rounded-full ${chartColors[index % chartColors.length]}`}
                  />
                  <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                    {index + 1}
                  </div>
                  <div className="space-y-1">
                    <div className="font-medium text-sm">{pkg.packageName}</div>
                    <Badge
                      className={`text-xs ${PACKAGE_TYPE_COLORS[pkg.packageType]}`}
                    >
                      {PACKAGE_TYPE_LABELS[pkg.packageType]}
                    </Badge>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-sm">
                    {formatCurrency(pkg.totalRevenue)}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {pkg.transactionCount} transaksi
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {incomeData.summary && (
          <div className="mt-4 pt-4 border-t">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <div className="text-lg font-semibold text-primary">
                  {incomeData.summary.totalPackages}
                </div>
                <div className="text-xs text-muted-foreground">Total Paket</div>
              </div>
              <div>
                <div className="text-lg font-semibold text-primary">
                  {formatCurrency(incomeData.summary.totalRevenue)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Total Pemasukan
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

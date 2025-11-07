"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Package, TrendingUp, Loader2 } from "lucide-react";

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

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          Paket Terlaris
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topPackages.map((pkg, index) => (
            <div
              key={pkg.packageId}
              className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
            >
              <div className="flex items-center gap-3">
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

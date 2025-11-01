"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  TrendingUp,
  DollarSign,
  ShoppingCart,
  Car,
  Loader2,
} from "lucide-react";

export function DashboardStats({ stats, loading }) {
  if (loading) {
    return (
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Loading...</CardTitle>
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="h-8 bg-muted animate-pulse rounded" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const formatCurrency = (value) => {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(value || 0);
  };

  const statCards = [
    {
      title: "Total Pemasukan",
      value: formatCurrency(stats?.totalRevenue),
      icon: DollarSign,
      description: "Total pendapatan dari transaksi",
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "Laba Kotor",
      value: formatCurrency(stats?.grossProfit),
      icon: TrendingUp,
      description: "Setelah dikurangi BBM & gaji sopir",
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "Total Transaksi",
      value: stats?.transactionCount || 0,
      icon: ShoppingCart,
      description: "Jumlah order yang masuk",
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "Total Armada",
      value: stats?.fleetCount || 0,
      icon: Car,
      description: "Jumlah kendaraan tersedia",
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
      {statCards.map((stat) => (
        <Card key={stat.title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
            <div className={`p-2 rounded-lg ${stat.bgColor}`}>
              <stat.icon className={`h-4 w-4 ${stat.color}`} />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stat.value}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

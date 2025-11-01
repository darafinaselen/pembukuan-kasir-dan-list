"use client";

import { useState, useEffect } from "react";
import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TransactionChart } from "@/components/dashboard/TransactionChart";
import { FleetStatusChart } from "@/components/dashboard/FleetStatusChart";
import { FleetRevenueChart } from "@/components/dashboard/FleetRevenueChart";
import { PeriodFilter } from "@/components/dashboard/PeriodFilter";

export default function Page() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}`);
      if (!res.ok) {
        console.error("Failed to fetch dashboard stats:", res.status);
        setStats(null);
        return;
      }
      const data = await res.json();
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const getPeriodLabel = () => {
    if (period === "today") return "Hari Ini";
    if (period === "month") return "Bulan Ini";
    return "Tahun Ini";
  };

  return (
    <>
      <header className="flex h-16 shrink-0 items-center gap-2 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4">
          <SidebarTrigger className="-ml-1" />
          <Separator
            orientation="vertical"
            className="mr-2 data-[orientation=vertical]:h-4"
          />
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem className="hidden md:block">
                <BreadcrumbLink href="#">Pembukuan Kasir</BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator className="hidden md:block" />
              <BreadcrumbItem>
                <BreadcrumbPage>Dashboard</BreadcrumbPage>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
        {/* Period Filter */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
            <p className="text-muted-foreground">
              Gambaran umum bisnis {getPeriodLabel().toLowerCase()}
            </p>
          </div>
          <PeriodFilter period={period} onPeriodChange={setPeriod} />
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={stats} loading={loading} />

        {/* Charts */}
        <div className="grid gap-4 md:grid-cols-2">
          <TransactionChart
            data={stats?.transactionTrend}
            period={period}
            loading={loading}
          />
          <FleetStatusChart data={stats?.fleetStatus} loading={loading} />
        </div>

        {/* Fleet Revenue Chart */}
        <div className="grid gap-4">
          <FleetRevenueChart data={stats?.fleetRevenue} loading={loading} />
        </div>
      </div>
    </>
  );
}

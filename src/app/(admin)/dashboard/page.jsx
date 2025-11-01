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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TransactionChart } from "@/components/dashboard/TransactionChart";
import { FleetStatusChart } from "@/components/dashboard/FleetStatusChart";
import { FleetRevenueChart } from "@/components/dashboard/FleetRevenueChart";
import { Calendar, Clock, TrendingUp } from "lucide-react";

export default function Page() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    setLoading(true);
    console.log("Fetching dashboard data for period:", period);
    try {
      const res = await fetch(`/api/dashboard/stats?period=${period}`);
      if (!res.ok) {
        console.error("Failed to fetch dashboard stats:", res.status);
        setStats(null);
        return;
      }
      const data = await res.json();
      console.log("Dashboard data received:", data);
      setStats(data);
    } catch (error) {
      console.error("Error fetching dashboard data:", error);
      setStats(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("Period changed to:", period);
    fetchDashboardData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [period]);

  const getPeriodLabel = () => {
    if (period === "today") return "Hari Ini";
    if (period === "month") return "Bulan Ini";
    return "Tahun Ini";
  };

  const getPeriodDateRange = () => {
    const now = new Date();
    const options = { day: "numeric", month: "long", year: "numeric" };

    if (period === "today") {
      return now.toLocaleDateString("id-ID", options);
    } else if (period === "month") {
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      return `${startOfMonth.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
      })} - ${now.toLocaleDateString("id-ID", options)}`;
    } else {
      const startOfYear = new Date(now.getFullYear(), 0, 1);
      return `${startOfYear.toLocaleDateString("id-ID", {
        day: "numeric",
        month: "long",
      })} - ${now.toLocaleDateString("id-ID", options)}`;
    }
  };

  return (
    <>
      <header className="sticky top-0 z-10 flex h-16 shrink-0 items-center gap-2 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60 transition-[width,height] ease-linear group-has-data-[collapsible=icon]/sidebar-wrapper:h-12">
        <div className="flex items-center gap-2 px-4 w-full">
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
      <div className="flex flex-1 flex-col gap-6 p-6 pt-6">
        {/* Header with Period Filter */}
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-3">
              <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
              <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
                {getPeriodLabel()}
              </span>
            </div>
            <p className="text-sm text-muted-foreground">
              Gambaran umum bisnis {getPeriodLabel().toLowerCase()} •
              {getPeriodDateRange()}
            </p>
          </div>

          {/* Period Filter with Buttons */}
          <div className="inline-flex h-10 items-center justify-center rounded-md bg-muted p-1 text-muted-foreground w-full sm:w-[400px]">
            <button
              onClick={() => {
                console.log("Clicked: today");
                setPeriod("today");
              }}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                period === "today"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <Clock className="h-4 w-4" />
              <span className="hidden sm:inline">Hari Ini</span>
              <span className="sm:hidden">Hari</span>
            </button>
            <button
              onClick={() => {
                console.log("Clicked: month");
                setPeriod("month");
              }}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                period === "month"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <Calendar className="h-4 w-4" />
              <span className="hidden sm:inline">Bulan Ini</span>
              <span className="sm:hidden">Bulan</span>
            </button>
            <button
              onClick={() => {
                console.log("Clicked: year");
                setPeriod("year");
              }}
              className={`inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm px-3 py-1.5 text-sm font-medium ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 flex-1 ${
                period === "year"
                  ? "bg-background text-foreground shadow-sm"
                  : "hover:bg-background/50"
              }`}
            >
              <TrendingUp className="h-4 w-4" />
              <span className="hidden sm:inline">Tahun Ini</span>
              <span className="sm:hidden">Tahun</span>
            </button>
          </div>
        </div>

        {/* Stats Cards */}
        <DashboardStats stats={stats} loading={loading} />

        {/* Charts Row 1 */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <div className="lg:col-span-4">
            <TransactionChart
              data={stats?.transactionTrend}
              period={period}
              loading={loading}
            />
          </div>
          <div className="lg:col-span-3">
            <FleetStatusChart data={stats?.fleetStatus} loading={loading} />
          </div>
        </div>

        {/* Fleet Revenue Chart */}
        <FleetRevenueChart data={stats?.fleetRevenue} loading={loading} />
      </div>
    </>
  );
}

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TransactionChart } from "@/components/dashboard/TransactionChart";
import { FleetStatusChart } from "@/components/dashboard/FleetStatusChart";
import { FleetRevenueChart } from "@/components/dashboard/FleetRevenueChart";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { useAuthFetch } from "@/lib/useAuthFetch";

function DashboardPage() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const authFetch = useAuthFetch();

  const fetchDashboardData = async () => {
    setLoading(true);
    console.log("Fetching dashboard data for period:", period);
    try {
      const res = await authFetch(`/api/dashboard/stats?period=${period}`);

      if (!res) return; // authFetch returns null on 401/403 and redirects

      if (!res.ok) {
        console.error("Failed to fetch dashboard stats:", res.status);
        setStats(null);
        return;
      }
      const result = await res.json();

      // API returns { success, data, message }
      const data = result.data || result;
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
      <header className="flex items-center gap-4 p-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Gambaran umum bisnis Anda — statistik, grafik, dan insight keuangan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex gap-2">
            <Button
              variant={period === "today" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("today")}
            >
              <Clock className="mr-2 h-4 w-4" />
              Hari Ini
            </Button>
            <Button
              variant={period === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("month")}
            >
              <Calendar className="mr-2 h-4 w-4" />
              Bulan Ini
            </Button>
            <Button
              variant={period === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setPeriod("year")}
            >
              <TrendingUp className="mr-2 h-4 w-4" />
              Tahun Ini
            </Button>
          </div>
        </div>
      </header>
      <div className="flex flex-1 flex-col gap-6 p-6 pt-0">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-semibold tracking-tight">
              Ringkasan {getPeriodLabel()}
            </h2>
            <span className="px-3 py-1 text-sm font-medium bg-blue-100 text-blue-700 rounded-full">
              {getPeriodDateRange()}
            </span>
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

export default DashboardPage;

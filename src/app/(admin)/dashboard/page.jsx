"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { DashboardStats } from "@/components/dashboard/DashboardStats";
import { TransactionChart } from "@/components/dashboard/TransactionChart";
import { FleetStatusChart } from "@/components/dashboard/FleetStatusChart";
import { FleetRevenueChart } from "@/components/dashboard/FleetRevenueChart";
import { TopPackagesWidget } from "@/components/dashboard/TopPackagesWidget";
import { Calendar, Clock, TrendingUp } from "lucide-react";
import { useAuthFetch } from "@/lib/useAuthFetch";
import { useUser } from "@/hooks/useUser";

function DashboardPage() {
  const [period, setPeriod] = useState("month");
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const router = useRouter();
  const authFetch = useAuthFetch();
  const { user, loading: userLoading } = useUser();

  // Redirect OPERATOR away from dashboard (contains financial data)
  useEffect(() => {
    if (!userLoading && user && user.role !== "ADMIN") {
      router.push("/transaksi");
    }
  }, [user, userLoading, router]);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null); // Reset error on each fetch
    console.log("Fetching dashboard data for period:", period);
    try {
      const res = await authFetch(`/api/dashboard/stats?period=${period}`);

      if (!res) return; // authFetch returns null on 401/403 and redirects

      if (!res.ok) {
        throw new Error(
          `Gagal mengambil data: ${res.statusText || res.status}`
        );
      }
      const result = await res.json();

      // API returns { success, data, message }
      const data = result.data || result;
      console.log("Dashboard data received:", data);
      setStats(data);
      setError(null); // Clear any previous errors
    } catch (err) {
      console.error("Error fetching dashboard data:", err);
      setError(err.message || "Terjadi kesalahan yang tidak diketahui.");
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

  // Show loading or redirect message for non-admin users
  if (userLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user && user.role !== "ADMIN") {
    return (
      <div className="flex items-center justify-center h-screen">
        <p className="text-muted-foreground">Redirecting...</p>
      </div>
    );
  }

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
        {error ? (
          <div className="flex flex-col items-center justify-center h-64 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-600 font-semibold text-lg">
              Gagal memuat data dashboard
            </p>
            <p className="text-sm text-gray-600 mt-2">{error}</p>
            <Button onClick={fetchDashboardData} className="mt-4">
              Coba Lagi
            </Button>
          </div>
        ) : (
          <>
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
              {/* Hide Transaction Chart (Analisis Tren) from OPERATOR */}
              {user?.role !== "OPERATOR" && (
                <div className="lg:col-span-4">
                  <TransactionChart
                    data={stats?.transactionTrend}
                    period={period}
                    loading={loading}
                  />
                </div>
              )}
              <div
                className={
                  user?.role === "OPERATOR" ? "lg:col-span-7" : "lg:col-span-3"
                }
              >
                <FleetStatusChart data={stats?.fleetStatus} loading={loading} />
              </div>
            </div>

            {/* Fleet Revenue Chart */}
            <FleetRevenueChart data={stats?.fleetRevenue} loading={loading} />

            {/* Top Packages Widget */}
            <TopPackagesWidget
              incomeData={{
                incomeByPackage: stats?.topPackages || [],
                summary: stats?.packageSummary,
              }}
              loading={loading}
            />
          </>
        )}
      </div>
    </>
  );
}

export default DashboardPage;

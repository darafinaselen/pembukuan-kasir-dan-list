"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { CalendarDays, RefreshCw } from "lucide-react";
import { DateRange } from "react-day-picker";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function LaporanFilter({
  dateRange,
  onDateChange,
  onRefresh,
  isLoading,
}) {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth();

  const months = [
    { value: "0", label: "Januari" },
    { value: "1", label: "Februari" },
    { value: "2", label: "Maret" },
    { value: "3", label: "April" },
    { value: "4", label: "Mei" },
    { value: "5", label: "Juni" },
    { value: "6", label: "Juli" },
    { value: "7", label: "Agustus" },
    { value: "8", label: "September" },
    { value: "9", label: "Oktober" },
    { value: "10", label: "November" },
    { value: "11", label: "Desember" },
  ];

  const years = Array.from({ length: 5 }, (_, i) => currentYear - i);

  const setMonth = (monthValue) => {
    const month = parseInt(monthValue);
    const year = currentYear;
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0, 23, 59, 59, 999);

    onDateChange({
      from: firstDay,
      to: lastDay,
    });
  };

  const setYear = (yearValue) => {
    const year = parseInt(yearValue);
    const firstDay = new Date(year, 0, 1);
    const lastDay = new Date(year, 11, 31, 23, 59, 59, 999);

    onDateChange({
      from: firstDay,
      to: lastDay,
    });
  };

  const setThisMonth = () => {
    onDateChange({
      from: new Date(currentYear, currentMonth, 1),
      to: new Date(),
    });
  };

  const setThisYear = () => {
    onDateChange({
      from: new Date(currentYear, 0, 1),
      to: new Date(),
    });
  };

  return (
    <header className="flex items-center gap-4 p-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Laporan & Keuangan</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Lihat laporan transaksi, laba rugi, dan rekapitulasi keuangan bisnis
          Anda.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Select onValueChange={setMonth}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Pilih Bulan" />
          </SelectTrigger>
          <SelectContent>
            {months.map((month) => (
              <SelectItem key={month.value} value={month.value}>
                {month.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select onValueChange={setYear}>
          <SelectTrigger className="w-[120px]">
            <SelectValue placeholder="Pilih Tahun" />
          </SelectTrigger>
          <SelectContent>
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()}>
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button variant="outline" size="sm" onClick={setThisMonth}>
          Bulan Ini
        </Button>
        <Button variant="outline" size="sm" onClick={setThisYear}>
          Tahun Ini
        </Button>

        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant={"outline"}
              size="sm"
              className={cn(
                "w-[260px] justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                dateRange.to ? (
                  <>
                    {format(dateRange.from, "LLL dd, y", { locale: id })} -{" "}
                    {format(dateRange.to, "LLL dd, y", { locale: id })}
                  </>
                ) : (
                  format(dateRange.from, "LLL dd, y", { locale: id })
                )
              ) : (
                <span>Pilih rentang tanggal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="end">
            <Calendar
              initialFocus
              mode="range"
              defaultMonth={dateRange.from}
              selected={dateRange}
              onSelect={onDateChange}
              numberOfMonths={2}
              locale={id}
            />
          </PopoverContent>
        </Popover>

        <Button onClick={onRefresh} size="sm" disabled={isLoading}>
          <RefreshCw
            className={cn("mr-2 h-4 w-4", isLoading && "animate-spin")}
          />
          Muat Ulang
        </Button>
      </div>
    </header>
  );
}

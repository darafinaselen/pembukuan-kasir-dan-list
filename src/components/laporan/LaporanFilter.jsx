"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
  const setThisMonth = () => {
    onDateChange({
      from: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      to: new Date(),
    });
  };
  const setThisYear = () => {
    onDateChange({
      from: new Date(new Date().getFullYear(), 0, 1),
      to: new Date(),
    });
  };

  return (
    <header className="flex flex-wrap items-center justify-between gap-4 border-b bg-background p-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-xl font-semibold">Laporan & Keuangan</h1>
      </div>

      <div className="flex flex-wrap items-center gap-2">
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
              className={cn(
                "w-[300px] justify-start text-left font-normal",
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

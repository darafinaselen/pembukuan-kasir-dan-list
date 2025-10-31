"use client";

import React from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { CalendarDays, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Label } from "@/components/ui/label";
import { format } from "date-fns";
import { id } from "date-fns/locale";
import { cn } from "@/lib/utils";

export default function TransaksiFilters({
  searchTerm,
  onSearchChange,
  dateRange,
  onDateChange,
  quickFilter,
  onQuickFilterChange,
}) {
  return (
    <div className="flex flex-wrap items-center gap-4 border-b bg-background p-4">
      <div className="relative flex-1 min-w-[250px]">
        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
        <Input
          type="search"
          placeholder="Cari Invoice atau Nama Pelanggan..."
          className="pl-8"
          value={searchTerm}
          onChange={onSearchChange}
        />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <Label htmlFor="date-from" className="shrink-0">
          Dari:
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-from"
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !dateRange.from && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {dateRange.from ? (
                format(dateRange.from, "PPP", { locale: id })
              ) : (
                <span>Tanggal Awal</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.from}
              onSelect={(date) => onDateChange("from", date)}
              disabled={(date) =>
                (dateRange.to && date > dateRange.to) || date > new Date()
              }
            />
          </PopoverContent>
        </Popover>

        <Label htmlFor="date-to" className="shrink-0">
          Sampai:
        </Label>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              id="date-to"
              variant={"outline"}
              className={cn(
                "w-[200px] justify-start text-left font-normal",
                !dateRange.to && "text-muted-foreground"
              )}
            >
              <CalendarDays className="mr-2 h-4 w-4" />
              {dateRange.to ? (
                format(dateRange.to, "PPP", { locale: id })
              ) : (
                <span>Tanggal Akhir</span>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="single"
              selected={dateRange.to}
              onSelect={(date) => onDateChange("to", date)}
              disabled={(date) =>
                (dateRange.from && date < dateRange.from) || date > new Date()
              }
            />
          </PopoverContent>
        </Popover>
      </div>

      <div className="flex items-center gap-2">
        <Button
          size="sm"
          variant={quickFilter === "all" ? "default" : "outline"}
          onClick={() => onQuickFilterChange("all")}
        >
          Semua
        </Button>
        <Button
          size="sm"
          variant={quickFilter === "month" ? "default" : "outline"}
          onClick={() => onQuickFilterChange("month")}
        >
          Bulan Ini
        </Button>
        <Button
          size="sm"
          variant={quickFilter === "year" ? "default" : "outline"}
          onClick={() => onQuickFilterChange("year")}
        >
          Tahun Ini
        </Button>
      </div>
    </div>
  );
}

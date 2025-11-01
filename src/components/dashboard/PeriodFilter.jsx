"use client";

import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Calendar, Clock, TrendingUp } from "lucide-react";

export function PeriodFilter({ period, onPeriodChange }) {
  return (
    <Tabs value={period} onValueChange={onPeriodChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 max-w-[400px]">
        <TabsTrigger value="today" className="flex items-center gap-2">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Hari Ini</span>
          <span className="sm:hidden">Hari</span>
        </TabsTrigger>
        <TabsTrigger value="month" className="flex items-center gap-2">
          <Calendar className="h-4 w-4" />
          <span className="hidden sm:inline">Bulan Ini</span>
          <span className="sm:hidden">Bulan</span>
        </TabsTrigger>
        <TabsTrigger value="year" className="flex items-center gap-2">
          <TrendingUp className="h-4 w-4" />
          <span className="hidden sm:inline">Tahun Ini</span>
          <span className="sm:hidden">Tahun</span>
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}

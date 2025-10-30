"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PlusCircle } from "lucide-react";

export default function PengeluaranHeader({ onAdd }) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2 border-b bg-background px-4">
      <div className="flex items-center gap-2">
        <SidebarTrigger className="-ml-1" />
        <h1 className="text-xl font-semibold">Manajemen Pengeluaran</h1>
      </div>
      <Button onClick={onAdd} size="sm">
        <PlusCircle className="mr-2 h-4 w-4" />
        Tambah Pengeluaran
      </Button>
    </header>
  );
}

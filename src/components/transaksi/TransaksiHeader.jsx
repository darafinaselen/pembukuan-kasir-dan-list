"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { PlusCircle } from "lucide-react";

export default function TransaksiHeader({ onAdd }) {
  return (
    <header className="flex items-center gap-4 p-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Manajemen Transaksi</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola transaksi sewa kendaraan — input, edit, dan pantau status
          pembayaran.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Input Transaksi Baru
        </Button>
      </div>
    </header>
  );
}

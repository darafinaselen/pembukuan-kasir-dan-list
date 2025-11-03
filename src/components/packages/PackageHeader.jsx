import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { PlusCircle } from "lucide-react";

export default function PackageHeader({ onAdd }) {
  return (
    <header className="flex items-center gap-4 p-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1">
        <h1 className="text-xl font-bold">Manajemen Paket Jasa</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Buat dan kelola data master untuk paket sewa atau tour.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onAdd}>
          <PlusCircle className="mr-2 h-4 w-4" />
          Tambah Paket
        </Button>
      </div>
    </header>
  );
}

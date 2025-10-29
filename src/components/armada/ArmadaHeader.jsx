import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";

export default function ArmadaHeader({ onAdd }) {
  return (
    <header className="flex items-center gap-4 p-4">
      <SidebarTrigger className="-ml-1" />
      <div className="flex-1">
        <h1 className="text-2xl font-bold">Manajemen Armada</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Kelola armada kendaraan Anda — tambah, edit, dan lihat status
          pemakaian.
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Button onClick={onAdd}>Tambah Armada</Button>
      </div>
    </header>
  );
}

"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

export default function SopirTopHeader({ onAdd, searchValue, onSearchChange }) {
  return (
    <header>
      <div className="flex items-center gap-4 p-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Manajemen Sopir</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola sopir Anda — tambah, edit, dan lihat status tugas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Sopir
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex items-end gap-4 mb-4">
          <Input
            placeholder="Cari nama atau no. HP..."
            className="max-w-sm"
            value={searchValue}
            onChange={onSearchChange}
          />
        </div>
      </div>
    </header>
  );
}

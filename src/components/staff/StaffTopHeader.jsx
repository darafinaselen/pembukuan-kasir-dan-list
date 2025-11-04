"use client";

import React from "react";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PlusCircle } from "lucide-react";

export default function StaffTopHeader({
  onAdd,
  searchValue,
  onSearchChange,
  statusFilter,
  onStatusFilterChange,
}) {
  return (
    <header>
      <div className="flex items-center gap-4 p-4">
        <SidebarTrigger className="-ml-1" />
        <div className="flex-1">
          <h1 className="text-xl font-bold">Manajemen Staff</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Kelola data staff dan informasi penggajian bulanan.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={onAdd}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Staff
          </Button>
        </div>
      </div>

      <div className="px-4 pb-4">
        <div className="flex flex-col sm:flex-row items-end gap-4 mb-4">
          <Input
            placeholder="Cari nama, NIK, posisi, atau no. HP..."
            className="max-w-sm"
            value={searchValue}
            onChange={onSearchChange}
          />
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value)}
            className="px-3 py-2 border rounded-md bg-white"
          >
            <option value="">Semua Status</option>
            <option value="ACTIVE">Aktif</option>
            <option value="INACTIVE">Tidak Aktif</option>
            <option value="ON_LEAVE">Cuti</option>
            {/* <option value="TERMINATED">Resign</option> */}
          </select>
        </div>
      </div>
    </header>
  );
}

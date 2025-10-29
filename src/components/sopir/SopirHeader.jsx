"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function SopirHeader({ onAdd, searchValue, onSearchChange }) {
  return (
    <div className="mb-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Manajemen Sopir</h2>
        <div>
          <Button onClick={onAdd}>Tambah Sopir</Button>
        </div>
      </div>

      <div className="flex items-center gap-4 mb-4">
        <Input
          placeholder="Cari nama atau no. HP..."
          className="max-w-sm"
          value={searchValue}
          onChange={onSearchChange}
        />
      </div>
    </div>
  );
}

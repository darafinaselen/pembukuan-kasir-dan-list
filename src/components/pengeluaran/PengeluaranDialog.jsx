"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export default function PengeluaranDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  handleInputChange,
  handleSelectChange,
  handleSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Pengeluaran" : "Tambah Pengeluaran Baru"}
          </DialogTitle>
        </DialogHeader>

        <form
          id="pengeluaran-form"
          onSubmit={handleSubmit}
          className="grid gap-4 py-4"
        >
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="tanggal" className="text-right">
              Tanggal
            </Label>
            <Input
              id="date"
              type="date"
              value={formData.date}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="category" className="text-right">
              Kategori
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) => handleSelectChange("category", value)}
              required
            >
              <SelectTrigger className="col-span-3">
                <SelectValue placeholder="Pilih kategori..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="SERVIS_ARMADA">Servis Armada</SelectItem>
                <SelectItem value="BIAYA_KANTOR">Biaya Kantor</SelectItem>
                <SelectItem value="LISTRIK_AIR">Listrik/Air</SelectItem>
                <SelectItem value="TOL_PARKIR_NON_PAKET">
                  Tol & Parkir (Non-Paket)
                </SelectItem>
                <SelectItem value="GAJI_ADMIN">Gaji Admin</SelectItem>
                <SelectItem value="LAIN_LAIN">Lain-lain</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="description" className="text-right">
              Deskripsi
            </Label>
            <Input
              id="description"
              value={formData.description}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="amount" className="text-right">
              Jumlah (Rp)
            </Label>
            <Input
              id="amount"
              type="number"
              value={formData.amount}
              onChange={handleInputChange}
              className="col-span-3"
              required
            />
          </div>

          {/* TODO: Tambah Dropdown "Terkait Armada" jika kategori == SERVIS_ARMADA */}
        </form>

        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <Button type="submit" form="pengeluaran-form">
            Simpan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

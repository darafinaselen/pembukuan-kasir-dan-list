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
import { CurrencyInput } from "@/components/ui/currency-input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const kategoriOptions = [
  { value: "LISTRIK", label: "Listrik" },
  { value: "INTERNET", label: "Internet" },
  { value: "PAKET_DATA", label: "Paket Data" },
  { value: "KONSUMSI", label: "Konsumsi" },
  { value: "GAJI_STAF_OPERASIONAL", label: "Gaji Staf Operasional" },
  { value: "GAJI_STAF_ADMIN", label: "Gaji Staf Admin" },
  { value: "PAJAK", label: "Pajak" },
  { value: "ALAT_TULIS_KANTOR", label: "Alat Tulis Kantor (ATK)" },
  { value: "KOMPUTER_SUPPLIES", label: "Komputer Supplies" },
  { value: "OPERASIONAL_LAINNYA", label: "Operasional Lainnya" },
  { value: "BBM", label: "BBM (Armada)" },
  { value: "PERAWATAN_ARMADA", label: "Perawatan Armada" },
  { value: "GAJI_SOPIR", label: "Gaji Sopir" },
  { value: "LAINNYA", label: "Lainnya..." },
];

export default function PengeluaranDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  handleInputChange,
  handleSelectChange,
  handleAmountChange,
  handleSubmit,
  armadaList,
  driverList,
  stafList,
  isLoadingDependencies,
}) {
  const armadaCategories = ["BBM", "PERAWATAN_ARMADA", "PAJAK"];
  const stafCategories = ["GAJI_STAF_OPERASIONAL", "GAJI_STAF_ADMIN"];

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
                {kategoriOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {formData.category === "LAINNYA" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="kategoriLainnya" className="text-right">
                Kategori Lainnya
              </Label>
              <Input
                id="kategoriLainnya"
                value={formData.kategoriLainnya}
                onChange={handleInputChange}
                className="col-span-3"
                placeholder="Tulis kategori kustom..."
                required
              />
            </div>
          )}

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
              Jumlah
            </Label>
            <div className="col-span-3">
              <CurrencyInput
                id="amount"
                name="amount"
                value={formData.amount}
                onChange={handleInputChange}
                className="w-full"
                required
              />
            </div>
          </div>

          {armadaCategories.includes(formData.category) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="armadaId" className="text-right">
                Plat Mobil
              </Label>
              <Select
                value={formData.armadaId || ""}
                onValueChange={(value) =>
                  handleSelectChange(
                    "armadaId",
                    value === "NONE" ? null : value
                  )
                }
                disabled={isLoadingDependencies}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue
                    placeholder={
                      isLoadingDependencies ? "Memuat..." : "Pilih armada..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak Terkait</SelectItem>
                  {armadaList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.license_plate} ({item.model})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {formData.category === "GAJI_SOPIR" && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="driverId" className="text-right">
                Nama Sopir
              </Label>
              <Select
                value={formData.driverId || ""}
                onValueChange={(value) =>
                  handleSelectChange(
                    "driverId",
                    value === "NONE" ? null : value
                  )
                }
                disabled={isLoadingDependencies}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue
                    placeholder={
                      isLoadingDependencies ? "Memuat..." : "Pilih sopir..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak Terkait</SelectItem>
                  {driverList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.driver_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {stafCategories.includes(formData.category) && (
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="staffId" className="text-right">
                Nama Staf
              </Label>
              <Select
                value={formData.staffId || ""}
                onValueChange={(value) =>
                  handleSelectChange("staffId", value === "NONE" ? null : value)
                }
                disabled={isLoadingDependencies}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue
                    placeholder={
                      isLoadingDependencies ? "Memuat..." : "Pilih staf..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="NONE">Tidak Terkait</SelectItem>
                  {stafList.map((item) => (
                    <SelectItem key={item.id} value={item.id}>
                      {item.staff_name} ({item.position})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
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

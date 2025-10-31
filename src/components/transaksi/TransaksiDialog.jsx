"use client";

import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
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
import { Loader2 } from "lucide-react";

function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) {
    return "-";
  }
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function TransaksiDialog({
  open,
  onOpenChange,
  isEditing,
  formData,
  calculatedData,
  handleSubmit,
  handleInputChange,
  handleSelectChange,
  handleDateChange,
  paketList,
  armadaList,
  sopirList,
  isLoadingDependencies,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? "Edit Transaksi" : "Input Transaksi Baru"}
          </DialogTitle>
          <DialogDescription>
            Isi semua detail transaksi di bawah ini.
          </DialogDescription>
        </DialogHeader>

        <form id="transaksi-form" onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4 py-4">
            <div className="flex flex-col gap-4">
              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Pelanggan
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="customer_name">Nama Pelanggan</Label>
                    <Input
                      id="customer_name"
                      value={formData.customer_name}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="customer_phone">No. HP</Label>
                    <Input
                      id="customer_phone"
                      value={formData.customer_phone}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Order
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="packageId">Pilih Paket Jasa</Label>
                    <Select
                      value={formData.packageId || "KUSTOM"}
                      onValueChange={(value) =>
                        handleSelectChange(
                          "packageId",
                          value === "KUSTOM" ? null : value
                        )
                      }
                      disabled={isLoadingDependencies}
                    >
                      <SelectTrigger id="packageId">
                        <SelectValue placeholder="Memuat paket..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="KUSTOM">
                          Kustom / Input Manual
                        </SelectItem>
                        {paketList.map((pkg) => (
                          <SelectItem key={pkg.id} value={pkg.id}>
                            {pkg.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="armadaId">Pilih Armada</Label>
                    <Select
                      value={formData.armadaId}
                      onValueChange={(value) =>
                        handleSelectChange("armadaId", value)
                      }
                      disabled={isLoadingDependencies}
                      required
                    >
                      <SelectTrigger id="armadaId">
                        <SelectValue
                          placeholder={
                            isLoadingDependencies
                              ? "Memuat armada..."
                              : "Pilih armada..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {armadaList.length === 0 && !isLoadingDependencies && (
                          <SelectItem value="-" disabled>
                            Tidak ada armada 'Ready'
                          </SelectItem>
                        )}
                        {armadaList.map((armada) => (
                          <SelectItem key={armada.id} value={armada.id}>
                            {armada.license_plate} - {armada.model}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="driverId">Pilih Sopir</Label>
                    <Select
                      value={formData.driverId}
                      onValueChange={(value) =>
                        handleSelectChange("driverId", value)
                      }
                      disabled={isLoadingDependencies}
                      required
                    >
                      <SelectTrigger id="driverId">
                        <SelectValue
                          placeholder={
                            isLoadingDependencies
                              ? "Memuat sopir..."
                              : "Pilih sopir..."
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {sopirList.length === 0 && !isLoadingDependencies && (
                          <SelectItem value="-" disabled>
                            Tidak ada sopir 'Ready'
                          </SelectItem>
                        )}
                        {sopirList.map((driver) => (
                          <SelectItem key={driver.id} value={driver.id}>
                            {driver.driver_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </fieldset>
            </div>

            <div className="flex flex-col gap-4">
              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Waktu
                </legend>
                <div className="grid gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="booking_date">Tanggal Booking</Label>
                    <Input
                      id="booking_date"
                      type="date"
                      value={formData.booking_date}
                      onChange={(e) =>
                        handleDateChange("booking_date", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="checkout_datetime">Mobil Out (Jalan)</Label>
                    <Input
                      id="checkout_datetime"
                      type="datetime-local"
                      value={formData.checkout_datetime}
                      onChange={(e) =>
                        handleDateChange("checkout_datetime", e.target.value)
                      }
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="checkin_datetime">Mobil In (Selesai)</Label>
                    <Input
                      id="checkin_datetime"
                      type="datetime-local"
                      value={formData.checkin_datetime}
                      onChange={(e) =>
                        handleDateChange("checkin_datetime", e.target.value)
                      }
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset className="rounded-md border p-4">
                <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
                  Data Keuangan (Input)
                </legend>
                <div className="grid grid-cols-2 gap-3">
                  <div className="grid gap-1.5">
                    <Label htmlFor="all_in_rate">Tarif Sewa (Rp)</Label>
                    <Input
                      id="all_in_rate"
                      type="number"
                      value={formData.all_in_rate}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="overtime_rate_per_hour">
                      Overtime/Jam (Rp)
                    </Label>
                    <Input
                      id="overtime_rate_per_hour"
                      type="number"
                      value={formData.overtime_rate_per_hour}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="fuel_cost">BBM (Rp)</Label>
                    <Input
                      id="fuel_cost"
                      type="number"
                      value={formData.fuel_cost}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                  <div className="grid gap-1.5">
                    <Label htmlFor="driver_fee">Gaji Sopir (Rp)</Label>
                    <Input
                      id="driver_fee"
                      type="number"
                      value={formData.driver_fee}
                      onChange={handleInputChange}
                      required
                    />
                  </div>
                </div>
              </fieldset>
            </div>
          </div>

          <fieldset className="mt-4 rounded-md border p-4">
            <legend className="-ml-1 px-1 text-sm font-medium text-muted-foreground">
              Kalkulasi Otomatis
            </legend>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <Label className="text-xs text-muted-foreground">
                  Lama Sewa
                </Label>
                <p className="font-semibold">
                  {calculatedData.lamaSewaJam || 0} Jam
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Overtime
                </Label>
                <p className="font-semibold">
                  {calculatedData.lamaOvertimeJam || 0} Jam
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Total Pendapatan
                </Label>
                <p className="font-semibold text-blue-600">
                  {formatCurrency(calculatedData.totalPendapatan)}
                </p>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">
                  Laba Kotor
                </Label>
                <p className="font-semibold text-green-600">
                  {formatCurrency(calculatedData.labaKotor)}
                </p>
              </div>
            </div>
          </fieldset>
        </form>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Batal
            </Button>
          </DialogClose>
          <Button type="submit" form="transaksi-form">
            {isEditing ? "Simpan Perubahan" : "Simpan Transaksi"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

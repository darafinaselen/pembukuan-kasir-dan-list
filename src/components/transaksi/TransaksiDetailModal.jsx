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
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

function formatCurrency(amount) {
  if (typeof amount !== "number" || isNaN(amount)) return "-";
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
function formatDate(dateString) {
  if (!dateString) return "-";
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
function displayData(value) {
  return value || "-";
}

const getStatusLabel = (status) => {
  switch (status) {
    case "PAID":
      return "Lunas";
    case "DOWN_PAYMENT":
      return "DP";
    case "UNPAID":
    default:
      return "Belum Lunas";
  }
};

const DetailItem = ({ label, value }) => (
  <div className="grid gap-1">
    <Label className="text-xs text-muted-foreground">{label}</Label>
    <p className="font-medium">{displayData(value)}</p>
  </div>
);

export default function TransaksiDetailModal({
  open,
  onOpenChange,
  data,
  calculatedData,
}) {
  if (!data) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Detail Transaksi: {data.invoice_code}</DialogTitle>
          <DialogDescription>
            Menampilkan semua data yang tercatat untuk transaksi ini.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 py-4">
          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Data Pelanggan & Order</h3>
            <DetailItem label="Nama Pelanggan" value={data.customer_name} />
            <DetailItem label="No. HP" value={data.customer_phone} />
            <DetailItem
              label="Paket Jasa"
              value={data.package?.name || "Kustom"}
            />
            <DetailItem
              label="Armada"
              value={`${data.armada?.license_plate || ""} (${
                data.armada?.model || ""
              })`}
            />
            <DetailItem label="Sopir" value={data.driver?.driver_name || ""} />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Data Waktu</h3>
            <DetailItem
              label="Tanggal Booking"
              value={formatDate(data.booking_date)}
            />
            <DetailItem
              label="Mobil Out (Jalan)"
              value={formatDate(data.checkout_datetime)}
            />
            <DetailItem
              label="Mobil In (Selesai)"
              value={formatDate(data.checkin_datetime)}
            />
            <DetailItem
              label="Lama Sewa"
              value={`${calculatedData.lamaSewaJam || 0} Jam`}
            />
            <DetailItem
              label="Overtime"
              value={`${calculatedData.lamaOvertimeJam || 0} Jam`}
            />
          </div>

          <div className="flex flex-col gap-4">
            <h3 className="font-semibold">Data Keuangan</h3>
            <div className="grid gap-1">
              <Label className="text-xs text-muted-foreground">
                Status Pembayaran
              </Label>
              <Badge
                variant={
                  data.payment_status === "PAID"
                    ? "success"
                    : data.payment_status === "DOWN_PAYMENT"
                    ? "warning"
                    : "destructive"
                }
              >
                {getStatusLabel(data.payment_status)}
              </Badge>
            </div>
            <DetailItem
              label="Tarif Sewa"
              value={formatCurrency(data.all_in_rate)}
            />
            <DetailItem
              label="Tarif Overtime"
              value={`${formatCurrency(data.overtime_rate_per_hour)} /jam`}
            />
            <DetailItem
              label="Biaya BBM"
              value={formatCurrency(data.fuel_cost)}
            />
            <DetailItem
              label="Gaji Sopir"
              value={formatCurrency(data.driver_fee)}
            />
          </div>
        </div>

        <div className="rounded-md border bg-muted p-4">
          <div className="grid grid-cols-2 gap-4 text-center">
            <div>
              <Label className="text-sm text-muted-foreground">
                Total Pendapatan
              </Label>
              <p className="text-xl font-semibold text-blue-600">
                {formatCurrency(calculatedData.totalPendapatan)}
              </p>
            </div>
            <div>
              <Label className="text-sm text-muted-foreground">
                Laba Kotor
              </Label>
              <p className="text-xl font-semibold text-green-600">
                {formatCurrency(calculatedData.labaKotor)}
              </p>
            </div>
          </div>
        </div>

        <DialogFooter className="mt-4">
          <DialogClose asChild>
            <Button type="button" variant="outline">
              Tutup
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

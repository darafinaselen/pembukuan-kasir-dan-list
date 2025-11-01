"use client";

import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { MoreHorizontal, Pencil, Trash2, Printer } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";

function formatCurrency(amount) {
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    minimumFractionDigits: 0,
  }).format(amount);
}
function formatDate(dateString) {
  return new Date(dateString).toLocaleDateString("id-ID", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

const getStatusVariant = (status) => {
  switch (status) {
    case "PAID":
    case "LUNAS":
      return "success";
    case "DOWN_PAYMENT":
    case "DP":
      return "warning";
    case "UNPAID":
    case "BELUM_LUNAS":
    default:
      return "destructive";
  }
};

export default function TransaksiTable({
  isLoading,
  data,
  onEdit,
  onDelete,
  onViewDetails,
  onUpdateStatus,
  onPrint,
}) {
  const getCalculatedData = (item) => {
    const durasiPaketJam = item.package?.durationHours || 12;
    const start = new Date(item.checkout_datetime);
    const end = new Date(item.checkin_datetime);

    if (end <= start) {
      return { totalTagihan: Number(item.all_in_rate) || 0 };
    }

    const lamaSewaJam = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    );
    const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

    const totalOvertimeFee =
      lamaOvertimeJam * (item.overtime_rate_per_hour || 0);
    const totalTagihan = (item.all_in_rate || 0) + totalOvertimeFee;

    return { totalTagihan };
  };

  if (isLoading) {
    return (
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Jasa</TableHead>
              <TableHead className="text-right">Total Tagihan</TableHead>
              <TableHead className="w-[180px]">Status Pembayaran</TableHead>
              <TableHead className="w-[180px]">Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {Array.from({ length: 5 }).map((_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell className="text-right">
                  <Skeleton className="h-4 w-20 ml-auto" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-10 w-full" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-8 w-20" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    );
  }

  if (!isLoading && data.length === 0) {
    return (
      <div className="rounded-lg border-2 border-dashed border-slate-200 p-6 text-center">
        <p className="text-lg font-medium">Belum ada data transaksi</p>
        <p className="text-sm text-muted-foreground">
          Klik "Input Transaksi Baru" untuk mulai mencatat.
        </p>
      </div>
    );
  }

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Tanggal</TableHead>
            <TableHead>Invoice</TableHead>
            <TableHead>Pelanggan</TableHead>
            <TableHead>Jasa</TableHead>
            <TableHead className="text-right">Total Tagihan</TableHead>
            <TableHead className="w-[180px]">Status Pembayaran</TableHead>
            <TableHead className="w-[180px]">Aksi</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {data.map((item) => {
            const { totalTagihan } = getCalculatedData(item);
            return (
              <TableRow key={item.id}>
                <TableCell>{formatDate(item.booking_date)}</TableCell>
                <TableCell>{item.invoice_code}</TableCell>
                <TableCell>{item.customer_name}</TableCell>
                <TableCell>{item.package?.name || "Kustom"}</TableCell>
                <TableCell className="text-right">
                  {formatCurrency(totalTagihan)}
                </TableCell>
                <TableCell>
                  <Select
                    value={item.payment_status}
                    onValueChange={(newStatus) =>
                      onUpdateStatus(item.id, newStatus)
                    }
                  >
                    <SelectTrigger
                      className={cn(
                        "w-full",
                        item.payment_status === "PAID" && "border-green-500",
                        item.payment_status === "DOWN_PAYMENT" &&
                          "border-yellow-500",
                        item.payment_status === "UNPAID" && "border-red-500"
                      )}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="UNPAID">Belum Lunas</SelectItem>
                      <SelectItem value="DOWN_PAYMENT">DP</SelectItem>
                      <SelectItem value="PAID">Lunas</SelectItem>
                    </SelectContent>
                  </Select>
                </TableCell>
                <TableCell>
                  <div className="lg:hidden">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent>
                        <DropdownMenuItem onClick={() => onPrint(item)}>
                          Cetak Invoice
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onViewDetails(item)}>
                          Lihat Detail
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => onEdit(item)}>
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => onDelete(item.id)}
                          className="text-red-500"
                        >
                          Hapus
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <div className="hidden lg:flex lg:items-center lg:gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onPrint(item)}
                    >
                      <Printer className="mr-1 h-3 w-3" /> Cetak
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onViewDetails(item)}
                    >
                      Detail
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onEdit(item)}
                    >
                      <Pencil className="mr-1 h-3 w-3" /> Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => onDelete(item.id)}
                      className="text-red-500 ..."
                    >
                      <Trash2 className="mr-1 h-3 w-3" /> Hapus
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

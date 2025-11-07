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
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  MoreHorizontal,
  Pencil,
  Trash2,
  Printer,
  CheckCircle,
} from "lucide-react";
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
  onCompleteTransaction,
}) {
  const getCalculatedData = (item) => {
    const durasiPaketJam = item.package?.durationHours || 12;
    const start = new Date(item.checkout_datetime);
    const end = new Date(item.checkin_datetime);

    if (end <= start) {
      return {
        totalTagihan: Number(item.all_in_rate) || 0,
        sisaTagihan: 0,
      };
    }

    const lamaSewaJam = Math.round(
      (end.getTime() - start.getTime()) / (1000 * 60 * 60)
    );
    const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

    const totalOvertimeFee =
      lamaOvertimeJam * (item.overtime_rate_per_hour || 0);
    const totalTagihan = (item.all_in_rate || 0) + totalOvertimeFee;

    // Hitung sisa tagihan jika ada DP
    const dpAmount = item.dp_amount || 0;
    const sisaTagihan =
      item.payment_status === "DOWN_PAYMENT" && dpAmount > 0
        ? Math.max(0, totalTagihan - dpAmount)
        : 0;

    return { totalTagihan, sisaTagihan };
  };

  // Check if any transaction has DP status with dp_amount
  const hasAnyDP = data.some(
    (item) =>
      item.payment_status === "DOWN_PAYMENT" &&
      item.dp_amount &&
      item.dp_amount > 0
  );

  if (isLoading) {
    return (
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead>Tanggal</TableHead>
              <TableHead>Invoice</TableHead>
              <TableHead>Pelanggan</TableHead>
              <TableHead>Jasa</TableHead>
              <TableHead className="text-right">Total Tagihan</TableHead>
              <TableHead className="text-right">Sisa Tagihan</TableHead>
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
          Klik &quot;Input Transaksi Baru&quot; untuk mulai mencatat.
        </p>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="rounded-md border overflow-x-auto">
        <Table className="min-w-full">
          <TableHeader>
            <TableRow>
              <TableHead className="whitespace-nowrap">Tanggal</TableHead>
              <TableHead className="whitespace-nowrap">Invoice</TableHead>
              <TableHead className="whitespace-nowrap">Pelanggan</TableHead>
              <TableHead className="whitespace-nowrap">Jasa</TableHead>
              <TableHead className="text-right whitespace-nowrap">
                Total Tagihan
              </TableHead>
              {hasAnyDP && (
                <TableHead className="text-right whitespace-nowrap">
                  Sisa Tagihan
                </TableHead>
              )}
              <TableHead className="min-w-[160px] whitespace-nowrap">
                Status Pembayaran
              </TableHead>
              <TableHead className="min-w-[200px] whitespace-nowrap">
                Aksi
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {data.map((item) => {
              const { totalTagihan, sisaTagihan } = getCalculatedData(item);
              const showSisaTagihan =
                item.payment_status === "DOWN_PAYMENT" &&
                item.dp_amount &&
                item.dp_amount > 0;

              const isCompleted = !!item.actual_checkin_datetime;

              return (
                <TableRow
                  key={item.id}
                  className={cn(isCompleted && "bg-green-50/50")}
                >
                  <TableCell>
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      {formatDate(item.booking_date)}
                      {isCompleted && (
                        <Badge
                          variant="outline"
                          className="bg-green-50 text-green-700 border-green-300 shrink-0"
                        >
                          <CheckCircle className="mr-1 h-3 w-3" />
                          Selesai
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {item.invoice_code}
                  </TableCell>
                  <TableCell className="max-w-[150px] truncate">
                    {item.customer_name}
                  </TableCell>
                  <TableCell className="max-w-[120px]">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <div className="truncate cursor-help">
                          {item.package?.name || "Kustom"}
                        </div>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-xs">
                        <div className="space-y-2">
                          <p className="font-semibold">
                            {item.package?.name || "Paket Kustom"}
                          </p>
                          {item.package ? (
                            <>
                              <p className="text-sm">
                                <span className="font-medium">Tipe:</span>{" "}
                                {item.package.type}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Durasi:</span>{" "}
                                {item.package.durationHours
                                  ? `${item.package.durationHours} jam`
                                  : item.package.durationDays
                                    ? `${item.package.durationDays} hari`
                                    : "Custom"}
                              </p>
                              <p className="text-sm">
                                <span className="font-medium">Harga:</span>{" "}
                                {item.package.price
                                  ? new Intl.NumberFormat("id-ID", {
                                      style: "currency",
                                      currency: "IDR",
                                      minimumFractionDigits: 0,
                                    }).format(item.package.price)
                                  : "N/A"}
                              </p>
                              {item.package.description && (
                                <p className="text-sm line-clamp-3">
                                  {item.package.description}
                                </p>
                              )}
                            </>
                          ) : (
                            <p className="text-sm">Paket yang disesuaikan</p>
                          )}
                        </div>
                      </TooltipContent>
                    </Tooltip>
                  </TableCell>
                  <TableCell className="text-right whitespace-nowrap">
                    {formatCurrency(totalTagihan)}
                  </TableCell>
                  {hasAnyDP && (
                    <TableCell className="text-right whitespace-nowrap">
                      {showSisaTagihan ? (
                        <span className="font-semibold text-orange-600">
                          {formatCurrency(sisaTagihan)}
                        </span>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                  )}
                  <TableCell>
                    <Select
                      value={item.payment_status}
                      onValueChange={(newStatus) =>
                        onUpdateStatus(item.id, newStatus)
                      }
                      disabled={isCompleted}
                    >
                      <SelectTrigger
                        className={cn(
                          "w-full min-w-[120px]",
                          item.payment_status === "PAID" && "border-green-500",
                          item.payment_status === "DOWN_PAYMENT" &&
                            "border-yellow-500",
                          item.payment_status === "UNPAID" && "border-red-500",
                          isCompleted && "opacity-60 cursor-not-allowed"
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
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem
                            onClick={() => onCompleteTransaction(item)}
                            disabled={isCompleted}
                          >
                            <CheckCircle className="mr-2 h-4 w-4" />
                            {isCompleted
                              ? "Sudah Selesai ✓"
                              : "Selesaikan Transaksi"}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onPrint(item)}>
                            <Printer className="mr-2 h-4 w-4" />
                            Cetak Invoice
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => onViewDetails(item)}>
                            Lihat Detail
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onEdit(item)}
                            disabled={isCompleted}
                          >
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => onDelete(item.id)}
                            className="text-red-500"
                            disabled={isCompleted}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Hapus
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="hidden lg:flex lg:items-center lg:gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onCompleteTransaction(item)}
                        className="text-green-600 hover:text-green-700 whitespace-nowrap"
                        disabled={isCompleted}
                        title={
                          isCompleted
                            ? "Transaksi sudah selesai"
                            : "Selesaikan transaksi"
                        }
                      >
                        <CheckCircle className="mr-1 h-3 w-3" />
                        {isCompleted ? "Selesai ✓" : "Selesai"}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onPrint(item)}
                        className="whitespace-nowrap"
                        title="Cetak invoice"
                      >
                        <Printer className="mr-1 h-3 w-3" /> Cetak
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewDetails(item)}
                        className="whitespace-nowrap"
                        title="Lihat detail transaksi"
                      >
                        Detail
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onEdit(item)}
                        className="whitespace-nowrap"
                        disabled={isCompleted}
                        title={
                          isCompleted
                            ? "Transaksi selesai tidak bisa diedit"
                            : "Edit transaksi"
                        }
                      >
                        <Pencil className="mr-1 h-3 w-3" /> Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDelete(item.id)}
                        className="text-red-500 hover:text-red-600 whitespace-nowrap"
                        disabled={isCompleted}
                        title={
                          isCompleted
                            ? "Transaksi selesai tidak bisa dihapus"
                            : "Hapus transaksi"
                        }
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
    </TooltipProvider>
  );
}

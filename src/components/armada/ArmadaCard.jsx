"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Car, Calendar, Wrench, Trash, Pencil } from "lucide-react";
import { Button } from "../ui/button";
import {
  AlertDialog,
  AlertDialogTrigger,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogAction,
  AlertDialogCancel,
} from "@/components/ui/alert-dialog";

export default function ArmadaCard({
  armada,
  onEdit,
  onDelete,
  onMaintenance = () => {},
}) {
  const status = armada.status || "READY";
  const year =
    armada.year ??
    (armada.createdAt ? new Date(armada.createdAt).getFullYear() : null);

  return (
    <Card
      key={armada.id}
      className="relative overflow-hidden border rounded-xl shadow-sm bg-white"
    >
      <div className="p-5">
        {/* header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-blue-400 text-white shadow">
            <Car className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {armada.license_plate}
            </h3>
            <p className="text-xs text-muted-foreground">No. Polisi</p>
          </div>
        </div>

        {/* merk/tipe */}
        <div className="grid grid-cols-2 gap-4 mb-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
            <p className="text-xs text-muted-foreground">Merk</p>
            <p className="mt-1 text-sm text-slate-800 font-medium">
              {armada.brand ?? "-"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
            <p className="text-xs text-muted-foreground">Tipe</p>
            <p className="mt-1 text-sm text-slate-800 font-medium">
              {armada.model ?? "-"}
            </p>
          </div>
        </div>

        {/* year pill */}
        <div className="mt-2">
          <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 rounded-md px-3 py-2 text-sm">
            <Calendar className="h-4 w-4 text-blue-500" />
            <span className="font-medium">Tahun {year ?? "-"}</span>
          </div>
        </div>

        {/* status full width */}
        <div className="mt-4">
          <p className="text-xs text-muted-foreground mb-2">Status Armada</p>
          <div
            className={`w-full rounded-md py-2 px-3 text-sm font-medium text-center ${
              status === "READY"
                ? "bg-emerald-600 text-white"
                : "bg-amber-100 text-amber-800"
            }`}
          >
            {status === "READY" ? "✓ Ready" : status}
          </div>
        </div>

        {/* actions */}
        <div className="flex gap-3 mt-4">
          <Button
            onClick={() => onEdit(armada)}
            className="flex-1 py-2 px-3 rounded-md border border-sky-200 font-medium transition"
          >
            <Pencil className="inline-block mr-2 size-4" />
            Edit
          </Button>
          <Button
            onClick={() => onMaintenance(armada)}
            className="flex-1 py-2 px-3 rounded-md bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition border border-amber-100"
          >
            <Wrench className="inline-block mr-2 size-4" />
            Maintenance
          </Button>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <button className="py-2 px-2 rounded-md border border-red-100 text-white bg-red-500 hover:bg-red-600 text-sm font-medium transition">
                <Trash className="inline-block size-4" />
              </button>
            </AlertDialogTrigger>

            <AlertDialogContent className="max-w-sm">
              <AlertDialogHeader>
                <AlertDialogTitle>Konfirmasi Hapus</AlertDialogTitle>
                <AlertDialogDescription>
                  Anda yakin ingin menghapus armada{" "}
                  <strong>{armada.license_plate}</strong>? Tindakan ini tidak
                  dapat dikembalikan.
                </AlertDialogDescription>
              </AlertDialogHeader>

              <AlertDialogFooter>
                <AlertDialogCancel>Batal</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(armada.id)}
                  className="bg-red-600 text-white hover:bg-red-700"
                >
                  Hapus
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </Card>
  );
}

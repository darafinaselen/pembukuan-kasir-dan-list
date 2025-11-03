"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Pencil, Trash, Moon } from "lucide-react";

export default function SopirCard({ driver, onEdit, onSetStatus, onDelete }) {
  return (
    <Card
      key={driver.id}
      className="relative overflow-hidden border rounded-xl shadow-sm bg-white w-full"
    >
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-500 text-white shadow shrink-0">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <h3
              className="text-lg font-semibold text-slate-800 truncate"
              title={driver.driver_name}
            >
              {driver.driver_name}
            </h3>
            <p className="text-xs text-muted-foreground truncate">Sopir</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 overflow-hidden">
            <p className="text-xs text-muted-foreground truncate">NIK</p>
            <p
              className="mt-1 text-sm text-slate-800 font-medium truncate"
              title={driver.nik ?? "-"}
            >
              {driver.nik ?? "-"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 overflow-hidden">
            <p className="text-xs text-muted-foreground truncate">No. HP</p>
            <p
              className="mt-1 text-sm text-slate-800 font-medium truncate"
              title={driver.phone_number ?? "-"}
            >
              {driver.phone_number ?? "-"}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100 overflow-hidden">
            <p className="text-xs text-muted-foreground truncate">Alamat</p>
            <p
              className="mt-1 text-sm text-slate-800 line-clamp-2"
              title={driver.address ?? "-"}
            >
              {driver.address ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2 truncate">
              Status Sopir
            </p>
            {(() => {
              const s = driver.status || "READY";
              let classes =
                "w-full rounded-md py-2 px-3 text-sm font-medium text-center truncate ";
              let label = s;
              if (s === "READY") {
                classes += "bg-emerald-600 text-white";
                label = "✓ Ready";
              } else if (s === "ON_TRIP") {
                classes += "bg-sky-600 text-white";
                label = "On Trip";
              } else if (s === "OFF_DUTY") {
                classes += "bg-amber-500 text-white";
                label = "Off Duty";
              } else {
                classes += "bg-amber-100 text-amber-800";
              }
              return (
                <div className={classes} title={label}>
                  {label}
                </div>
              );
            })()}
          </div>

          <div className="flex gap-2 mt-3">
            <Button
              onClick={() => onEdit(driver)}
              className="flex-1 py-2 px-2 sm:px-3 rounded-md border border-sky-200 font-medium transition text-xs sm:text-sm"
            >
              <Pencil className="inline-block mr-1 sm:mr-2 size-4 shrink-0" />
              <span className="truncate">Edit</span>
            </Button>

            <Button
              onClick={() => onSetStatus(driver, "OFF_DUTY")}
              className="flex-1 py-2 px-2 sm:px-3 rounded-md bg-amber-50 text-amber-700 text-xs sm:text-sm font-medium hover:bg-amber-100 transition border border-amber-100"
            >
              <Moon className="inline-block mr-1 sm:mr-2 size-4 shrink-0" />
              <span className="truncate">Libur</span>
            </Button>

            <Button
              onClick={() => onDelete(driver.id)}
              className="py-2 px-2 rounded-md border border-red-100 text-white bg-red-500 hover:bg-red-600 text-sm font-medium transition shrink-0"
            >
              <Trash className="inline-block size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

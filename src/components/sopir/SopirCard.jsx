"use client";

import React from "react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { User, Pencil, Trash, Moon } from "lucide-react";

export default function SopirCard({ driver, onEdit, onSetStatus, onDelete }) {
  return (
    <Card
      key={driver.id}
      className="relative overflow-hidden border rounded-xl shadow-sm bg-white"
    >
      <CardHeader>
        <div className="flex items-center gap-3 mb-1">
          <div className="h-10 w-10 rounded-lg flex items-center justify-center bg-purple-500 text-white shadow">
            <User className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-slate-800">
              {driver.driver_name}
            </h3>
            <p className="text-xs text-muted-foreground">Sopir</p>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="grid grid-cols-1 gap-3">
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
            <p className="text-xs text-muted-foreground">NIK</p>
            <p className="mt-1 text-sm text-slate-800 font-medium">
              {driver.nik ?? "-"}
            </p>
          </div>
          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
            <p className="text-xs text-muted-foreground">No. HP</p>
            <p className="mt-1 text-sm text-slate-800 font-medium">
              {driver.phone_number ?? "-"}
            </p>
          </div>

          <div className="bg-white rounded-lg p-3 shadow-sm border border-slate-100">
            <p className="text-xs text-muted-foreground">Alamat</p>
            <p className="mt-1 text-sm text-slate-800">
              {driver.address ?? "-"}
            </p>
          </div>

          <div>
            <p className="text-xs text-muted-foreground mb-2">Status Sopir</p>
            {(() => {
              const s = driver.status || "READY";
              let classes =
                "w-full rounded-md py-2 px-3 text-sm font-medium text-center ";
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
              return <div className={classes}>{label}</div>;
            })()}
          </div>

          <div className="flex gap-3 mt-3">
            <Button
              onClick={() => onEdit(driver)}
              className="flex-1 py-2 px-3 rounded-md border border-sky-200 font-medium transition"
            >
              <Pencil className="inline-block mr-2 size-4" />
              Edit
            </Button>

            <Button
              onClick={() => onSetStatus(driver, "OFF_DUTY")}
              className="flex-1 py-2 px-3 rounded-md bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition border border-amber-100"
            >
              <Moon className="inline-block mr-2 size-4" />
              Libur
            </Button>

            <Button
              onClick={() => onDelete(driver.id)}
              className="py-2 px-2 rounded-md border border-red-100 text-white bg-red-500 hover:bg-red-600 text-sm font-medium transition"
            >
              <Trash className="inline-block size-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

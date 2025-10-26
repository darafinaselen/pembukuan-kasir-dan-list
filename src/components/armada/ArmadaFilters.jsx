import React from "react";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";

export default function ArmadaFilters({
  searchTerm,
  onSearchChange,
  filterStatus,
  setFilterStatus,
  statusCounts,
}) {
  return (
    <div className="p-4">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex gap-2 items-center flex-wrap">
          {[
            ["ALL", "Semua"],
            ["READY", "Tersedia"],
            ["BOOKED", "Disewa"],
            ["ON_TRIP", "On Trip"],
            ["MAINTENANCE", "Maintenance"],
          ].map(([key, label]) => (
            <button
              key={key}
              onClick={() => setFilterStatus(key)}
              className={`px-3 py-1 rounded-md text-sm font-medium ${
                filterStatus === key
                  ? "bg-slate-800 text-white"
                  : "bg-slate-100 text-slate-800"
              }`}
            >
              {label} {statusCounts[key] ? `(${statusCounts[key]})` : ""}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:flex-none">
            <Input
              id="search"
              value={searchTerm}
              onChange={onSearchChange}
              placeholder="Cari plat, merk atau tipe..."
              className="pr-10"
            />
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500" />
          </div>
        </div>
      </div>
    </div>
  );
}

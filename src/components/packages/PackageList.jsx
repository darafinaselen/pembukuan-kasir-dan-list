"use client";

import React from "react";
import {
  Card,
  CardHeader,
  CardContent,
  CardDescription,
  CardFooter,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Eye,
  Pencil,
  Trash2,
  Truck,
  Map,
  Car,
  Compass,
  Plane,
  Settings,
  Clock,
  Hotel,
} from "lucide-react";

const fmt = (v) => {
  if (v == null) return "-";
  if (typeof v === "string" && v.trim() === "") return "-";
  const num = Number(v);
  if (isNaN(num)) {
    // For actual NaN values, return "RpNaN"
    if (typeof v === "number" && isNaN(v)) return `Rp${v}`;
    // For invalid strings, return the string as-is
    return String(v);
  }
  try {
    return new Intl.NumberFormat("id-ID", {
      style: "currency",
      currency: "IDR",
      maximumFractionDigits: 0,
    }).format(num);
  } catch (e) {
    return String(v);
  }
};

export { fmt };

export function PackageList({ packages, onEdit, onDelete, onView }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!packages || packages.length === 0 ? (
        <div className="col-span-full text-center text-sm text-muted-foreground">
          Belum ada paket
        </div>
      ) : (
        packages.map((pkg) => {
          const typeMap = {
            CAR_RENTAL: "Sewa Mobil",
            FULL_DAY_TRIP: "Full Day Trip",
            TOUR_PACKAGE: "Paket Tour",
            CUSTOM_PRICING: "Harga Custom",
            "Sewa Mobil": "Sewa Mobil",
            "Full Day Trip": "Full Day Trip",
            "Paket Tour": "Paket Tour",
            "Harga Custom": "Harga Custom",
          };

          const rawTipe = pkg.type ?? pkg.tipePaket;
          const tipe = typeMap[rawTipe] ?? rawTipe ?? "-";
          const title = pkg.name ?? pkg.namaPaket;
          const description = pkg.description ?? pkg.deskripsi ?? "-";
          let duration = "-";

          if (tipe === "Sewa Mobil") {
            duration = pkg.durationHours + " Jam";
          } else if (tipe === "Full Day Trip") {
            duration = "1 Hari";
          } else if (tipe === "Paket Tour") {
            if (pkg.durationDays != null) {
              duration = `${pkg.durationDays} Hari ${
                pkg.durationNights ?? 0
              } Malam`;
            } else if (pkg.durasi) {
              duration = `${pkg.durasi.hari} Hari ${
                pkg.durasi.malam ?? 0
              } Malam`;
            } else {
              duration = "-";
            }
          } else {
            // fallback for other/unknown shapes
            duration =
              pkg.durationDays != null
                ? `${pkg.durationDays} Hari ${pkg.durationNights ?? 0} Malam`
                : pkg.durationHours
                  ? `${pkg.durationHours} Jam`
                  : pkg.durasi
                    ? `${pkg.durasi.hari} Hari ${pkg.durasi.malam ?? 0} Malam`
                    : "-";
          }

          const price = pkg.price ?? pkg.hargaDefault ?? 0;
          const overtime = pkg.overtimeRate ?? pkg.tarifOvertime;
          const hotelTiers =
            pkg.hotelTiers?.length ?? pkg.tarifHotel?.length ?? 0;
          const itineraryDays =
            pkg.itineraries?.length ?? pkg.itinerary?.length ?? 0;

          return (
            <Card
              key={pkg.id}
              className="group hover:shadow-xl transition-all duration-300 border-gray-200 overflow-hidden flex flex-col"
            >
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="relative">
                      <div className="w-14 h-14 bg-teal-500 rounded-xl flex items-center justify-center">
                        {tipe === "Sewa Mobil" || tipe === "CAR_RENTAL" ? (
                          <Car className="h-7 w-7 text-white" />
                        ) : tipe === "Full Day Trip" ? (
                          <Compass className="h-7 w-7 text-white" />
                        ) : tipe === "Harga Custom" || tipe === "CUSTOM_PRICING" ? (
                          <Settings className="h-7 w-7 text-white" />
                        ) : (
                          <Plane className="h-7 w-7 text-white" />
                        )}
                      </div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-gray-900 mb-2 line-clamp-2">
                        {title}
                      </CardTitle>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          variant="secondary"
                          className="bg-teal-100 text-teal-700 hover:bg-teal-200 border-0"
                        >
                          {tipe}
                        </Badge>
                        {pkg.isCustomizable && (
                          <Badge
                            variant="secondary"
                            className="bg-indigo-100 text-indigo-700 hover:bg-indigo-200 border-0"
                          >
                            <Settings className="h-3 w-3 mr-1" />
                            Custom
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4 pb-4 flex-1">
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-100">
                  <p className="text-gray-500 mb-1.5">Deskripsi</p>
                  <p className="text-gray-900 line-clamp-2">{description}</p>
                </div>

                <div className="flex items-center gap-2 px-3 py-2.5 bg-purple-50 rounded-lg border border-purple-100">
                  <Clock className="h-4 w-4 text-purple-600 shrink-0" />
                  <div>
                    <p className="text-purple-900">{duration}</p>
                  </div>
                </div>

                {tipe === "Harga Custom" || tipe === "CUSTOM_PRICING" ? (
                  <div className="px-3 py-2.5 bg-yellow-50 rounded-lg border border-yellow-100">
                    <div className="flex items-center justify-center">
                      <p className="text-yellow-700 text-sm">
                        💰 Harga disesuaikan per transaksi
                      </p>
                    </div>
                  </div>
                ) : tipe === "Sewa Mobil" ||
                  tipe === "CAR_RENTAL" ||
                  tipe === "Full Day Trip" ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <p className="text-blue-600">Harga</p>
                        <p className="text-blue-900">{fmt(price)}</p>
                      </div>
                    </div>
                    {(tipe === "Sewa Mobil" || tipe === "CAR_RENTAL") &&
                      overtime &&
                      overtime > 0 && (
                        <div className="px-3 py-2.5 bg-orange-50 rounded-lg border border-orange-100">
                          <div className="flex items-center justify-between">
                            <p className="text-orange-600">Overtime</p>
                            <p className="text-orange-900">
                              {fmt(overtime)}/jam
                            </p>
                          </div>
                        </div>
                      )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    <div className="px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <p className="text-blue-600">Harga</p>
                        <p className="text-blue-900">
                          {(() => {
                            // Get minimum price from all priceRanges across all hotel tiers for TOUR_PACKAGE
                            let minPrice = null;
                            if (pkg.hotelTiers && Array.isArray(pkg.hotelTiers)) {
                              for (const tier of pkg.hotelTiers) {
                                if (tier.priceRanges && Array.isArray(tier.priceRanges)) {
                                  for (const range of tier.priceRanges) {
                                    if (range.price && (minPrice === null || range.price < minPrice)) {
                                      minPrice = range.price;
                                    }
                                  }
                                }
                              }
                            }
                            return minPrice
                              ? `Mulai dari ${fmt(minPrice)}/PAX`
                              : fmt(price);
                          })()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-amber-50 rounded-lg border border-amber-100">
                      <Hotel className="h-4 w-4 text-amber-600" />
                      <p className="text-amber-700">
                        {hotelTiers} Tingkat Hotel
                      </p>
                    </div>
                    <div className="flex items-center gap-2 px-3 py-2 bg-emerald-50 rounded-lg border border-emerald-100">
                      <Map className="h-4 w-4 text-emerald-600" />
                      <p className="text-emerald-700">
                        {itineraryDays} Hari Itinerary
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter className="pt-0 pb-5 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 border-teal-200 text-teal-600 hover:bg-teal-50 hover:text-teal-700"
                  onClick={() => onView && onView(pkg)}
                >
                  <Eye className="mr-1.5 h-3.5 w-3.5" />
                  Detail
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-blue-200 text-blue-600 hover:bg-blue-50 hover:text-blue-700"
                  onClick={() => onEdit && onEdit(pkg)}
                >
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-200 text-red-600 hover:bg-red-50 hover:text-red-700"
                  onClick={() => onDelete && onDelete(pkg)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </CardFooter>
            </Card>
          );
        })
      )}
    </div>
  );
}

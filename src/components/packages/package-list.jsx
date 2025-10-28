"use client";

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

export function PackageList({ packages, onEdit, onDelete, onView }) {
  const fmt = (v) => {
    if (v == null) return "-";
    try {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(v);
    } catch (e) {
      return v;
    }
  };

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {!packages || packages.length === 0 ? (
        <div className="col-span-full text-center text-sm text-muted-foreground">
          Belum ada paket
        </div>
      ) : (
        packages.map((pkg) => {
          const tipe = pkg.type ?? pkg.tipePaket;
          const title = pkg.name ?? pkg.namaPaket;
          const description = pkg.description ?? pkg.deskripsi ?? "-";
          const duration =
            pkg.durationDays != null
              ? `${pkg.durationDays} Hari ${pkg.durationNights ?? 0} Malam`
              : pkg.durationHours
              ? `${pkg.durationHours} Jam`
              : pkg.durasi
              ? `${pkg.durasi.hari} Hari ${pkg.durasi.malam ?? 0} Malam`
              : "-";

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
                  <Clock className="h-4 w-4 text-purple-600 flex-shrink-0" />
                  <div>
                    <p className="text-purple-900">{duration}</p>
                  </div>
                </div>

                {tipe === "Sewa Mobil" ||
                tipe === "CAR_RENTAL" ||
                tipe === "Full Day Trip" ? (
                  <div className="space-y-2">
                    <div className="px-3 py-2.5 bg-blue-50 rounded-lg border border-blue-100">
                      <div className="flex items-center justify-between">
                        <p className="text-blue-600">Harga</p>
                        <p className="text-blue-900">{fmt(price)}</p>
                      </div>
                    </div>
                    {overtime && overtime > 0 && (
                      <div className="px-3 py-2.5 bg-orange-50 rounded-lg border border-orange-100">
                        <div className="flex items-center justify-between">
                          <p className="text-orange-600">Overtime</p>
                          <p className="text-orange-900">{fmt(overtime)}/jam</p>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
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

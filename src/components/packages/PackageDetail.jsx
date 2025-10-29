"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Hotel, Map } from "lucide-react";

export function PackageDetail({ open, onOpenChange, pkg }) {
  if (!pkg) return null;

  const formatCurrency = (v) => {
    if (v == null) return "-";
    try {
      return new Intl.NumberFormat("id-ID", {
        style: "currency",
        currency: "IDR",
        maximumFractionDigits: 0,
      }).format(v);
    } catch (e) {
      return String(v);
    }
  };

  const isCar = pkg.type === "CAR_RENTAL" || pkg.tipePaket === "Sewa Mobil";
  const hotelTiers = pkg.hotelTiers || pkg.tarifHotel || [];
  const itineraries = pkg.itineraries || pkg.itinerary || [];

  // Truncate long text to a few words and append ellipsis
  const takeWords = (text, limit = 20) => {
    if (text == null) return "-";
    const s = String(text).trim();
    if (!s) return "-";
    const words = s.split(/\s+/);
    return words.length > limit ? words.slice(0, limit).join(" ") + "..." : s;
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <div>
              <DialogTitle className="text-2xl mb-2">
                {pkg.name || pkg.namaPaket}
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div>
            <h3 className="text-gray-500 mb-2">Deskripsi</h3>
            <p className="text-gray-900">
              {takeWords(pkg.description ?? pkg.deskripsi, 20)}
            </p>
          </div>

          {(pkg.includes || pkg.include) && (
            <div>
              <h3 className="text-green-600 mb-2">✓ Include</h3>
              <div className="flex flex-wrap gap-2">
                {(
                  pkg.includes ||
                  (pkg.include
                    ? Array.isArray(pkg.include)
                      ? pkg.include
                      : String(pkg.include).split(",")
                    : [])
                ).map((inc, i) => (
                  <Badge key={i} className="bg-teal-50 text-teal-800">
                    {inc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {(pkg.excludes || pkg.exclude) && (
            <div>
              <h3 className="text-red-600 mb-2">✗ Exclude</h3>
              <div className="flex flex-wrap gap-2">
                {(
                  pkg.excludes ||
                  (pkg.exclude
                    ? Array.isArray(pkg.exclude)
                      ? pkg.exclude
                      : String(pkg.exclude).split(",")
                    : [])
                ).map((exc, i) => (
                  <Badge key={i} className="bg-red-50 text-red-800">
                    {exc}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {isCar ? (
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
                <p className="text-blue-600 mb-1">Harga Paket</p>
                <p className="text-blue-900 text-xl">
                  {formatCurrency(pkg.price ?? pkg.hargaDefault)}
                </p>
              </div>
              <div className="p-4 bg-orange-50 rounded-lg border border-orange-100">
                <p className="text-orange-600 mb-1">Tarif Overtime</p>
                <p className="text-orange-900 text-xl">
                  {formatCurrency(pkg.overtimeRate ?? pkg.tarifOvertime)}/jam
                </p>
              </div>
            </div>
          ) : (
            <Tabs defaultValue="hotel" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="hotel" className="flex items-center gap-2">
                  <Hotel className="h-4 w-4" />
                  Tarif Hotel
                </TabsTrigger>
                <TabsTrigger
                  value="itinerary"
                  className="flex items-center gap-2"
                >
                  <Map className="h-4 w-4" />
                  Itinerary
                </TabsTrigger>
              </TabsList>

              <TabsContent value="hotel" className="space-y-3 mt-4">
                {pkg.type === "TOUR_PACKAGE" ||
                pkg.tipePaket === "Paket Tour" ? (
                  <div className="grid gap-4">
                    {hotelTiers.map((tier, index) => (
                      <div
                        key={tier.id ?? index}
                        className="p-4 bg-amber-50 rounded-lg border border-amber-100 space-y-3"
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Hotel className="h-5 w-5 text-amber-600" />
                            <p className="text-amber-900">
                              {tier.starRating
                                ? `Bintang ${tier.starRating}`
                                : tier.tingkat}
                            </p>
                          </div>
                          <p className="text-amber-900">
                            {formatCurrency(
                              tier.pricePerPax ?? tier.tarifPerPax
                            )}{" "}
                            / PAX
                          </p>
                        </div>
                        {(tier.hotels || tier.daftarHotel) &&
                          (tier.hotels || tier.daftarHotel).length > 0 && (
                            <div>
                              <p className="text-amber-700 mb-2">
                                Pilihan Hotel:
                              </p>
                              <div className="flex flex-wrap gap-2">
                                {(tier.hotels || tier.daftarHotel).map(
                                  (h, hi) => (
                                    <Badge
                                      key={hi}
                                      variant="secondary"
                                      className="bg-white text-amber-800 border border-amber-200"
                                    >
                                      {h.name ?? h}
                                    </Badge>
                                  )
                                )}
                              </div>
                            </div>
                          )}
                        {tier.priceRanges && tier.priceRanges.length > 0 && (
                          <div>
                            <p className="text-amber-700 mt-2 mb-2">
                              Harga per Rentang Pax:
                            </p>
                            <div className="space-y-1">
                              {tier.priceRanges.map((r) => (
                                <div
                                  key={r.id ?? `${r.minPax}-${r.maxPax}`}
                                  className="text-amber-800 text-sm"
                                >
                                  {r.minPax}-{r.maxPax} pax —{" "}
                                  {formatCurrency(r.price)}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-sm text-gray-500">
                    Tarif hotel hanya tersedia untuk paket tour.
                  </div>
                )}
              </TabsContent>

              <TabsContent value="itinerary" className="space-y-3 mt-4">
                <div className="space-y-4">
                  {itineraries.map((day, index) => (
                    <div
                      key={day.id ?? index}
                      className="p-4 bg-emerald-50 rounded-lg border border-emerald-100"
                    >
                      <div className="flex items-start gap-3">
                        <div className="shrink-0 w-10 h-10 bg-emerald-600 text-white rounded-full flex items-center justify-center">
                          {day.day ?? day.hari}
                        </div>
                        <div className="flex-1">
                          <p className="text-emerald-600 mb-1">
                            Hari ke-{day.day ?? day.hari}
                          </p>
                          <p className="text-gray-900">
                            {day.title ?? day.aktivitas}
                          </p>
                          {day.description ?? day.deskripsi ? (
                            <p className="text-gray-700 mt-1">
                              {day.description ?? day.deskripsi}
                            </p>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export function PackageDetail({ open, onOpenChange, pkg }) {
  if (!pkg) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{pkg.name}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <p><strong>Tipe Paket:</strong> {pkg.type === "CAR_RENTAL" ? "Sewa Mobil" : "Paket Tour"}</p>
          <p><strong>Deskripsi:</strong> {pkg.description}</p>

          {pkg.type === 'CAR_RENTAL' && (
            <>
              <p><strong>Harga Paket:</strong> Rp {pkg.price?.toLocaleString()}</p>
              <p><strong>Durasi:</strong> {pkg.durationHours} Jam</p>
              <p><strong>Tarif Overtime:</strong> Rp {pkg.overtimeRate?.toLocaleString()}/jam</p>
            </>
          )}

          {pkg.type === 'TOUR_PACKAGE' && (
            <>
               <p><strong>Durasi:</strong> {pkg.durationDays} Hari {pkg.durationNights} Malam</p>
               <div>
                <strong>Tingkat Hotel:</strong>
                <ul>
                  {pkg.hotelTiers?.map(tier => (
                    <li key={tier.id}>Bintang {tier.starRating}: Rp {tier.pricePerPax?.toLocaleString()} / PAX</li>
                  ))}
                </ul>
               </div>
            </>
          )}

          <div>
            <strong>Include:</strong>
            <ul className="list-disc list-inside">
              {pkg.includes?.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
          <div>
            <strong>Exclude:</strong>
            <ul className="list-disc list-inside">
              {pkg.excludes?.map((item, index) => <li key={index}>{item}</li>)}
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

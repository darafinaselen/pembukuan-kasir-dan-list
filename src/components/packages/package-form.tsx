"use client";

import { useState, useEffect } from "react";
import { useForm, useFieldArray, Controller } from "react-hook-form";
import {
  Button,
  Input,
  Textarea,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui";
import { PlusCircle, Trash2 } from "lucide-react";

export function PackageForm({ open, onOpenChange, onSubmit, defaultValues }) {
  const {
    register,
    handleSubmit,
    control,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: defaultValues || {
      type: "CAR_RENTAL",
      includes: [""],
      excludes: [""],
      hotelTiers: [],
      itineraries: [],
    },
  });

  const packageType = watch("type");

  const {
    fields: includesFields,
    append: appendInclude,
    remove: removeInclude,
  } = useFieldArray({ control, name: "includes" });
  const {
    fields: excludesFields,
    append: appendExclude,
    remove: removeExclude,
  } = useFieldArray({ control, name: "excludes" });
  const {
    fields: hotelTiersFields,
    append: appendHotelTier,
    remove: removeHotelTier,
  } = useFieldArray({ control, name: "hotelTiers" });
  const {
    fields: itinerariesFields,
    append: appendItinerary,
    remove: removeItinerary,
  } = useFieldArray({ control, name: "itineraries" });

  useEffect(() => {
    if (defaultValues) {
      reset(defaultValues);
    }
  }, [defaultValues, reset]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>
            {defaultValues ? "Edit Paket Jasa" : "Buat Paket Jasa Baru"}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-h-[80vh] overflow-y-auto p-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Nama Paket</Label>
              <Input id="name" {...register("name", { required: true })} />
              {errors.name && <p className="text-red-500 text-sm">Nama paket harus diisi.</p>}
            </div>
            <div>
              <Label htmlFor="type">Tipe Paket</Label>
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe paket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="CAR_RENTAL">Sewa Mobil</SelectItem>
                      <SelectItem value="TOUR_PACKAGE">Paket Tour</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Deskripsi</Label>
            <Textarea id="description" {...register("description")} />
          </div>

          {packageType === "CAR_RENTAL" && (
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="price">Harga Default</Label>
                <Input id="price" type="number" {...register("price", { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="durationHours">Durasi Default (Jam)</Label>
                <Input id="durationHours" type="number" {...register("durationHours", { valueAsNumber: true })} />
              </div>
              <div>
                <Label htmlFor="overtimeRate">Tarif Overtime Default</Label>
                <Input id="overtimeRate" type="number" {...register("overtimeRate", { valueAsNumber: true })} />
              </div>
            </div>
          )}

          {packageType === "TOUR_PACKAGE" && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="durationDays">Durasi (Hari)</Label>
                  <Input id="durationDays" type="number" {...register("durationDays", { valueAsNumber: true })} />
                </div>
                <div>
                  <Label htmlFor="durationNights">Durasi (Malam)</Label>
                  <Input id="durationNights" type="number" {...register("durationNights", { valueAsNumber: true })} />
                </div>
              </div>

              {/* Hotel Tiers */}
              <div>
                <Label>Tingkat Hotel</Label>
                {hotelTiersFields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2 mb-2">
                    <Input placeholder="Bintang" {...register(`hotelTiers.${index}.starRating`, { valueAsNumber: true })} />
                    <Input placeholder="Tarif per PAX" {...register(`hotelTiers.${index}.pricePerPax`, { valueAsNumber: true })} />
                    <Button type="button" variant="destructive" onClick={() => removeHotelTier(index)}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
                <Button type="button" onClick={() => appendHotelTier({ starRating: 0, pricePerPax: 0 })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Tingkat Hotel
                </Button>
              </div>

              {/* Itineraries */}
              <div>
                <Label>Itinerary</Label>
                {itinerariesFields.map((field, index) => (
                  <div key={field.id} className="space-y-2 mb-2 p-2 border rounded">
                     <div className="flex items-center gap-2">
                        <Input placeholder="Hari ke-" {...register(`itineraries.${index}.day`, { valueAsNumber: true })} />
                        <Input placeholder="Judul" {...register(`itineraries.${index}.title`)} />
                        <Button type="button" variant="destructive" onClick={() => removeItinerary(index)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                     </div>
                     <Textarea placeholder="Deskripsi Itinerary" {...register(`itineraries.${index}.description`)} />
                  </div>
                ))}
                <Button type="button" onClick={() => appendItinerary({ day: 1, title: "", description: "" })}>
                  <PlusCircle className="mr-2 h-4 w-4" />
                  Tambah Hari Itinerary
                </Button>
              </div>

            </div>
          )}

          {/* Includes and Excludes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Includes</Label>
              {includesFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <Input {...register(`includes.${index}`)} />
                  <Button type="button" variant="destructive" onClick={() => removeInclude(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={() => appendInclude("")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Include
              </Button>
            </div>
            <div>
              <Label>Excludes</Label>
              {excludesFields.map((field, index) => (
                <div key={field.id} className="flex items-center gap-2 mb-2">
                  <Input {...register(`excludes.${index}`)} />
                  <Button type="button" variant="destructive" onClick={() => removeExclude(index)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              <Button type="button" onClick={() => appendExclude("")}>
                <PlusCircle className="mr-2 h-4 w-4" />
                Tambah Exclude
              </Button>
            </div>
          </div>

          <DialogFooter>
            <Button type="submit">Simpan Paket</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

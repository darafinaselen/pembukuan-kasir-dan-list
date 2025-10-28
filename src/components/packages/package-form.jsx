import { useEffect, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Hotel, Map, Settings } from "lucide-react";
import { HotelListInput } from "./HotelListInput";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
// import type { Package, HotelRate, ItineraryDay } from "../App";

// interface PackageFormProps {
//   open: boolean;
//   onOpenChange: (open: boolean) => void;
//   package_: Package | null;
//   onSave: (package_: Omit<Package, "id"> & { id?: string }) => void;
// }

// type PackageFormData = {
//   namaPaket: string,
//   tipePaket: "Sewa Mobil" | "Paket Tour" | "Full Day Trip",
//   deskripsi: string,
//   durasiHari: number,
//   durasiMalam: number,
//   isCustomizable: boolean,
//   customizableItems: string[],
//   hargaDefault?: number,
//   tarifOvertime?: number,
//   include?: string,
//   exclude?: string,
//   tarifHotel: HotelRate[],
//   itinerary: ItineraryDay[],
// };

export function PackageForm({
  open,
  onOpenChange,
  package_,
  onSave,
  onSubmit: onSubmitProp,
  defaultValues,
}) {
  const {
    register,
    handleSubmit,
    reset,
    control,
    watch,
    formState: { errors },
  } = useForm({
    defaultValues: {
      isCustomizable: false,
      customizableItems: [],
      tarifHotel: [
        {
          tingkat: "Bintang 3",
          tarifPerPax: 0,
          daftarHotel: [],
        },
      ],
      itinerary: [{ hari: 1, aktivitas: "" }],
    },
  });

  const {
    fields: hotelFields,
    append: appendHotel,
    remove: removeHotel,
  } = useFieldArray({
    control,
    name: "tarifHotel",
  });

  const {
    fields: itineraryFields,
    append: appendItinerary,
    remove: removeItinerary,
  } = useFieldArray({
    control,
    name: "itinerary",
  });

  // Chips for customizableItems (no need for useFieldArray, just use array)

  const tipePaket = watch("tipePaket");
  const isCustomizable = watch("isCustomizable");
  const [newCustomItem, setNewCustomItem] = useState("");

  useEffect(() => {
    const pkg = package_ ?? defaultValues;
    if (pkg) {
      // support both English- and Indonesian-shaped package objects
      const namaPaket = pkg.namaPaket ?? pkg.name ?? "";
      const tipePaket = pkg.tipePaket ?? pkg.type ?? "Sewa Mobil";
      const deskripsi = pkg.deskripsi ?? pkg.description ?? "";
      const durasiHari =
        pkg.durasi?.hari ?? pkg.durationDays ?? pkg.durationHours ?? 1;
      const durasiMalam = pkg.durasi?.malam ?? pkg.durationNights ?? 0;
      const isCustom = pkg.isCustomizable ?? pkg.isCustomizable ?? false;
      const customizableItems =
        pkg.customizableItems ?? pkg.customizableItems ?? [];
      const hargaDefault = pkg.hargaDefault ?? pkg.price ?? 0;
      const tarifOvertime = pkg.tarifOvertime ?? pkg.overtimeRate ?? 0;
      const include = pkg.include ?? pkg.includes ?? "";
      const exclude = pkg.exclude ?? pkg.excludes ?? "";
      const tarifHotelVal =
        pkg.tarifHotel ?? pkg.hotelTiers ?? pkg.tarifHotel ?? [];
      const itineraryVal =
        pkg.itinerary ?? pkg.itineraries ?? pkg.itinerary ?? [];

      reset({
        namaPaket,
        tipePaket,
        deskripsi,
        durasiHari,
        durasiMalam,
        isCustomizable: isCustom,
        customizableItems: customizableItems || [],
        hargaDefault: hargaDefault || 0,
        tarifOvertime: tarifOvertime || 0,
        include,
        exclude,
        tarifHotel:
          Array.isArray(tarifHotelVal) && tarifHotelVal.length > 0
            ? tarifHotelVal
            : [
                {
                  tingkat: "Bintang 3",
                  tarifPerPax: 0,
                  daftarHotel: [],
                },
              ],
        itinerary:
          Array.isArray(itineraryVal) && itineraryVal.length > 0
            ? itineraryVal
            : [{ hari: 1, aktivitas: "" }],
      });
    } else {
      reset({
        namaPaket: "",
        tipePaket: "Sewa Mobil",
        deskripsi: "",
        durasiHari: 1,
        durasiMalam: 0,
        isCustomizable: false,
        customizableItems: [],
        hargaDefault: 0,
        tarifOvertime: 0,
        include: "",
        exclude: "",
        tarifHotel: [
          {
            tingkat: "Bintang 3",
            tarifPerPax: 0,
            daftarHotel: [],
          },
        ],
        itinerary: [{ hari: 1, aktivitas: "" }],
      });
    }
  }, [package_, defaultValues, reset, open]);

  const onSubmit = (data) => {
    const packageData = {
      namaPaket: data.namaPaket,
      tipePaket: data.tipePaket,
      deskripsi: data.deskripsi,
      durasi: {
        hari: data.durasiHari,
        malam: data.durasiMalam,
      },
      isCustomizable: data.isCustomizable,
      customizableItems: data.isCustomizable
        ? data.customizableItems
        : undefined,
      include: data.include,
      exclude: data.exclude,
    };

    if (data.tipePaket === "Sewa Mobil" || data.tipePaket === "Full Day Trip") {
      packageData.hargaDefault = data.hargaDefault;
      packageData.tarifOvertime = data.tarifOvertime;
      if (data.tipePaket === "Full Day Trip") {
        packageData.itinerary = data.itinerary;
      }
    } else if (data.tipePaket === "Paket Tour") {
      packageData.tarifHotel = data.tarifHotel;
      packageData.itinerary = data.itinerary;
    }

    // preserve id whether caller passed package_ or defaultValues
    if (package_?.id) {
      packageData.id = package_.id;
    } else if (defaultValues?.id) {
      packageData.id = defaultValues.id;
    }

    if (typeof onSave === "function") {
      onSave(packageData);
    } else if (typeof onSubmitProp === "function") {
      onSubmitProp(packageData);
    } else {
      console.warn("PackageForm: no save handler provided");
    }
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {package_ ? "Edit Paket Jasa" : "Tambah Paket Jasa Baru"}
          </DialogTitle>
          <DialogDescription>
            {package_
              ? "Perbarui informasi paket jasa. Klik simpan untuk menyimpan perubahan."
              : "Masukkan data paket jasa baru. Klik simpan untuk menambahkan ke database."}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="namaPaket">
                Nama Paket <span className="text-red-500">*</span>
              </Label>
              <Input
                id="namaPaket"
                placeholder="Contoh: Paket Tour Lombok 4D3N"
                {...register("namaPaket", {
                  required: "Nama paket harus diisi",
                })}
              />
              {errors.namaPaket && (
                <p className="text-red-500">{errors.namaPaket.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="tipePaket">
                Tipe Paket <span className="text-red-500">*</span>
              </Label>
              <Controller
                name="tipePaket"
                control={control}
                rules={{ required: "Tipe paket harus dipilih" }}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger>
                      <SelectValue placeholder="Pilih tipe paket" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Sewa Mobil">Sewa Mobil</SelectItem>
                      <SelectItem value="Full Day Trip">
                        Full Day Trip (1 Hari)
                      </SelectItem>
                      <SelectItem value="Paket Tour">
                        Paket Tour (Multi Hari)
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
              {errors.tipePaket && (
                <p className="text-red-500">{errors.tipePaket.message}</p>
              )}
            </div>

            <div className="grid gap-2">
              <Label htmlFor="deskripsi">
                Deskripsi Paket <span className="text-red-500">*</span>
              </Label>
              <Textarea
                id="deskripsi"
                placeholder="Deskripsi singkat tentang paket ini"
                rows={2}
                {...register("deskripsi", {
                  required: "Deskripsi harus diisi",
                })}
              />
              {errors.deskripsi && (
                <p className="text-red-500">{errors.deskripsi.message}</p>
              )}
            </div>

            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Settings className="h-4 w-4 text-indigo-600" />
                  <Label htmlFor="isCustomizable" className="cursor-pointer">
                    Paket Dapat Disesuaikan (Customizable)
                  </Label>
                </div>
                <Controller
                  name="isCustomizable"
                  control={control}
                  render={({ field }) => (
                    <Switch
                      id="isCustomizable"
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  )}
                />
              </div>
              {isCustomizable && (
                <div className="mt-3 space-y-2">
                  <Label className="text-indigo-700">
                    Item yang Dapat Disesuaikan
                  </Label>
                  <Controller
                    name="customizableItems"
                    control={control}
                    render={({ field }) => (
                      <div>
                        <div className="flex flex-wrap gap-2 items-center mb-2">
                          {field.value?.map((item, idx) => (
                            <Badge
                              key={item + idx}
                              color="teal"
                              className="flex items-center gap-1"
                            >
                              {item}
                              <button
                                type="button"
                                className="ml-1 text-xs"
                                onClick={() => {
                                  const newArr = field.value.filter(
                                    (_, i) => i !== idx
                                  );
                                  field.onChange(newArr);
                                }}
                              >
                                <span className="text-xs">×</span>
                              </button>
                            </Badge>
                          ))}
                        </div>
                        <div className="flex gap-2 items-center">
                          <Input
                            value={newCustomItem}
                            onChange={(e) => setNewCustomItem(e.target.value)}
                            placeholder="Tambah item..."
                            className="w-auto min-w-[120px]"
                            onKeyDown={(e) => {
                              if (e.key === "Enter") {
                                e.preventDefault();
                                if (
                                  newCustomItem.trim() &&
                                  !field.value.includes(newCustomItem.trim())
                                ) {
                                  field.onChange([
                                    ...field.value,
                                    newCustomItem.trim(),
                                  ]);
                                  setNewCustomItem("");
                                }
                              }
                            }}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              if (
                                newCustomItem.trim() &&
                                !field.value.includes(newCustomItem.trim())
                              ) {
                                field.onChange([
                                  ...field.value,
                                  newCustomItem.trim(),
                                ]);
                                setNewCustomItem("");
                              }
                            }}
                          >
                            <Plus className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    )}
                  />
                  <p className="text-indigo-600">
                    Contoh: Pilih Destinasi, Tingkat Hotel, Durasi, Jumlah
                    Peserta, dll.
                  </p>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="durasiHari">
                  Durasi (Hari) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="durasiHari"
                  type="number"
                  placeholder="4"
                  {...register("durasiHari", {
                    required: "Durasi hari harus diisi",
                    min: {
                      value: 1,
                      message: "Minimal 1 hari",
                    },
                    valueAsNumber: true,
                  })}
                />
                {errors.durasiHari && (
                  <p className="text-red-500">{errors.durasiHari.message}</p>
                )}
              </div>

              <div className="grid gap-2">
                <Label htmlFor="durasiMalam">
                  Durasi (Malam) <span className="text-red-500">*</span>
                </Label>
                <Input
                  id="durasiMalam"
                  type="number"
                  placeholder="3"
                  {...register("durasiMalam", {
                    required: "Durasi malam harus diisi",
                    min: {
                      value: 0,
                      message: "Minimal 0 malam",
                    },
                    valueAsNumber: true,
                  })}
                />
                {errors.durasiMalam && (
                  <p className="text-red-500">{errors.durasiMalam.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="include">Include</Label>
                <Textarea
                  id="include"
                  placeholder="Mobil + Sopir, BBM, Hotel, Sarapan"
                  rows={2}
                  {...register("include")}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="exclude">Exclude</Label>
                <Textarea
                  id="exclude"
                  placeholder="Tiket pesawat, Makan, Tiket wisata"
                  rows={2}
                  {...register("exclude")}
                />
              </div>
            </div>

            {tipePaket === "Sewa Mobil" || tipePaket === "Full Day Trip" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="hargaDefault">
                      Harga Default (per PAX){" "}
                      <span className="text-red-500">*</span>
                    </Label>
                    <Input
                      id="hargaDefault"
                      type="number"
                      placeholder="500000"
                      {...register("hargaDefault", {
                        required:
                          tipePaket === "Sewa Mobil" ||
                          tipePaket === "Full Day Trip"
                            ? "Harga harus diisi"
                            : false,
                        min: {
                          value: 0,
                          message: "Harga minimal 0",
                        },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.hargaDefault && (
                      <p className="text-red-500">
                        {errors.hargaDefault.message}
                      </p>
                    )}
                  </div>

                  <div className="grid gap-2">
                    <Label htmlFor="tarifOvertime">
                      Tarif Overtime (per Jam)
                    </Label>
                    <Input
                      id="tarifOvertime"
                      type="number"
                      placeholder="50000"
                      {...register("tarifOvertime", {
                        min: {
                          value: 0,
                          message: "Tarif minimal 0",
                        },
                        valueAsNumber: true,
                      })}
                    />
                    {errors.tarifOvertime && (
                      <p className="text-red-500">
                        {errors.tarifOvertime.message}
                      </p>
                    )}
                  </div>
                </div>

                {tipePaket === "Full Day Trip" && (
                  <div className="space-y-3">
                    <Label>Itinerary</Label>
                    {itineraryFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3 bg-gray-50 rounded-lg border space-y-2"
                      >
                        <Label>Aktivitas</Label>
                        <Textarea
                          placeholder="Deskripsi aktivitas sepanjang hari..."
                          rows={4}
                          {...register(`itinerary.${index}.aktivitas`, {
                            required: "Aktivitas harus diisi",
                          })}
                        />
                        <input
                          type="hidden"
                          {...register(`itinerary.${index}.hari`)}
                          value={1}
                        />
                      </div>
                    ))}
                  </div>
                )}
              </>
            ) : (
              <Tabs defaultValue="hotel" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger
                    value="hotel"
                    className="flex items-center gap-2"
                  >
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
                  {hotelFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="p-4 bg-gray-50 rounded-lg border space-y-3"
                    >
                      <div className="flex gap-3 items-start">
                        <div className="flex-1 grid grid-cols-2 gap-3">
                          <div className="grid gap-2 min-w-0">
                            <Label>Tingkat Hotel</Label>
                            <Controller
                              name={`tarifHotel.${index}.tingkat`}
                              control={control}
                              rules={{
                                required: "Tingkat hotel harus dipilih",
                              }}
                              render={({ field }) => (
                                <Select
                                  className="w-full min-w-0"
                                  onValueChange={field.onChange}
                                  value={field.value}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Pilih tingkat" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem
                                      value="Bintang 2"
                                      className="w-full"
                                    >
                                      Bintang 2
                                    </SelectItem>
                                    <SelectItem value="Bintang 3">
                                      Bintang 3
                                    </SelectItem>
                                    <SelectItem value="Bintang 4">
                                      Bintang 4
                                    </SelectItem>
                                    <SelectItem value="Bintang 5">
                                      Bintang 5
                                    </SelectItem>
                                  </SelectContent>
                                </Select>
                              )}
                            />
                          </div>
                          <div className="grid gap-2 min-w-0">
                            <Label>Tarif per PAX</Label>
                            <Input
                              type="number"
                              placeholder="1500000"
                              {...register(`tarifHotel.${index}.tarifPerPax`, {
                                required: "Tarif per PAX harus diisi",
                                min: {
                                  value: 0,
                                  message: "Tarif minimal 0",
                                },
                                valueAsNumber: true,
                              })}
                            />
                          </div>
                        </div>
                        {hotelFields.length > 1 && (
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            className="border-red-200 text-red-600 hover:bg-red-50"
                            onClick={() => removeHotel(index)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div className="grid gap-2">
                        <Label>Daftar Hotel</Label>
                        <Controller
                          name={`tarifHotel.${index}.daftarHotel`}
                          control={control}
                          render={({ field }) => (
                            <HotelListInput
                              hotels={field.value || []}
                              onChange={field.onChange}
                            />
                          )}
                        />
                      </div>
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-teal-200 text-teal-600 hover:bg-teal-50"
                    onClick={() =>
                      appendHotel({
                        tingkat: "Bintang 3",
                        tarifPerPax: 0,
                        daftarHotel: [],
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Tingkat Hotel
                  </Button>
                </TabsContent>

                <TabsContent value="itinerary" className="space-y-3 mt-4">
                  {itineraryFields.map((field, index) => (
                    <div
                      key={field.id}
                      className="flex gap-3 items-start p-3 bg-gray-50 rounded-lg border"
                    >
                      <div className="flex-1 grid gap-2">
                        <Label>Hari ke-{index + 1}</Label>
                        <Textarea
                          placeholder="Aktivitas hari ini..."
                          rows={2}
                          {...register(`itinerary.${index}.aktivitas`, {
                            required: "Aktivitas harus diisi",
                          })}
                        />
                        <input
                          type="hidden"
                          {...register(`itinerary.${index}.hari`)}
                          value={index + 1}
                        />
                      </div>
                      {itineraryFields.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          className="border-red-200 text-red-600 hover:bg-red-50"
                          onClick={() => removeItinerary(index)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="w-full border-teal-200 text-teal-600 hover:bg-teal-50"
                    onClick={() =>
                      appendItinerary({
                        hari: itineraryFields.length + 1,
                        aktivitas: "",
                      })
                    }
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Tambah Hari
                  </Button>
                </TabsContent>
              </Tabs>
            )}
          </div>
          <div className="flex items-center justify-end gap-2 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Batal
            </Button>
            <Button type="submit" className="bg-teal-600 hover:bg-teal-700">
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

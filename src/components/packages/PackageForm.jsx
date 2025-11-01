import { useEffect, useState } from "react";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
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
import {
  validatePriceRangesForTier,
  getPriceRangeConflicts,
} from "@/lib/utils";
import { HotelListInput } from "./HotelListInput";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";

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
    setValue,
    getValues,
    setError,
    clearErrors,
    formState: { errors, isSubmitting },
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
  const [pendingType, setPendingType] = useState(null);
  const [showTypeConfirm, setShowTypeConfirm] = useState(false);

  useEffect(() => {
    const pkg = package_ ?? defaultValues;
    if (pkg) {
      // support both English- and Indonesian-shaped package objects
      const namaPaket = pkg.namaPaket ?? pkg.name ?? "";
      const typeMap = {
        CAR_RENTAL: "Sewa Mobil",
        FULL_DAY_TRIP: "Full Day Trip",
        TOUR_PACKAGE: "Paket Tour",
        // passthrough for already-localized labels
        "Sewa Mobil": "Sewa Mobil",
        "Full Day Trip": "Full Day Trip",
        "Paket Tour": "Paket Tour",
      };

      const rawTipe = pkg.type ?? pkg.tipePaket ?? "Sewa Mobil";
      const mappedTipe = typeMap[rawTipe] ?? rawTipe ?? "-";
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

      // Build reset payload depending on package type so we don't prefill irrelevant data
      const base = {
        namaPaket,
        tipePaket: mappedTipe,
        deskripsi,
        isCustomizable: isCustom,
        customizableItems: customizableItems || [],
        include,
        exclude,
      };

      if (mappedTipe === "Paket Tour") {
        // Tour: include hotel tiers and itinerary
        reset({
          ...base,
          durasiHari: durasiHari || 1,
          durasiMalam: durasiMalam || 0,
          hargaDefault: 0,
          tarifOvertime: 0,
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
      } else if (mappedTipe === "Full Day Trip") {
        // Full day: include price/overtime and itinerary; clear hotel tiers
        reset({
          ...base,
          durasiHari: durasiHari || 1,
          durasiMalam: durasiMalam || 0,
          hargaDefault: hargaDefault || 0,
          tarifOvertime: tarifOvertime || 0,
          tarifHotel: [],
          itinerary:
            Array.isArray(itineraryVal) && itineraryVal.length > 0
              ? itineraryVal
              : [{ hari: 1, aktivitas: "" }],
        });
      } else {
        // Sewa Mobil / default: include price/overtime; clear tour-specific fields
        reset({
          ...base,
          durasiHari: durasiHari || 1,
          durasiMalam: durasiMalam || 0,
          hargaDefault: hargaDefault || 0,
          tarifOvertime: tarifOvertime || 0,
          tarifHotel: [],
          itinerary: [{ hari: 1, aktivitas: "" }],
        });
      }
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
        tarifHotel: [],
        itinerary: [{ hari: 1, aktivitas: "" }],
      });
    }
  }, [package_, defaultValues, reset, open]);

  // When the user changes the package type in the form, clear or set fields
  // that are not relevant for the selected type to avoid accidental edits.
  useEffect(() => {
    if (!open) return;

    if (tipePaket === "Paket Tour") {
      const currentHotel = getValues("tarifHotel");
      if (!Array.isArray(currentHotel) || currentHotel.length === 0) {
        setValue("tarifHotel", [
          { tingkat: "Bintang 3", tarifPerPax: 0, daftarHotel: [] },
        ]);
      }
      const it = getValues("itinerary");
      if (!Array.isArray(it) || it.length === 0) {
        setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      }
      // clear price fields
      setValue("hargaDefault", 0);
      setValue("tarifOvertime", 0);
    } else if (tipePaket === "Full Day Trip") {
      // ensure price fields present, clear hotel tiers
      setValue("hargaDefault", getValues("hargaDefault") ?? 0);
      setValue("tarifOvertime", getValues("tarifOvertime") ?? 0);
      setValue("tarifHotel", []);
      if (
        !Array.isArray(getValues("itinerary")) ||
        getValues("itinerary").length === 0
      ) {
        setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      }
    } else {
      // Sewa Mobil or other: clear tour-specific data
      setValue("tarifHotel", []);
      setValue("itinerary", [{ hari: 1, aktivitas: "" }]);
      setValue("hargaDefault", getValues("hargaDefault") ?? 0);
      setValue("tarifOvertime", getValues("tarifOvertime") ?? 0);
    }
  }, [tipePaket, open, setValue, getValues]);

  // Live validation: watch tarifHotel priceRanges and validate on change
  const watchedTarifHotel = watch("tarifHotel");
  useEffect(() => {
    if (!watchedTarifHotel || !Array.isArray(watchedTarifHotel)) return;
    watchedTarifHotel.forEach((tier, i) => {
      // clear any previous nested errors for this tier
      clearErrors(`tarifHotel.${i}.priceRanges`);

      if (
        tier?.priceRanges &&
        Array.isArray(tier.priceRanges) &&
        tier.priceRanges.length > 0
      ) {
        const detail = getPriceRangeConflicts(tier.priceRanges);

        // field-level validation errors (min/max invalid)
        if (Array.isArray(detail.errors) && detail.errors.length > 0) {
          detail.errors.forEach((err) => {
            // set error on minPax field of that range (will show next to inputs)
            setError(`tarifHotel.${i}.priceRanges.${err.index}.minPax`, {
              type: "manual",
              message: err.message,
            });
            setError(`tarifHotel.${i}.priceRanges.${err.index}.maxPax`, {
              type: "manual",
              message: err.message,
            });
          });
        }

        // overlaps: mark both ranges involved
        if (Array.isArray(detail.overlaps) && detail.overlaps.length > 0) {
          detail.overlaps.forEach((ov) => {
            const aMsg = `Overlap dengan rentang ${ov.b.min}-${ov.b.max}`;
            const bMsg = `Overlap dengan rentang ${ov.a.min}-${ov.a.max}`;
            setError(`tarifHotel.${i}.priceRanges.${ov.aIndex}.minPax`, {
              type: "manual",
              message: aMsg,
            });
            setError(`tarifHotel.${i}.priceRanges.${ov.aIndex}.maxPax`, {
              type: "manual",
              message: aMsg,
            });
            setError(`tarifHotel.${i}.priceRanges.${ov.bIndex}.minPax`, {
              type: "manual",
              message: bMsg,
            });
            setError(`tarifHotel.${i}.priceRanges.${ov.bIndex}.maxPax`, {
              type: "manual",
              message: bMsg,
            });
          });
        }
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedTarifHotel]);

  const onSubmit = async (data) => {
    // client-side validation for priceRanges when Paket Tour
    if (data.tipePaket === "Paket Tour" && Array.isArray(data.tarifHotel)) {
      for (let i = 0; i < data.tarifHotel.length; i++) {
        const tier = data.tarifHotel[i];
        if (tier.priceRanges) {
          const v = validatePriceRangesForTier(tier.priceRanges);
          if (!v.ok) {
            // set form error on the nested field and abort submit
            setError(`tarifHotel.${i}.priceRanges`, {
              type: "manual",
              message: v.message,
            });
            return;
          } else {
            clearErrors(`tarifHotel.${i}.priceRanges`);
          }
        }
      }
    }
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
      await onSave(packageData);
      return;
    }
    if (typeof onSubmitProp === "function") {
      await onSubmitProp(packageData);
      return;
    }
    console.warn("PackageForm: no save handler provided");
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
        <Form onSubmit={handleSubmit(onSubmit)}>
          <div className="grid gap-4 py-4">
            <FormField>
              <FormItem>
                <FormLabel htmlFor="namaPaket">
                  Nama Paket <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Input
                    id="namaPaket"
                    placeholder="Contoh: Paket Tour Lombok 4D3N"
                    {...register("namaPaket", {
                      required: "Nama paket harus diisi",
                    })}
                  />
                </FormControl>
                {errors.namaPaket && (
                  <FormMessage className="text-red-500">
                    {errors.namaPaket.message}
                  </FormMessage>
                )}
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel htmlFor="tipePaket">
                  Tipe Paket <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Controller
                    name="tipePaket"
                    control={control}
                    rules={{ required: "Tipe paket harus dipilih" }}
                    render={({ field }) => {
                      const willCauseDataLoss = (oldType, newType) => {
                        if (!oldType || oldType === newType) return false;
                        const tarifHotel = getValues("tarifHotel") || [];
                        const itinerary = getValues("itinerary") || [];
                        const price = Number(getValues("hargaDefault") || 0);
                        const overtime = Number(
                          getValues("tarifOvertime") || 0
                        );

                        // Tour -> switching away will remove hotel tiers + itineraries
                        if (
                          oldType === "Paket Tour" &&
                          newType !== "Paket Tour" &&
                          ((Array.isArray(tarifHotel) &&
                            tarifHotel.length > 0) ||
                            (Array.isArray(itinerary) && itinerary.length > 0))
                        )
                          return true;

                        // Sewa Mobil -> switching away may remove price/overtime
                        if (
                          oldType === "Sewa Mobil" &&
                          newType !== "Sewa Mobil" &&
                          (price > 0 || overtime > 0)
                        )
                          return true;

                        // Full Day Trip -> switching away may remove itinerary or price
                        if (
                          oldType === "Full Day Trip" &&
                          newType !== "Full Day Trip" &&
                          ((Array.isArray(itinerary) && itinerary.length > 0) ||
                            price > 0 ||
                            overtime > 0)
                        )
                          return true;

                        return false;
                      };

                      const handleTypeChange = (val) => {
                        const old = field.value || getValues("tipePaket");
                        if (willCauseDataLoss(old, val)) {
                          setPendingType(val);
                          setShowTypeConfirm(true);
                        } else {
                          field.onChange(val);
                        }
                      };

                      const confirmChange = () => {
                        if (pendingType) {
                          // apply the pending type
                          setValue("tipePaket", pendingType);
                        }
                        setPendingType(null);
                        setShowTypeConfirm(false);
                      };

                      const cancelChange = () => {
                        setPendingType(null);
                        setShowTypeConfirm(false);
                      };

                      // compute details for the confirmation dialog
                      const tarifHotelVals = getValues("tarifHotel") || [];
                      const hotelTierCount = Array.isArray(tarifHotelVals)
                        ? tarifHotelVals.length
                        : 0;
                      const hotelCount = Array.isArray(tarifHotelVals)
                        ? tarifHotelVals.reduce(
                            (acc, t) =>
                              acc +
                              (Array.isArray(t.daftarHotel)
                                ? t.daftarHotel.length
                                : Array.isArray(t.hotels)
                                ? t.hotels.length
                                : 0),
                            0
                          )
                        : 0;
                      const itineraryVals = getValues("itinerary") || [];
                      const itineraryCount = Array.isArray(itineraryVals)
                        ? itineraryVals.length
                        : 0;
                      const priceVal = Number(getValues("hargaDefault") || 0);
                      const overtimeVal = Number(
                        getValues("tarifOvertime") || 0
                      );
                      const fmt = (v) => {
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

                      return (
                        <>
                          <Select
                            onValueChange={handleTypeChange}
                            value={field.value}
                          >
                            <SelectTrigger id="tipePaket">
                              <SelectValue placeholder="Pilih tipe paket" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Sewa Mobil">
                                Sewa Mobil
                              </SelectItem>
                              <SelectItem value="Full Day Trip">
                                Full Day Trip (1 Hari)
                              </SelectItem>
                              <SelectItem value="Paket Tour">
                                Paket Tour (Multi Hari)
                              </SelectItem>
                            </SelectContent>
                          </Select>

                          <Dialog
                            open={showTypeConfirm}
                            onOpenChange={setShowTypeConfirm}
                          >
                            <DialogContent className="sm:max-w-[420px]">
                              <div className="space-y-4">
                                <h3 className="text-lg font-semibold">
                                  Konfirmasi Perubahan Tipe
                                </h3>
                                <p>
                                  Anda akan mengubah tipe paket dari{" "}
                                  <strong>{field.value}</strong> ke{" "}
                                  <strong>{pendingType}</strong>.
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  Perubahan berikut akan terjadi jika Anda
                                  melanjutkan:
                                </p>
                                <ul className="list-disc pl-5 text-sm space-y-1">
                                  {field.value === "Paket Tour" &&
                                    pendingType !== "Paket Tour" && (
                                      <>
                                        <li>
                                          Menghapus {hotelTierCount} tingkat
                                          hotel (total {hotelCount} hotel)
                                        </li>
                                        <li>
                                          Menghapus {itineraryCount} hari
                                          itinerary
                                        </li>
                                      </>
                                    )}

                                  {field.value === "Sewa Mobil" &&
                                    pendingType !== "Sewa Mobil" &&
                                    (priceVal > 0 || overtimeVal > 0) && (
                                      <>
                                        {priceVal > 0 && (
                                          <li>
                                            Menghapus Harga Default:{" "}
                                            {fmt(priceVal)}
                                          </li>
                                        )}
                                        {overtimeVal > 0 && (
                                          <li>
                                            Menghapus Tarif Overtime:{" "}
                                            {fmt(overtimeVal)}/jam
                                          </li>
                                        )}
                                      </>
                                    )}

                                  {field.value === "Full Day Trip" &&
                                    pendingType !== "Full Day Trip" && (
                                      <>
                                        {itineraryCount > 0 && (
                                          <li>
                                            Menghapus {itineraryCount} hari
                                            itinerary
                                          </li>
                                        )}
                                        {priceVal > 0 && (
                                          <li>
                                            Menghapus Harga Default:{" "}
                                            {fmt(priceVal)}
                                          </li>
                                        )}
                                        {overtimeVal > 0 && (
                                          <li>
                                            Menghapus Tarif Overtime:{" "}
                                            {fmt(overtimeVal)}/jam
                                          </li>
                                        )}
                                      </>
                                    )}

                                  <li className="text-gray-600">
                                    Data lain yang relevan dengan tipe saat ini
                                    akan dihapus atau dikosongkan.
                                  </li>
                                </ul>

                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    onClick={cancelChange}
                                  >
                                    Batal
                                  </Button>
                                  <Button
                                    onClick={confirmChange}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    Lanjutkan
                                  </Button>
                                </div>
                              </div>
                            </DialogContent>
                          </Dialog>
                        </>
                      );
                    }}
                  />
                </FormControl>
                {errors.tipePaket && (
                  <FormMessage className="text-red-500">
                    {errors.tipePaket.message}
                  </FormMessage>
                )}
              </FormItem>
            </FormField>

            <FormField>
              <FormItem>
                <FormLabel htmlFor="deskripsi">
                  Deskripsi Paket <span className="text-red-500">*</span>
                </FormLabel>
                <FormControl>
                  <Textarea
                    id="deskripsi"
                    placeholder="Deskripsi singkat tentang paket ini"
                    rows={2}
                    {...register("deskripsi", {
                      required: "Deskripsi harus diisi",
                    })}
                  />
                </FormControl>
                {errors.deskripsi && (
                  <FormMessage className="text-red-500">
                    {errors.deskripsi.message}
                  </FormMessage>
                )}
              </FormItem>
            </FormField>

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
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="durasiHari">
                    Durasi (Hari) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
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
                  </FormControl>
                  {errors.durasiHari && (
                    <FormMessage className="text-red-500">
                      {errors.durasiHari.message}
                    </FormMessage>
                  )}
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel htmlFor="durasiMalam">
                    Durasi (Malam) <span className="text-red-500">*</span>
                  </FormLabel>
                  <FormControl>
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
                  </FormControl>
                  {errors.durasiMalam && (
                    <FormMessage className="text-red-500">
                      {errors.durasiMalam.message}
                    </FormMessage>
                  )}
                </FormItem>
              </FormField>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <FormField>
                <FormItem>
                  <FormLabel htmlFor="include">Include</FormLabel>
                  <FormControl>
                    <Textarea
                      id="include"
                      placeholder="Mobil + Sopir, BBM, Hotel, Sarapan"
                      rows={2}
                      {...register("include")}
                    />
                  </FormControl>
                </FormItem>
              </FormField>

              <FormField>
                <FormItem>
                  <FormLabel htmlFor="exclude">Exclude</FormLabel>
                  <FormControl>
                    <Textarea
                      id="exclude"
                      placeholder="Tiket pesawat, Makan, Tiket wisata"
                      rows={2}
                      {...register("exclude")}
                    />
                  </FormControl>
                </FormItem>
              </FormField>
            </div>

            {tipePaket === "Sewa Mobil" || tipePaket === "Full Day Trip" ? (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <FormField>
                    <FormItem>
                      <FormLabel htmlFor="hargaDefault">
                        Harga Default (per PAX){" "}
                        <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
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
                      </FormControl>
                      {errors.hargaDefault && (
                        <FormMessage className="text-red-500">
                          {errors.hargaDefault.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  </FormField>

                  <FormField>
                    <FormItem>
                      <FormLabel htmlFor="tarifOvertime">
                        Tarif Overtime (per Jam)
                      </FormLabel>
                      <FormControl>
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
                      </FormControl>
                      {errors.tarifOvertime && (
                        <FormMessage className="text-red-500">
                          {errors.tarifOvertime.message}
                        </FormMessage>
                      )}
                    </FormItem>
                  </FormField>
                </div>

                {tipePaket === "Full Day Trip" && (
                  <div className="space-y-3">
                    <Label>Itinerary</Label>
                    {itineraryFields.map((field, index) => (
                      <div
                        key={field.id}
                        className="p-3 bg-gray-50 rounded-lg border space-y-2"
                      >
                        <FormField>
                          <FormItem>
                            <FormLabel>Aktivitas</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Deskripsi aktivitas sepanjang hari..."
                                rows={4}
                                {...register(`itinerary.${index}.aktivitas`, {
                                  required: "Aktivitas harus diisi",
                                })}
                              />
                            </FormControl>
                            {errors?.itinerary?.[index]?.aktivitas && (
                              <FormMessage className="text-red-500">
                                {errors.itinerary[index].aktivitas.message}
                              </FormMessage>
                            )}
                            <input
                              type="hidden"
                              {...register(`itinerary.${index}.hari`)}
                              value={1}
                            />
                          </FormItem>
                        </FormField>
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
                          <FormField>
                            <FormItem>
                              <FormLabel>Tingkat Hotel</FormLabel>
                              <FormControl>
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
                              </FormControl>
                            </FormItem>
                          </FormField>

                          <FormField>
                            <FormItem>
                              <FormLabel>Tarif per PAX</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  placeholder="1500000"
                                  {...register(
                                    `tarifHotel.${index}.tarifPerPax`,
                                    {
                                      required: "Tarif per PAX harus diisi",
                                      min: {
                                        value: 0,
                                        message: "Tarif minimal 0",
                                      },
                                      valueAsNumber: true,
                                    }
                                  )}
                                />
                              </FormControl>
                            </FormItem>
                          </FormField>
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
                      <FormField>
                        <FormItem>
                          <FormLabel>Daftar Hotel</FormLabel>
                          <FormControl>
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
                          </FormControl>
                        </FormItem>
                      </FormField>

                      <FormField>
                        <FormItem>
                          <FormLabel>Price Ranges (per Pax)</FormLabel>
                          <FormControl>
                            <div className="space-y-2">
                              {(
                                getValues(`tarifHotel.${index}.priceRanges`) ||
                                []
                              ).map((r, ri) => {
                                const fieldError =
                                  errors?.tarifHotel?.[index]?.priceRanges?.[ri]
                                    ?.minPax?.message ||
                                  errors?.tarifHotel?.[index]?.priceRanges?.[ri]
                                    ?.maxPax?.message ||
                                  errors?.tarifHotel?.[index]?.priceRanges?.[ri]
                                    ?.price?.message;
                                return (
                                  <div
                                    key={ri}
                                    className="flex gap-2 items-center"
                                  >
                                    <Input
                                      type="number"
                                      className={`w-24 ${
                                        fieldError ? "border-red-500" : ""
                                      }`}
                                      {...register(
                                        `tarifHotel.${index}.priceRanges.${ri}.minPax`,
                                        { valueAsNumber: true }
                                      )}
                                      placeholder="min"
                                    />
                                    <span className="text-sm">-</span>
                                    <Input
                                      type="number"
                                      className={`w-24 ${
                                        fieldError ? "border-red-500" : ""
                                      }`}
                                      {...register(
                                        `tarifHotel.${index}.priceRanges.${ri}.maxPax`,
                                        { valueAsNumber: true }
                                      )}
                                      placeholder="max"
                                    />
                                    <Input
                                      type="number"
                                      className={`w-36 ${
                                        fieldError ? "border-red-500" : ""
                                      }`}
                                      {...register(
                                        `tarifHotel.${index}.priceRanges.${ri}.price`,
                                        { valueAsNumber: true }
                                      )}
                                      placeholder="price"
                                    />
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="icon"
                                      onClick={() => {
                                        const arr =
                                          getValues(
                                            `tarifHotel.${index}.priceRanges`
                                          ) || [];
                                        const next = arr.filter(
                                          (_, i) => i !== ri
                                        );
                                        setValue(
                                          `tarifHotel.${index}.priceRanges`,
                                          next
                                        );
                                      }}
                                    >
                                      <Trash2 className="h-4 w-4" />
                                    </Button>
                                    {fieldError && (
                                      <p className="text-red-600 text-sm ml-2">
                                        {fieldError}
                                      </p>
                                    )}
                                  </div>
                                );
                              })}

                              <div>
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => {
                                    const arr =
                                      getValues(
                                        `tarifHotel.${index}.priceRanges`
                                      ) || [];
                                    setValue(
                                      `tarifHotel.${index}.priceRanges`,
                                      [
                                        ...arr,
                                        { minPax: 1, maxPax: 1, price: 0 },
                                      ]
                                    );
                                  }}
                                >
                                  <Plus className="mr-2 h-4 w-4" />
                                  Tambah Rentang
                                </Button>
                              </div>
                              {errors?.tarifHotel?.[index]?.priceRanges && (
                                <p className="text-red-600 text-sm mt-1">
                                  {errors.tarifHotel[index].priceRanges.message}
                                </p>
                              )}
                            </div>
                          </FormControl>
                        </FormItem>
                      </FormField>
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
                        priceRanges: [],
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
                        <FormField>
                          <FormItem>
                            <FormLabel>Hari ke-{index + 1}</FormLabel>
                            <FormControl>
                              <Textarea
                                placeholder="Aktivitas hari ini..."
                                rows={2}
                                {...register(`itinerary.${index}.aktivitas`, {
                                  required: "Aktivitas harus diisi",
                                })}
                              />
                            </FormControl>
                            {errors?.itinerary?.[index]?.aktivitas && (
                              <FormMessage className="text-red-500">
                                {errors.itinerary[index].aktivitas.message}
                              </FormMessage>
                            )}
                            <input
                              type="hidden"
                              {...register(`itinerary.${index}.hari`)}
                              value={index + 1}
                            />
                          </FormItem>
                        </FormField>
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
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isSubmitting}
            >
              Simpan
            </Button>
          </div>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

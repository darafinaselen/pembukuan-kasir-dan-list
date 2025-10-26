import React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectGroup,
  SelectLabel,
} from "@/components/ui/select";

export default function ArmadaDialog({
  open,
  onOpenChange,
  editingArmada,
  formData,
  handleInputChange,
  isCustomModel,
  setIsCustomModel,
  handleSubmit,
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm md:max-w-md w-full rounded-lg bg-white p-6 shadow-xl">
        <DialogHeader className="mb-4">
          <DialogTitle>
            {editingArmada ? "Edit Armada" : "Formulir Armada Baru"}
          </DialogTitle>
          <DialogDescription>Isi detail armada di bawah ini.</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="pb-1" htmlFor="license_plate">
              Nomor Plat
            </Label>
            <Input
              id="license_plate"
              placeholder="DR XXXX"
              value={formData.license_plate}
              onChange={handleInputChange}
              required
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="brand">
              Merk
            </Label>
            <Input
              id="brand"
              placeholder="Contoh: Toyota"
              value={formData.brand}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="model">
              Tipe
            </Label>
            <Select
              value={isCustomModel ? "__other__" : formData.model}
              onValueChange={(val) => {
                if (val === "__other__") {
                  setIsCustomModel(true);
                  /* clear model */ handleInputChange({
                    target: { id: "model", value: "" },
                  });
                } else {
                  setIsCustomModel(false);
                  handleInputChange({ target: { id: "model", value: val } });
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Pilih tipe armada atau pilih 'Lainnya' untuk memasukkan manual" />
              </SelectTrigger>
              <SelectContent>
                <SelectGroup>
                  <SelectLabel>Tipe Armada</SelectLabel>
                  <SelectItem value="Innova Reborn">Innova Reborn</SelectItem>
                  <SelectItem value="Hi-Ace">Hi-Ace</SelectItem>
                  <SelectItem value="__other__">Lainnya...</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>

            {isCustomModel && (
              <div className="mt-2">
                <Input
                  id="model"
                  placeholder="Masukkan tipe armada"
                  value={formData.model}
                  onChange={handleInputChange}
                />
              </div>
            )}
          </div>

          <div>
            <Label className="pb-1" htmlFor="model">
              Tipe / Keterangan
            </Label>
            <Input
              id="model"
              placeholder="Contoh: 2.0 G MT"
              value={formData.model}
              onChange={handleInputChange}
            />
          </div>

          <div>
            <Label className="pb-1" htmlFor="notes">
              Catatan
            </Label>
            <textarea
              id="description"
              placeholder="Catatan singkat (opsional)"
              value={formData.description ?? ""}
              onChange={(e) =>
                handleInputChange({
                  target: { id: "description", value: e.target.value },
                })
              }
              className="w-full min-h-[80px] border rounded px-3 py-2"
            />
          </div>

          <div>
            <Button
              type="submit"
              className="w-full bg-emerald-700 hover:bg-emerald-600 text-white"
            >
              Simpan
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

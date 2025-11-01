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
                <SelectValue placeholder="Pilih tipe (atau 'Lainnya...')" />
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

            <div className="mt-2">
              <Label className="pb-1" htmlFor="status">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(val) =>
                  handleInputChange({ target: { id: "status", value: val } })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih status armada" />
                </SelectTrigger>
                <SelectContent>
                  <SelectGroup>
                    <SelectLabel>Status Armada</SelectLabel>
                    <SelectItem value="READY">READY</SelectItem>
                    <SelectItem value="BOOKED">BOOKED</SelectItem>
                    <SelectItem value="ON_TRIP">ON_TRIP</SelectItem>
                    <SelectItem value="MAINTENANCE">MAINTENANCE</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
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

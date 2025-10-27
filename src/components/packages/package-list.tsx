"use client";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui";
import { Eye, Pencil, Trash2 } from "lucide-react";

export function PackageList({ packages, onEdit, onDelete, onView }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Nama Paket</TableHead>
          <TableHead>Tipe Paket</TableHead>
          <TableHead>Harga Default</TableHead>
          <TableHead>Durasi Default</TableHead>
          <TableHead className="text-right">Aksi</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {packages.map((pkg) => (
          <TableRow key={pkg.id}>
            <TableCell>{pkg.name}</TableCell>
            <TableCell>{pkg.type === "CAR_RENTAL" ? "Sewa Mobil" : "Paket Tour"}</TableCell>
            <TableCell>{pkg.price || "-"}</TableCell>
            <TableCell>{pkg.durationHours ? `${pkg.durationHours} Jam` : (pkg.durationDays ? `${pkg.durationDays} Hari` : "-")}</TableCell>
            <TableCell className="text-right">
              <Button variant="ghost" size="icon" onClick={() => onView(pkg)}>
                <Eye className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onEdit(pkg)}>
                <Pencil className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => onDelete(pkg)}>
                <Trash2 className="h-4 w-4" />
              </Button>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

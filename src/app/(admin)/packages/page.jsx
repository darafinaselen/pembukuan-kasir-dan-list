"use client";

import { useState, useEffect } from "react";
import {
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui";
import { PlusCircle } from "lucide-react";
import { PackageForm } from "@/components/packages/package-form";
import { PackageList } from "@/components/packages/package-list";
import { PackageDetail } from "@/components/packages/package-detail";
import { DeleteConfirmation } from "@/components/packages/delete-confirmation";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const fetchPackages = async () => {
    const res = await fetch("/api/packages");
    const data = await res.json();
    setPackages(data);
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleFormSubmit = async (data) => {
    const method = selectedPackage && selectedPackage.id ? "PUT" : "POST";
    const url = selectedPackage && selectedPackage.id
      ? `/api/packages/${selectedPackage.id}`
      : "/api/packages";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (res.ok) {
      setIsFormOpen(false);
      setSelectedPackage(null);
      fetchPackages();
    } else {
      console.error("Failed to save package");
    }
  };

  const handleDelete = async () => {
    if (!selectedPackage) return;
    const res = await fetch(`/api/packages/${selectedPackage.id}`, {
      method: "DELETE",
    });

    if (res.ok) {
      setIsDeleteConfirmOpen(false);
      setSelectedPackage(null);
      fetchPackages();
    } else {
      console.error("Failed to delete package");
    }
  };

  const openCreateForm = () => {
    setSelectedPackage(null);
    setIsFormOpen(true);
  };

  const openEditForm = (pkg) => {
    setSelectedPackage(pkg);
    setIsFormOpen(true);
  };

  const openDetailView = (pkg) => {
    setSelectedPackage(pkg);
    setIsDetailOpen(true);
  };

  const openDeleteConfirm = (pkg) => {
    setSelectedPackage(pkg);
    setIsDeleteConfirmOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Manajemen Paket Jasa</h2>
          <p className="text-muted-foreground">
            Buat dan kelola data master untuk paket sewa atau tour.
          </p>
        </div>
        <div className="flex items-center space-x-2">
          <Button onClick={openCreateForm}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Tambah Paket
          </Button>
        </div>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Daftar Paket</CardTitle>
          <CardDescription>
            Berikut adalah daftar semua paket yang sudah dibuat.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <PackageList
            packages={packages}
            onEdit={openEditForm}
            onDelete={openDeleteConfirm}
            onView={openDetailView}
          />
        </CardContent>
      </Card>
      <PackageForm
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        onSubmit={handleFormSubmit}
        defaultValues={selectedPackage}
      />
      <PackageDetail
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        pkg={selectedPackage}
      />
      <DeleteConfirmation
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        onConfirm={handleDelete}
      />
    </div>
  );
}

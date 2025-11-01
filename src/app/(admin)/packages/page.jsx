"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import PackageHeader from "@/components/packages/PackageHeader";
import { PackageForm } from "@/components/packages/PackageForm";
import { PackageList } from "@/components/packages/PackageList";
import { PackageDetail } from "@/components/packages/PackageDetail";
import { DeleteConfirmation } from "@/components/packages/DeleteConfirmation";

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  const fetchPackages = async () => {
    try {
      const res = await fetch("/api/packages");
      console.log("Fetch /api/packages response:", res);
      if (!res.ok) {
        const text = await res.text().catch(() => "<no body>");
        console.error("Failed to fetch packages:", res.status, text);
        setPackages([]);
        return;
      }

      const data = await res.json().catch((err) => {
        console.error("Failed to parse /api/packages response as JSON", err);
        return null;
      });

      if (!Array.isArray(data)) {
        console.warn(
          "/api/packages returned unexpected payload, expected array.",
          data
        );
        setPackages([]);
        return;
      }

      setPackages(data);
    } catch (err) {
      console.error("Error fetching packages:", err);
      setPackages([]);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleFormSubmit = async (data) => {
    const method = selectedPackage && selectedPackage.id ? "PUT" : "POST";
    const url =
      selectedPackage && selectedPackage.id
        ? `/api/packages/${selectedPackage.id}`
        : "/api/packages";

    console.log("=== Submitting package form ===");
    console.log("Method:", method);
    console.log("URL:", url);
    console.log("Data:", JSON.stringify(data, null, 2));

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });

      console.log(`Submit package form response (${method} ${url}):`, res);

      if (res.ok) {
        console.log("Package saved successfully");
        setIsFormOpen(false);
        setSelectedPackage(null);
        await fetchPackages(); // Wait for fetch to complete
        if (typeof window !== "undefined") {
          window.alert("Paket berhasil disimpan!");
        }
      } else {
        let detail = "";
        let errorData = null;
        try {
          const text = await res.text();
          detail = text;
          try {
            errorData = JSON.parse(text);
            detail = errorData.error || errorData.details || text;
          } catch {}
        } catch {}
        console.error("Failed to save package", res.status, detail);
        // Surface the error so users understand why it didn't save
        if (typeof window !== "undefined") {
          window.alert(
            `Gagal menyimpan paket (status ${res.status}).\n${
              detail || "Coba lagi atau periksa log server."
            }`
          );
        }
      }
    } catch (err) {
      console.error("Failed to save package", err);
      if (typeof window !== "undefined") {
        window.alert(`Gagal menyimpan paket: ${err?.message || err}`);
      }
    }
  };

  const handleDelete = async () => {
    if (!selectedPackage) return;
    try {
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
    } catch (err) {
      console.error("Failed to delete package", err);
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
    <div>
      <PackageHeader onAdd={openCreateForm} />

      <div className="p-4">
        {packages === null ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <div
                key={i}
                className="animate-pulse rounded-lg border bg-white p-4"
              >
                <div className="h-36 bg-slate-100 rounded mb-3" />
                <div className="h-4 bg-slate-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-slate-100 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : packages.length === 0 ? (
          <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
            <p className="text-lg font-medium mb-2">Belum ada paket jasa</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan paket jasa pertama Anda untuk mulai mencatat layanan.
            </p>
            <Button onClick={openCreateForm}>Tambah Paket</Button>
          </div>
        ) : (
          <PackageList
            packages={packages}
            onEdit={openEditForm}
            onDelete={openDeleteConfirm}
            onView={openDetailView}
          />
        )}
      </div>

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

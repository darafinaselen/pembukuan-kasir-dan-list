"use client";

import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import ArmadaHeader from "@/components/armada/ArmadaHeader";
import ArmadaFilters from "@/components/armada/ArmadaFilters";
import ArmadaCard from "@/components/armada/ArmadaCard";
import ArmadaDialog from "@/components/armada/ArmadaDialog";

export default function ArmadaPage() {
  const [armadas, setArmadas] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("ALL");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArmada, setEditingArmada] = useState(null);
  const [formData, setFormData] = useState({
    license_plate: "",
    brand: "",
    model: "",
    status: "READY",
    description: "",
  });
  const [isCustomModel, setIsCustomModel] = useState(false);

  async function fetchArmadas() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/armada");
      if (!res.ok) throw new Error("fetch failed");
      const data = await res.json();
      setArmadas(data);
    } catch (err) {
      console.error("Failed to load armadas", err);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchArmadas();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((p) => ({ ...p, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const filteredArmadas = armadas.filter((a) => {
    const q = searchTerm.trim().toLowerCase();
    const matchesQ =
      !q ||
      (a.license_plate && a.license_plate.toLowerCase().includes(q)) ||
      (a.brand && a.brand.toLowerCase().includes(q)) ||
      (a.model && a.model.toLowerCase().includes(q));
    const matchesStatus =
      filterStatus === "ALL" || (a.status || "READY") === filterStatus;
    return matchesQ && matchesStatus;
  });

  const statusCounts = armadas.reduce(
    (acc, a) => {
      const s = a.status || "READY";
      acc[s] = (acc[s] || 0) + 1;
      acc.ALL = (acc.ALL || 0) + 1;
      return acc;
    },
    { ALL: 0 }
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingArmada ? "PUT" : "POST";
      const url = editingArmada
        ? `/api/armada/${editingArmada.id}`
        : "/api/armada";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      if (!res.ok) throw new Error("save failed");
      setIsDialogOpen(false);
      setEditingArmada(null);
      await fetchArmadas();
    } catch (err) {
      console.error("Failed to save armada", err);
    }
  };

  const handleEdit = (armada) => {
    const known = ["Innova Reborn", "Hi-Ace", "Xenia"];
    setEditingArmada(armada);
    // model holds the 'Tipe' (Innova, Hi-Ace). If it's not in known list, treat as custom
    setIsCustomModel(Boolean(armada.model && !known.includes(armada.model)));
    setFormData({
      license_plate: armada.license_plate || "",
      brand: armada.brand || "",
      model: armada.model || "",
      status: armada.status || "READY",
      description: armada.description || "",
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Hapus armada ini?")) return;
    try {
      const res = await fetch(`/api/armada/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await fetchArmadas();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const openNewArmadaDialog = () => {
    setEditingArmada(null);
    setFormData({
      license_plate: "",
      brand: "",
      model: "",
      status: "READY",
      description: "",
    });
    setIsCustomModel(false);
    setIsDialogOpen(true);
  };

  return (
    <div>
      <ArmadaHeader onAdd={openNewArmadaDialog} />

      <ArmadaFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        filterStatus={filterStatus}
        setFilterStatus={setFilterStatus}
        statusCounts={statusCounts}
      />

      <div className="p-4">
        {isLoading ? (
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
        ) : filteredArmadas.length === 0 ? (
          <div className="rounded-lg border-dashed border-2 border-slate-200 p-6 text-center">
            <p className="text-lg font-medium mb-2">Belum ada armada</p>
            <p className="text-sm text-muted-foreground mb-4">
              Tambahkan armada pertama Anda untuk mulai mencatat kendaraan.
            </p>
            <Button onClick={openNewArmadaDialog}>Tambah Armada</Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredArmadas.map((a) => (
              <ArmadaCard
                key={a.id}
                armada={a}
                onEdit={handleEdit}
                onDelete={handleDelete}
              />
            ))}
          </div>
        )}
      </div>

      <ArmadaDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        editingArmada={editingArmada}
        formData={formData}
        handleInputChange={handleInputChange}
        isCustomModel={isCustomModel}
        setIsCustomModel={setIsCustomModel}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

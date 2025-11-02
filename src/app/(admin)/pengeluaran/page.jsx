"use client";

import React, { useState, useEffect, useMemo } from "react";
import PengeluaranHeader from "@/components/pengeluaran/PengeluaranHeader";
import PengeluaranFilters from "@/components/pengeluaran/PengeluaranFilters";
import PengeluaranTable from "@/components/pengeluaran/PengeluaranTable";
import PengeluaranDialog from "@/components/pengeluaran/PengeluaranDialog";
import { startOfMonth, startOfYear, endOfToday } from "date-fns";

// Helper untuk format tanggal YYYY-MM-DD
function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

const INITIAL_FORM_STATE = {
  date: getTodayDateString(),
  category: "",
  description: "",
  amount: "",
  armadaId: null,
};

export default function PengeluaranPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });

  // State untuk Dialog/Form
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [formData, setFormData] = useState(INITIAL_FORM_STATE);

  // --- Data Fetching ---
  async function fetchData() {
    try {
      setIsLoading(true);
      const res = await fetch("/api/expenses", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("fetch failed");
      const result = await res.json();

      // API returns { success, data, message }
      const fetchedData = result.data || result;
      const dataArray = Array.isArray(fetchedData) ? fetchedData : [];

      console.log("📦 Fetched expenses data:", {
        count: dataArray.length,
        sample: dataArray[0],
        dates: dataArray.slice(0, 3).map((item) => ({
          id: item.id,
          date: item.date,
          description: item.description?.substring(0, 20),
        })),
      });

      setData(dataArray);
    } catch (err) {
      console.error("Failed to load data", err);
      setData([]); // Fallback to empty array
      // TODO: Tampilkan notifikasi error (toast)
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    console.log("🔍 Filtering with:", {
      searchTerm: q,
      dateRange,
      totalData: data.length,
    });

    const filtered = data.filter((item) => {
      // Convert item date to start of day for comparison
      const itemDate = new Date(item.date);
      itemDate.setHours(0, 0, 0, 0);

      const matchesSearch =
        !q ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().replace("_", " ").includes(q);

      // Create comparison dates
      let matchesDate = true;

      if (dateRange.from) {
        const fromDate = new Date(dateRange.from);
        fromDate.setHours(0, 0, 0, 0);
        matchesDate = matchesDate && itemDate >= fromDate;
      }

      if (dateRange.to) {
        const toDate = new Date(dateRange.to);
        toDate.setHours(23, 59, 59, 999);
        matchesDate = matchesDate && itemDate <= toDate;
      }

      if (dateRange.from || dateRange.to) {
        console.log("📅 Date check:", {
          item: item.description?.substring(0, 30),
          itemDate: itemDate.toISOString().split("T")[0],
          fromDate: dateRange.from
            ? new Date(dateRange.from).toISOString().split("T")[0]
            : "none",
          toDate: dateRange.to
            ? new Date(dateRange.to).toISOString().split("T")[0]
            : "none",
          matchesDate,
        });
      }

      return matchesSearch && matchesDate;
    });

    console.log(
      "✅ Filtered result:",
      filtered.length,
      "items out of",
      data.length
    );
    return filtered;
  }, [data, searchTerm, dateRange]);

  // --- Event Handlers ---
  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleDateChange = (name, value) => {
    setDateRange((prev) => ({ ...prev, [name]: value }));
    setQuickFilter("all");
  };

  const handleQuickFilterChange = (value) => {
    setQuickFilter(value);
    const today = new Date();

    if (value === "month") {
      const from = startOfMonth(today);
      const to = endOfToday();
      console.log("🗓️ Filter Bulan Ini:", { from, to });
      setDateRange({ from, to });
    } else if (value === "year") {
      const from = startOfYear(today);
      const to = endOfToday();
      console.log("🗓️ Filter Tahun Ini:", { from, to });
      setDateRange({ from, to });
    } else {
      console.log("🗓️ Filter All - Reset date range");
      setDateRange({ from: undefined, to: undefined });
    }
  };

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const openNewDialog = () => {
    setEditingData(null);
    setFormData(INITIAL_FORM_STATE);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    console.log("Mencoba meng-edit item:", item);
    setEditingData(item);
    setFormData({
      ...item,
      date: new Date(item.date).toISOString().split("T")[0],
      amount: item.amount.toString(),
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus data ini?")) return;
    try {
      console.log("Menghapus data ID:", id);
      const res = await fetch(`/api/expenses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("delete failed");

      // Optimistic UI: Hapus dari state
      setData((prev) => prev.filter((item) => item.id !== id));
      // TODO: Tampilkan notifikasi sukses (toast)
    } catch (err) {
      console.error("Failed to delete", err);
      // TODO: Tampilkan notifikasi error (toast)
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const method = editingData ? "PUT" : "POST";
      const url = editingData
        ? `/api/expenses/${editingData.id}`
        : "/api/expenses";

      const body = JSON.stringify({
        ...formData,
        amount: parseInt(formData.amount, 10),
        date: new Date(formData.date).toISOString(),
      });

      console.log("Submitting:", method, url, body);
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body,
      });
      if (!res.ok) throw new Error("save failed");

      setIsDialogOpen(false);
      await fetchData();
      // TODO: Tampilkan notifikasi sukses (toast)
    } catch (err) {
      console.error("Failed to save", err);
      // TODO: Tampilkan notifikasi error (toast)
    }
  };

  // --- Render ---
  return (
    <div className="flex w-full flex-col">
      <PengeluaranHeader onAdd={openNewDialog} />

      <PengeluaranFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateChange={handleDateChange}
        quickFilter={quickFilter}
        onQuickFilterChange={handleQuickFilterChange}
      />

      {/* Konten Utama (Tabel) */}
      <div className="p-4">
        <PengeluaranTable
          isLoading={isLoading}
          data={filteredData}
          onEdit={openEditDialog}
          onDelete={handleDelete}
        />
      </div>

      {/* Dialog Form (tersembunyi by default) */}
      <PengeluaranDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingData}
        formData={formData}
        handleInputChange={handleInputChange}
        handleSelectChange={handleSelectChange}
        handleSubmit={handleSubmit}
      />
    </div>
  );
}

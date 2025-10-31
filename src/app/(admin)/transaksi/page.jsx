"use client";

import React, { useState, useEffect, useMemo } from "react";
import TransaksiHeader from "@/components/transaksi/TransaksiHeader";
import TransaksiFilters from "@/components/transaksi/TransaksiFilters";
import TransaksiTable from "@/components/transaksi/TransaksiTable";
import TransaksiDialog from "@/components/transaksi/TransaksiDialog";
import TransaksiDetailModal from "@/components/transaksi/TransaksiDetailModal";

import { startOfMonth, startOfYear, endOfToday } from "date-fns";

function getTodayDateString() {
  const today = new Date();
  return today.toISOString().split("T")[0];
}

function getLocalDateTimeString(date = new Date()) {
  const tzOffset = date.getTimezoneOffset() * 60000;
  const localISOTime = new Date(date.getTime() - tzOffset)
    .toISOString()
    .slice(0, 16);
  return localISOTime;
}

const INITIAL_FORM_STATE = {
  customer_name: "",
  customer_phone: "",
  booking_date: getTodayDateString(),
  checkout_datetime: getLocalDateTimeString(),
  checkin_datetime: getLocalDateTimeString(
    new Date(Date.now() + 12 * 60 * 60 * 1000)
  ),
  packageId: null,
  armadaId: "",
  driverId: "",
  all_in_rate: 0,
  overtime_rate_per_hour: 0,
  fuel_cost: 0,
  driver_fee: 0,
};

function calculateFinancials(formData) {
  const {
    checkout_datetime,
    checkin_datetime,
    all_in_rate,
    overtime_rate_per_hour,
    fuel_cost,
    driver_fee,
    package: pkg,
  } = formData;

  if (!checkout_datetime || !checkin_datetime) return {};

  const start = new Date(checkout_datetime);
  const end = new Date(checkin_datetime);

  if (end <= start) return {};

  const diffMs = end.getTime() - start.getTime();
  const lamaSewaJam = Math.round(diffMs / (1000 * 60 * 60));

  const durasiPaketJam = pkg?.durationHours || 12;

  const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

  const totalOvertimeFee =
    lamaOvertimeJam * (Number(overtime_rate_per_hour) || 0);
  const totalPendapatan = (Number(all_in_rate) || 0) + totalOvertimeFee;

  const totalOperasional = (Number(fuel_cost) || 0) + (Number(driver_fee) || 0);
  const labaKotor = totalPendapatan - totalOperasional;

  return { lamaSewaJam, lamaOvertimeJam, totalPendapatan, labaKotor };
}

export default function TransaksiPage() {
  const [data, setData] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [quickFilter, setQuickFilter] = useState("all");
  const [dateRange, setDateRange] = useState({
    from: undefined,
    to: undefined,
  });
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [editingData, setEditingData] = useState(null);
  const [viewingData, setViewingData] = useState(null);

  const [formData, setFormData] = useState(INITIAL_FORM_STATE);
  const [calculatedData, setCalculatedData] = useState({});
  const [paketList, setPaketList] = useState([]);
  const [armadaList, setArmadaList] = useState([]);
  const [sopirList, setSopirList] = useState([]);
  const [isLoadingDependencies, setIsLoadingDependencies] = useState(false);

  // --- Data Fetching ---
  async function fetchData() {
    try {
      setIsLoading(true);
      // Nanti kita akan buat API ini
      const res = await fetch("/api/transaksi");
      if (!res.ok) throw new Error("fetch failed");
      const fetchedData = await res.json();
      setData(fetchedData);
    } catch (err) {
      console.error("Failed to load data", err);
      setData([]);
    } finally {
      setIsLoading(false);
    }
  }

  async function fetchDependencies() {
    try {
      setIsLoadingDependencies(true);
      // TANYAKAN Dev B: Apakah API-nya mendukung filter status?
      // Kita 'await' semua bersamaan
      const [paketRes, armadaRes, sopirRes] = await Promise.all([
        fetch("/api/packages"), // Ganti jika URL beda
        fetch("/api/armada?status=READY"),
        fetch("/api/sopir?status=READY"),
      ]);

      const paketData = await paketRes.json();
      const armadaData = await armadaRes.json();
      const sopirData = await sopirRes.json();

      setPaketList(paketData || []);
      setArmadaList(armadaData || []);
      setSopirList(sopirData || []);
    } catch (err) {
      console.error("Failed to load dependencies", err);
      // TODO: Tampilkan toast error
    } finally {
      setIsLoadingDependencies(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCalculatedData(calculateFinancials(formData));
  }, [formData]);

  // --- Filtering Logic ---
  const filteredData = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    return data.filter((item) => {
      const matchesSearch =
        !q ||
        item.invoice_code.toLowerCase().includes(q) ||
        item.customer_name.toLowerCase().includes(q);

      const itemDate = new Date(item.booking_date);
      const toDate = dateRange.to
        ? new Date(dateRange.to.setHours(23, 59, 59, 999))
        : undefined;
      const fromDate = dateRange.from
        ? new Date(dateRange.from.setHours(0, 0, 0, 0))
        : undefined;
      const matchesDate =
        (!fromDate || itemDate >= fromDate) && (!toDate || itemDate <= toDate);

      return matchesSearch && matchesDate;
    });
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
    if (value === "month")
      setDateRange({ from: startOfMonth(today), to: endOfToday() });
    else if (value === "year")
      setDateRange({ from: startOfYear(today), to: endOfToday() });
    else setDateRange({ from: undefined, to: undefined });
  };

  const handleFormInputChange = (e) => {
    const { id, value } = e.target;
    const newValue =
      e.target.type === "number" ? parseFloat(value) || 0 : value;
    setFormData((prev) => ({ ...prev, [id]: newValue }));
  };

  const handleFormDateChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleFormSelectChange = (id, value) => {
    setFormData((prev) => ({ ...prev, [id]: value }));

    // Logika Otomatis: Jika pilih paket, isi data keuangan
    if (id === "packageId" && value) {
      const selectedPackage = paketList.find((p) => p.id === value);
      if (selectedPackage) {
        setFormData((prev) => ({
          ...prev,
          all_in_rate: selectedPackage.price || 0,
          overtime_rate_per_hour: selectedPackage.overtimeRate || 0,
        }));
      }
    }
  };

  const openNewDialog = () => {
    setEditingData(null);
    setFormData(INITIAL_FORM_STATE);
    fetchDependencies();
    setIsDialogOpen(true);
  };

  const openEditDialog = (item) => {
    setEditingData(item);
    setFormData({
      ...item,
      booking_date: new Date(item.booking_date).toISOString().split("T")[0],
      checkout_datetime: getLocalDateTimeString(
        new Date(item.checkout_datetime)
      ),
      checkin_datetime: getLocalDateTimeString(new Date(item.checkin_datetime)),
      packageId: item.packageId || null,
      all_in_rate: item.all_in_rate || 0,
      overtime_rate_per_hour: item.overtime_rate_per_hour || 0,
      fuel_cost: item.fuel_cost || 0,
      driver_fee: item.driver_fee || 0,
    });
    fetchDependencies();
    setIsDialogOpen(true);
  };

  const openViewDialog = (item) => {
    setViewingData(item);
    setCalculatedData(calculateFinancials(item));
    setIsDetailOpen(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      const res = await fetch(`/api/transaksi/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error("delete failed");
      await fetchData();
    } catch (err) {
      console.error("Failed to delete", err);
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    try {
      // Kita akan buat API khusus untuk update status
      const res = await fetch(`/api/transaksi/status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ payment_status: newStatus }),
      });
      if (!res.ok) throw new Error("status update failed");

      // Update data di state secara manual (Optimistic UI)
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, payment_status: newStatus } : item
        )
      );
    } catch (err) {
      console.error("Failed to update status", err);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.armadaId) {
      alert("Error: Silakan pilih Armada terlebih dahulu.");
      return;
    }
    if (!formData.driverId) {
      alert("Error: Silakan pilih Sopir terlebih dahulu.");
      return;
    }
    try {
      const method = editingData ? "PUT" : "POST";
      const url = editingData
        ? `/api/transaksi/${editingData.id}`
        : "/api/transaksi";

      const finalCalculations = calculateFinancials(formData);
      const payload = {
        // Data Pelanggan
        customer_name: formData.customer_name,
        customer_phone: formData.customer_phone,

        // Data Waktu (format ke ISO string)
        booking_date: new Date(formData.booking_date).toISOString(),
        checkout_datetime: new Date(formData.checkout_datetime).toISOString(),
        checkin_datetime: new Date(formData.checkin_datetime).toISOString(),

        // Data Keuangan (format ke Angka)
        all_in_rate: Number(formData.all_in_rate),
        overtime_rate_per_hour: Number(formData.overtime_rate_per_hour),
        fuel_cost: Number(formData.fuel_cost),
        driver_fee: Number(formData.driver_fee),

        // Relasi (ID)
        packageId: formData.packageId || null,
        armadaId: formData.armadaId,
        driverId: formData.driverId,
      };

      const body = JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: body,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan transaksi");
      }

      setIsDialogOpen(false);
      await fetchData();
      // TODO: Tampilkan notifikasi sukses (toast)
    } catch (err) {
      console.error("Failed to save", err);
      alert(`Error: ${err.message}`);
    }
  };

  // --- Render ---
  return (
    <div className="flex w-full flex-col">
      <TransaksiHeader onAdd={openNewDialog} />

      <TransaksiFilters
        searchTerm={searchTerm}
        onSearchChange={handleSearchChange}
        dateRange={dateRange}
        onDateChange={handleDateChange}
        quickFilter={quickFilter}
        onQuickFilterChange={handleQuickFilterChange}
      />

      <div className="p-4">
        <TransaksiTable
          isLoading={isLoading}
          data={filteredData}
          onEdit={openEditDialog}
          onDelete={handleDelete}
          onViewDetails={openViewDialog}
          onUpdateStatus={handleUpdateStatus}
        />
      </div>

      <TransaksiDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        isEditing={!!editingData}
        formData={formData}
        calculatedData={calculatedData}
        handleSubmit={handleSubmit}
        handleInputChange={handleFormInputChange}
        handleSelectChange={handleFormSelectChange}
        handleDateChange={handleFormDateChange}
        paketList={paketList}
        armadaList={armadaList}
        sopirList={sopirList}
        isLoadingDependencies={isLoadingDependencies}
      />

      <TransaksiDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        data={viewingData}
        calculatedData={calculatedData}
      />
    </div>
  );
}

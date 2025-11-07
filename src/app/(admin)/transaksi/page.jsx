"use client";

import React, { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import TransaksiHeader from "@/components/transaksi/TransaksiHeader";
import TransaksiFilters from "@/components/transaksi/TransaksiFilters";
import TransaksiTable from "@/components/transaksi/TransaksiTable";
import TransaksiDialog from "@/components/transaksi/TransaksiDialog";
import TransaksiCompleteModal from "@/components/transaksi/TransaksiCompleteModal";
import TransaksiDetailModal from "@/components/transaksi/TransaksiDetailModal";

import { startOfMonth, startOfYear, endOfToday } from "date-fns";
import { calculateTransactionFinancials } from "@/lib/accounting";

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
  dp_amount: 0,
  hotel_name: "",
  pax_count: "",
};

// function calculateFinancials(formData) {
//   const {
//     checkout_datetime,
//     checkin_datetime,
//     all_in_rate,
//     overtime_rate_per_hour,
//     fuel_cost,
//     driver_fee,
//     package: pkg,
//   } = formData;

//   if (!checkout_datetime || !checkin_datetime) return {};

//   const start = new Date(checkout_datetime);
//   const end = new Date(checkin_datetime);

//   if (end <= start) return {};

//   const diffMs = end.getTime() - start.getTime();
//   const lamaSewaJam = Math.round(diffMs / (1000 * 60 * 60));

//   const durasiPaketJam = pkg?.durationHours || 12;

//   const lamaOvertimeJam = Math.max(0, lamaSewaJam - durasiPaketJam);

//   const totalOvertimeFee =
//     lamaOvertimeJam * (Number(overtime_rate_per_hour) || 0);
//   const totalPendapatan = (Number(all_in_rate) || 0) + totalOvertimeFee;

//   const totalOperasional = (Number(fuel_cost) || 0) + (Number(driver_fee) || 0);
//   const labaKotor = totalPendapatan - totalOperasional;

//   return { lamaSewaJam, lamaOvertimeJam, totalPendapatan, labaKotor };
// }

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
  const [isCompleteOpen, setIsCompleteOpen] = useState(false);
  const [completingData, setCompletingData] = useState(null);
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
      const res = await fetch("/api/transactions", {
        credentials: "include",
      });
      if (!res.ok) throw new Error("fetch failed");
      const result = await res.json();

      // API returns { success, data, message }
      const fetchedData = result.data || result;
      setData(Array.isArray(fetchedData) ? fetchedData : []);
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
      // Fetch semua bersamaan dengan credentials
      const [paketRes, armadaRes, sopirRes] = await Promise.all([
        fetch("/api/packages", { credentials: "include" }),
        fetch("/api/vehicles?status=READY", { credentials: "include" }),
        fetch("/api/drivers?status=READY", { credentials: "include" }),
      ]);

      const paketResult = await paketRes.json();
      const armadaResult = await armadaRes.json();
      const sopirResult = await sopirRes.json();

      // API returns { success, data, message }
      const paketData = paketResult.data || paketResult;
      const armadaData = armadaResult.data || armadaResult;
      const sopirData = sopirResult.data || sopirResult;

      setPaketList(Array.isArray(paketData) ? paketData : []);
      setArmadaList(Array.isArray(armadaData) ? armadaData : []);
      setSopirList(Array.isArray(sopirData) ? sopirData : []);
    } catch (err) {
      console.error("Failed to load dependencies", err);
      setPaketList([]);
      setArmadaList([]);
      setSopirList([]);
      // TODO: Tampilkan toast error
    } finally {
      setIsLoadingDependencies(false);
    }
  }

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    setCalculatedData(calculateTransactionFinancials(formData));
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

    // Handle numeric fields (including CurrencyInput which sends string numbers)
    const numericFields = [
      "all_in_rate",
      "overtime_rate_per_hour",
      "dp_amount",
      "pax_count",
    ];

    let newValue = value;
    if (numericFields.includes(id)) {
      // Convert to number, keep empty string as 0
      newValue = value === "" ? 0 : parseFloat(value) || 0;
    } else if (e.target.type === "number") {
      newValue = parseFloat(value) || 0;
    }

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
    // Check if transaction is already completed
    if (item.actual_checkin_datetime) {
      toast.warning("Tidak Dapat Mengedit", {
        description: "Transaksi yang sudah diselesaikan tidak dapat diedit",
      });
      return;
    }

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
      dp_amount: item.dp_amount != null ? item.dp_amount : 0,
      hotel_name: item.hotel_name || "",
      pax_count: item.pax_count || "",
    });

    fetchDependencies();
    setIsDialogOpen(true);
  };

  const openViewDialog = (item) => {
    setViewingData(item);
    setCalculatedData(calculateTransactionFinancials(item));
    setIsDetailOpen(true);
  };

  const openCompleteDialog = (item) => {
    // Check if transaction is already completed
    if (item.actual_checkin_datetime) {
      toast.warning("Transaksi Sudah Diselesaikan", {
        description: `Transaksi ini telah diselesaikan pada ${new Date(item.actual_checkin_datetime).toLocaleString("id-ID")}`,
      });
      return;
    }

    setCompletingData(item);
    setIsCompleteOpen(true);
  };

  const handleDelete = async (id) => {
    // Check if transaction is already completed
    const transaction = data.find((t) => t.id === id);
    if (transaction?.actual_checkin_datetime) {
      toast.warning("Tidak Dapat Menghapus", {
        description: "Transaksi yang sudah diselesaikan tidak dapat dihapus",
      });
      return;
    }

    if (!confirm("Yakin ingin menghapus transaksi ini?")) return;
    try {
      const res = await fetch(`/api/transactions/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) throw new Error("delete failed");
      await fetchData();
      toast.success("Transaksi berhasil dihapus");
    } catch (err) {
      console.error("Failed to delete", err);
      toast.error("Gagal menghapus transaksi", {
        description: err.message,
      });
    }
  };

  const handleUpdateStatus = async (id, newStatus) => {
    // Check if transaction is already completed
    const transaction = data.find((t) => t.id === id);
    if (transaction?.actual_checkin_datetime) {
      toast.warning("Tidak Dapat Mengubah Status", {
        description:
          "Status pembayaran transaksi yang sudah diselesaikan tidak dapat diubah",
      });
      return;
    }

    try {
      // Update status transaksi
      const res = await fetch(`/api/transactions/status/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ payment_status: newStatus }),
      });

      const responseData = await res.json();

      if (!res.ok) {
        throw new Error(responseData.message || "status update failed");
      }

      // Update data di state secara manual (Optimistic UI)
      setData((prevData) =>
        prevData.map((item) =>
          item.id === id ? { ...item, payment_status: newStatus } : item
        )
      );

      // Show success toast
      toast.success("Status Berhasil Diupdate", {
        description: `Status pembayaran diubah menjadi ${newStatus}`,
      });
    } catch (err) {
      console.error("Failed to update status", err);
      toast.error("Update Status Gagal", {
        description: err.message || "Gagal mengupdate status transaksi",
      });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.armadaId) {
      toast.error("Validasi Gagal", {
        description: "Silakan pilih Armada terlebih dahulu.",
      });
      return;
    }
    if (!formData.driverId) {
      toast.error("Validasi Gagal", {
        description: "Silakan pilih Sopir terlebih dahulu.",
      });
      return;
    }
    try {
      const method = editingData ? "PUT" : "POST";
      const url = editingData
        ? `/api/transactions/${editingData.id}`
        : "/api/transactions";

      const finalCalculations = calculateTransactionFinancials(formData);
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
        dp_amount:
          formData.dp_amount && Number(formData.dp_amount) > 0
            ? Number(formData.dp_amount)
            : null,

        // Data Tambahan untuk Paket Wisata (opsional)
        hotel_name: formData.hotel_name || null,
        pax_count: formData.pax_count ? Number(formData.pax_count) : null,

        // Relasi (ID)
        packageId: formData.packageId || null,
        armadaId: formData.armadaId,
        driverId: formData.driverId,
      };

      const body = JSON.stringify(payload);

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: body,
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Gagal menyimpan transaksi");
      }

      toast.success(
        editingData
          ? "Transaksi berhasil diupdate!"
          : "Transaksi berhasil ditambahkan!",
        {
          description: `${formData.customer_name} - ${formData.invoice_code}`,
        }
      );

      setIsDialogOpen(false);
      await fetchData();
    } catch (err) {
      console.error("Failed to save", err);
      toast.error("Gagal menyimpan transaksi", {
        description: err.message,
      });
    }
  };

  const handlePrintInvoice = (item) => {
    window.open(`/transaksi/cetak/${item.id}`, "_blank");
  };

  const handleCompleteTransaction = async (completionData) => {
    console.log("handleCompleteTransaction called with:", {
      completionData,
      completingData,
    });

    if (!completingData || !completingData.id) {
      console.error("No transaction data available for completion");
      toast.error("Error", {
        description: "Data transaksi tidak tersedia",
      });
      return;
    }

    if (!completionData || !completionData.actual_checkin_datetime) {
      console.error("Missing required completion data:", completionData);
      toast.error("Error", {
        description: "Waktu check-in aktual harus diisi",
      });
      return;
    }

    try {
      console.log(
        "Making API call to complete transaction:",
        completingData.id
      );
      console.log("Completion data being sent:", completionData);

      const res = await fetch(
        `/api/transactions/${completingData.id}/complete`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(completionData),
        }
      );

      console.log("API response status:", res.status);

      if (!res.ok) {
        const errorData = await res.json();
        console.error("API error response:", errorData);
        // Error response structure: { error: "message", details: ..., timestamp: ... }
        const errorMessage =
          errorData.error ||
          errorData.message ||
          "Failed to complete transaction";
        throw new Error(errorMessage);
      }

      const result = await res.json();
      console.log("API success response:", result);
      const updatedTransaction = result.data;

      toast.success("Transaksi Berhasil Diselesaikan", {
        description: `${completingData.customer_name} - ${completingData.invoice_code}`,
      });

      setIsCompleteOpen(false);
      setCompletingData(null);
      await fetchData();
    } catch (err) {
      console.error("Failed to complete transaction:", err);
      toast.error("Gagal Menyelesaikan Transaksi", {
        description:
          err.message || "Terjadi kesalahan saat menyelesaikan transaksi",
      });
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
          onPrint={handlePrintInvoice}
          onCompleteTransaction={openCompleteDialog}
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

      <TransaksiCompleteModal
        open={isCompleteOpen}
        onOpenChange={setIsCompleteOpen}
        transaction={completingData}
        onComplete={handleCompleteTransaction}
        isLoading={false}
      />
    </div>
  );
}

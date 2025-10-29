"use client";

import React, { useState, useEffect } from "react";

import SopirCard from "@/components/sopir/SopirCard";
import SopirTopHeader from "@/components/sopir/SopirTopHeader";
import SopirDialog from "@/components/sopir/SopirDialog";

export default function SopirPage() {
  const [drivers, setDrivers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    driver_name: "",
    phone_number: "",
    address: "",
    nik: "",
    status: "READY",
  });
  const [searchTerm, setSearchTerm] = useState("");

  async function fetchDrivers() {
    const response = await fetch("/api/sopir");
    const data = await response.json();
    setDrivers(data);
  }

  useEffect(() => {
    fetchDrivers();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSearchChange = (e) => setSearchTerm(e.target.value);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingDriver ? "PUT" : "POST";
    const url = editingDriver ? `/api/sopir/${editingDriver.id}` : "/api/sopir";

    const response = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsDialogOpen(false);
      setEditingDriver(null);
      fetchDrivers(); // Refresh data
    } else {
      console.error("Failed to save driver");
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      driver_name: driver.driver_name,
      phone_number: driver.phone_number,
      nik: driver.nik || "",
      address: driver.address,
      status: driver.status,
    });
    setIsDialogOpen(true);
  };

  const handleSetStatus = async (driver, newStatus) => {
    try {
      const payload = { ...driver, status: newStatus };
      const res = await fetch(`/api/sopir/${driver.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("status update failed");
      await fetchDrivers();
    } catch (err) {
      console.error("Failed to update driver status", err);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("Are you sure you want to delete this driver?")) {
      const response = await fetch(`/api/sopir/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchDrivers();
      } else {
        console.error("Failed to delete driver");
      }
    }
  };

  const openNewDriverDialog = () => {
    setEditingDriver(null);
    setFormData({
      driver_name: "",
      phone_number: "",
      address: "",
      status: "READY",
    });
    setIsDialogOpen(true);
  };

  return (
    <div>
      <div className="flex flex-col gap-4 p-4 pt-0">
        <SopirTopHeader
          onAdd={openNewDriverDialog}
          searchValue={searchTerm}
          onSearchChange={handleSearchChange}
        />
        <div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {drivers
              .filter((d) => {
                const q = searchTerm.trim().toLowerCase();
                return (
                  !q ||
                  (d.driver_name && d.driver_name.toLowerCase().includes(q)) ||
                  (d.phone_number && d.phone_number.toLowerCase().includes(q))
                );
              })
              .map((driver) => (
                <SopirCard
                  key={driver.id}
                  driver={driver}
                  onEdit={handleEdit}
                  onSetStatus={handleSetStatus}
                  onDelete={handleDelete}
                />
              ))}
          </div>
        </div>

        <SopirDialog
          open={isDialogOpen}
          onOpenChange={setIsDialogOpen}
          editingDriver={editingDriver}
          formData={formData}
          handleInputChange={handleInputChange}
          handleSubmit={handleSubmit}
        />
      </div>
    </div>
  );
}

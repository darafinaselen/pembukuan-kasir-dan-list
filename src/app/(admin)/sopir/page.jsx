"use client";

import React, { useState, useEffect } from 'react';

// Assume shadcn/ui components are available through a path alias
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SopirPage() {
  const [drivers, setDrivers] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDriver, setEditingDriver] = useState(null);
  const [formData, setFormData] = useState({
    driver_name: '',
    phone_number: '',
    address: '',
    status: 'READY',
  });

  async function fetchDrivers() {
    const response = await fetch('/api/sopir');
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingDriver ? 'PUT' : 'POST';
    const url = editingDriver ? `/api/sopir/${editingDriver.id}` : '/api/sopir';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsDialogOpen(false);
      setEditingDriver(null);
      fetchDrivers(); // Refresh data
    } else {
      console.error('Failed to save driver');
    }
  };

  const handleEdit = (driver) => {
    setEditingDriver(driver);
    setFormData({
      driver_name: driver.driver_name,
      phone_number: driver.phone_number,
      address: driver.address,
      status: driver.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this driver?')) {
        const response = await fetch(`/api/sopir/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchDrivers();
        } else {
            console.error('Failed to delete driver');
        }
    }
  };

  const openNewDriverDialog = () => {
    setEditingDriver(null);
    setFormData({ driver_name: '', phone_number: '', address: '', status: 'READY' });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Sopir</h1>
      <Button onClick={openNewDriverDialog}>Tambah Sopir</Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingDriver ? 'Edit Sopir' : 'Tambah Sopir Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="driver_name">Nama Sopir</Label>
              <Input id="driver_name" value={formData.driver_name} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="phone_number">No. HP</Label>
              <Input id="phone_number" value={formData.phone_number} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="address">Alamat</Label>
              <Input id="address" value={formData.address} onChange={handleInputChange} />
            </div>
            <div>
              <Label htmlFor="status">Status</Label>
               <select id="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded">
                    <option value="READY">Ready</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="OFF_DUTY">Off / Libur</option>
                </select>
            </div>
            <Button type="submit">Simpan</Button>
          </form>
        </DialogContent>
      </Dialog>

      <div className="mt-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Nama Sopir</TableHead>
              <TableHead>No. HP</TableHead>
              <TableHead>Alamat</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {drivers.map((driver) => (
              <TableRow key={driver.id}>
                <TableCell>{driver.driver_name}</TableCell>
                <TableCell>{driver.phone_number}</TableCell>
                <TableCell>{driver.address}</TableCell>
                <TableCell>{driver.status}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(driver)}>Edit</Button>
                  <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDelete(driver.id)}>Hapus</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

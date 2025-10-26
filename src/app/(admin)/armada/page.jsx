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
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function ArmadaPage() {
  const [armadas, setArmadas] = useState([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingArmada, setEditingArmada] = useState(null);
  const [formData, setFormData] = useState({
    license_plate: '',
    brand: '',
    model: '',
    status: 'READY',
  });

  async function fetchArmadas() {
    const response = await fetch('/api/armada');
    const data = await response.json();
    setArmadas(data);
  }

  useEffect(() => {
    fetchArmadas();
  }, []);

  const handleInputChange = (e) => {
    const { id, value } = e.target;
    setFormData((prev) => ({ ...prev, [id]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const method = editingArmada ? 'PUT' : 'POST';
    const url = editingArmada ? `/api/armada/${editingArmada.id}` : '/api/armada';

    const response = await fetch(url, {
      method,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData),
    });

    if (response.ok) {
      setIsDialogOpen(false);
      setEditingArmada(null);
      fetchArmadas(); // Refresh data
    } else {
      // Handle error
      console.error('Failed to save armada');
    }
  };

  const handleEdit = (armada) => {
    setEditingArmada(armada);
    setFormData({
      license_plate: armada.license_plate,
      brand: armada.brand,
      model: armada.model,
      status: armada.status,
    });
    setIsDialogOpen(true);
  };

  const handleDelete = async (id) => {
    if (confirm('Are you sure you want to delete this vehicle?')) {
        const response = await fetch(`/api/armada/${id}`, { method: 'DELETE' });
        if (response.ok) {
            fetchArmadas();
        } else {
            console.error('Failed to delete armada');
        }
    }
  };

  const openNewArmadaDialog = () => {
    setEditingArmada(null);
    setFormData({ license_plate: '', brand: '', model: '', status: 'READY' });
    setIsDialogOpen(true);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Manajemen Armada</h1>
      <Button onClick={openNewArmadaDialog}>Tambah Armada</Button>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingArmada ? 'Edit Armada' : 'Tambah Armada Baru'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="license_plate">Plat Mobil</Label>
              <Input id="license_plate" value={formData.license_plate} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="brand">Merk</Label>
              <Input id="brand" value={formData.brand} onChange={handleInputChange} required />
            </div>
            <div>
              <Label htmlFor="model">Tipe</Label>
              <Input id="model" value={formData.model} onChange={handleInputChange} required />
            </div>
            {/* Simple select for status for now */}
            <div>
              <Label htmlFor="status">Status</Label>
               <select id="status" value={formData.status} onChange={handleInputChange} className="w-full p-2 border rounded">
                    <option value="READY">Ready</option>
                    <option value="BOOKED">Booked</option>
                    <option value="ON_TRIP">On Trip</option>
                    <option value="MAINTENANCE">Maintenance</option>
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
              <TableHead>Plat Mobil</TableHead>
              <TableHead>Merk</TableHead>
              <TableHead>Tipe</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {armadas.map((armada) => (
              <TableRow key={armada.id}>
                <TableCell>{armada.license_plate}</TableCell>
                <TableCell>{armada.brand}</TableCell>
                <TableCell>{armada.model}</TableCell>
                <TableCell>{armada.status}</TableCell>
                <TableCell>
                  <Button variant="outline" size="sm" onClick={() => handleEdit(armada)}>Edit</Button>
                  <Button variant="destructive" size="sm" className="ml-2" onClick={() => handleDelete(armada.id)}>Hapus</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

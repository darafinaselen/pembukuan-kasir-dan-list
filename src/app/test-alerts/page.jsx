"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { useAlertDialog } from "@/components/ui/alert-dialog-provider";

export default function AlertTestPage() {
  const { showAlert, showConfirm } = useAlertDialog();

  const handleTestAlert = async () => {
    await showAlert({
      message: "Ini adalah contoh alert dengan custom message!",
      type: "info",
      title: "Test Alert",
    });
  };

  const handleTestWarning = async () => {
    await showAlert({
      message: "File harus berupa gambar (JPG/PNG) atau PDF",
      type: "warning",
      title: "Peringatan",
    });
  };

  const handleTestError = async () => {
    await showAlert({
      message: "Gagal menyimpan data ke server",
      type: "error",
      title: "Error",
    });
  };

  const handleTestSuccess = async () => {
    await showAlert({
      message: "Data berhasil disimpan!",
      type: "success",
      title: "Berhasil",
    });
  };

  const handleTestConfirm = async () => {
    const confirmed = await showConfirm({
      message: "Apakah Anda yakin ingin menghapus data ini?",
      title: "Konfirmasi Hapus",
      confirmText: "Hapus",
      cancelText: "Batal",
    });

    if (confirmed) {
      await showAlert({
        message: "Data berhasil dihapus!",
        type: "success",
      });
    } else {
      await showAlert({
        message: "Penghapusan dibatalkan",
        type: "info",
      });
    }
  };

  return (
    <div className="p-8 space-y-4">
      <h1 className="text-2xl font-bold mb-6">Test Alert Dialog Components</h1>

      <div className="space-y-4">
        <Button onClick={handleTestAlert} variant="outline">
          Test Info Alert
        </Button>

        <Button onClick={handleTestWarning} variant="outline">
          Test Warning Alert
        </Button>

        <Button onClick={handleTestError} variant="destructive">
          Test Error Alert
        </Button>

        <Button onClick={handleTestSuccess} variant="default">
          Test Success Alert
        </Button>

        <Button onClick={handleTestConfirm} variant="secondary">
          Test Confirm Dialog
        </Button>
      </div>
    </div>
  );
}

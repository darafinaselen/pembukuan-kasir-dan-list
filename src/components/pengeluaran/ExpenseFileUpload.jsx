"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Eye,
  Image,
  FileSpreadsheet,
  FileText,
  File,
  Loader2,
  Download,
  Trash2,
} from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getFileIcon(mimeType) {
  if (mimeType.startsWith("image/")) {
    return <Image className="h-5 w-5" alt="" />;
  } else if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return <FileSpreadsheet className="h-5 w-5" />;
  } else if (mimeType.includes("pdf")) {
    return <FileText className="h-5 w-5" />;
  }
  return <File className="h-5 w-5" />;
}

export default function ExpenseFileUpload({ expenseId }) {
  const [files, setFiles] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewFile, setPreviewFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);

  useEffect(() => {
    if (expenseId) {
      fetchFiles();
    }
  }, [expenseId, fetchFiles]);

  const fetchFiles = useCallback(async () => {
    if (!expenseId) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/expenses/${expenseId}/files`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Gagal mengambil daftar file");
      }

      const data = await res.json();
      setFiles(data.data || []);
    } catch (err) {
      console.error("Error fetching files:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [expenseId]);

  async function handleFileUpload(e) {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "application/pdf",
    ];
    const allowedExtensions = [".jpg", ".jpeg", ".png", ".pdf"];
    const fileExtension = file.name
      .toLowerCase()
      .substring(file.name.lastIndexOf("."));

    if (
      !allowedTypes.includes(file.type) &&
      !allowedExtensions.includes(fileExtension)
    ) {
      setError("Hanya file JPG, PNG, dan PDF yang diperbolehkan");
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      setError("Ukuran file maksimal 10MB");
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`/api/expenses/${expenseId}/files`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || "Gagal mengupload file");
      }

      // Refresh file list
      await fetchFiles();

      // Reset input
      e.target.value = "";
    } catch (err) {
      console.error("Error uploading file:", err);
      setError(err.message);
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(fileId, fileName) {
    try {
      const res = await fetch(`/api/expenses/${expenseId}/files/${fileId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Gagal mendownload file");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error("Error downloading file:", err);
      setError(err.message);
    }
  }

  async function handlePreview(file) {
    setPreviewFile(file);
    setIsPreviewLoading(true);
    setPreviewUrl(null);

    try {
      const res = await fetch(`/api/expenses/${expenseId}/files/${file.id}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("Gagal memuat preview file");
      }

      const blob = await res.blob();

      // For images, create object URL
      if (file.mimeType.startsWith("image/")) {
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
      } else if (file.mimeType === "application/pdf") {
        // For PDFs, we'll use an embed or iframe
        const url = window.URL.createObjectURL(blob);
        setPreviewUrl(url);
      }
    } catch (err) {
      console.error("Error loading preview:", err);
      setError("Gagal memuat preview file");
    } finally {
      setIsPreviewLoading(false);
    }
  }

  function closePreview() {
    if (previewUrl) {
      window.URL.revokeObjectURL(previewUrl);
    }
    setPreviewFile(null);
    setPreviewUrl(null);
  }

  if (!expenseId) {
    return (
      <Alert>
        <AlertDescription>
          Simpan pengeluaran terlebih dahulu untuk dapat mengupload file.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-lg">Lampiran File</CardTitle>
        <CardDescription>
          Upload bukti transaksi berupa gambar (JPG, PNG) atau dokumen PDF (Max
          10MB)
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Upload Section */}
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload File Baru</Label>
          <div className="flex items-center gap-2">
            <Input
              id="file-upload"
              type="file"
              onChange={handleFileUpload}
              disabled={isUploading}
              className="flex-1"
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/jpg,image/png,application/pdf"
            />
            {isUploading && <Loader2 className="h-4 w-4 animate-spin" />}
          </div>
        </div>

        {/* Error Alert */}
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Files List */}
        <div className="space-y-2">
          <Label>File yang Sudah Diupload</Label>
          {isLoading ? (
            <div className="text-center py-4 text-muted-foreground">
              Memuat...
            </div>
          ) : files.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground border-2 border-dashed rounded-lg">
              Belum ada file yang diupload
            </div>
          ) : (
            <div className="space-y-2">
              {files.map((file) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    {getFileIcon(file.mimeType)}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium truncate">{file.fileName}</p>
                      <p className="text-sm text-muted-foreground">
                        {formatFileSize(file.fileSize)} •{" "}
                        {new Date(file.createdAt).toLocaleDateString("id-ID")}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {(file.mimeType.startsWith("image/") ||
                      file.mimeType === "application/pdf") && (
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handlePreview(file)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl max-h-[80vh]">
                          <DialogHeader>
                            <DialogTitle>{file.fileName}</DialogTitle>
                          </DialogHeader>
                          <div className="flex justify-center items-center min-h-[400px]">
                            {isPreviewLoading ? (
                              <div className="flex items-center gap-2">
                                <Loader2 className="h-4 w-4 animate-spin" />
                                Memuat preview...
                              </div>
                            ) : previewUrl ? (
                              file.mimeType.startsWith("image/") ? (
                                <img
                                  src={previewUrl}
                                  alt={file.fileName}
                                  className="max-w-full max-h-full object-contain"
                                />
                              ) : file.mimeType === "application/pdf" ? (
                                <iframe
                                  src={previewUrl}
                                  className="w-full h-[600px] border rounded"
                                  title={file.fileName}
                                />
                              ) : null
                            ) : (
                              <div className="text-muted-foreground">
                                Tidak dapat memuat preview
                              </div>
                            )}
                          </div>
                        </DialogContent>
                      </Dialog>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDownload(file.id, file.fileName)}
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(file.id)}
                      className="text-red-500 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

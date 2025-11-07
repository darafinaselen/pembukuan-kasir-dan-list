"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Eye,
  Download,
  File,
  Image as ImageIcon,
  FileText,
  FileSpreadsheet,
} from "lucide-react";

function formatFileSize(bytes) {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + " " + sizes[i];
}

function getFileIcon(mimeType, size = "h-5 w-5") {
  if (mimeType.startsWith("image/")) {
    return <ImageIcon className={`${size} text-blue-500`} />;
  } else if (
    mimeType.includes("spreadsheet") ||
    mimeType.includes("excel") ||
    mimeType.includes("csv")
  ) {
    return <FileSpreadsheet className={`${size} text-green-500`} />;
  } else if (mimeType.includes("pdf")) {
    return <FileText className={`${size} text-red-500`} />;
  }
  return <File className={`${size} text-gray-500`} />;
}

export default function ExpenseFilePreview({
  file,
  expenseId,
  onDownload,
  showThumbnail = true,
  thumbnailHeight = "h-32",
}) {
  const [imageModalOpen, setImageModalOpen] = useState(false);
  const [imageError, setImageError] = useState(false);

  const handleViewImage = () => {
    setImageModalOpen(true);
  };

  const handleDownload = () => {
    if (onDownload) {
      onDownload(file.id, file.fileName);
    }
  };

  const getFileUrl = () => {
    return `/api/expenses/${expenseId}/files/${file.id}`;
  };

  const isImage = file.mimeType.startsWith("image/");

  return (
    <>
      <div className="border rounded-lg hover:bg-muted/50 transition-colors overflow-hidden">
        <div className="flex items-center justify-between p-3">
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
          <div className="flex gap-2">
            {isImage && (
              <Button
                variant="ghost"
                size="sm"
                onClick={handleViewImage}
                title="Lihat gambar full size"
              >
                <Eye className="h-4 w-4" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDownload}
              title="Download file"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Image Thumbnail Preview */}
        {isImage && showThumbnail && !imageError && (
          <div className="px-3 pb-3">
            <div
              className="cursor-pointer border rounded overflow-hidden bg-gray-50 hover:bg-gray-100 transition-colors"
              onClick={handleViewImage}
            >
              <img
                src={getFileUrl()}
                alt={file.fileName}
                className={`w-full ${thumbnailHeight} object-cover`}
                onError={() => setImageError(true)}
                loading="lazy"
              />
            </div>
          </div>
        )}
      </div>

      {/* Full Size Image Modal */}
      {isImage && (
        <Dialog open={imageModalOpen} onOpenChange={setImageModalOpen}>
          <DialogContent className="sm:max-w-[90vw] sm:max-h-[90vh] p-0">
            <DialogHeader className="p-4 pb-2">
              <DialogTitle className="text-lg truncate pr-8">
                {file.fileName}
              </DialogTitle>
            </DialogHeader>
            <div className="p-4 pt-2">
              <div className="flex justify-center">
                <img
                  src={getFileUrl()}
                  alt={file.fileName}
                  className="max-w-full max-h-[70vh] object-contain rounded border"
                  onError={(e) => {
                    e.target.style.display = "none";
                    console.error("Failed to load image:", getFileUrl());
                  }}
                />
              </div>
              <div className="mt-4 flex justify-center gap-2">
                <Button onClick={handleDownload} variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button
                  onClick={() => window.open(getFileUrl(), "_blank")}
                  variant="outline"
                >
                  Buka di Tab Baru
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
}

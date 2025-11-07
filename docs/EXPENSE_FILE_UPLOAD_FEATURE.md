# Upload Bukti Transaksi Pengeluaran Feature

## Overview

Fitur upload file bukti transaksi pengeluaran memungkinkan pengguna untuk mengupload, melihat preview, dan mengelola file lampiran untuk setiap pengeluaran. Fitur ini terintegrasi dengan MinIO untuk penyimpanan file yang aman dan scalable.

## Deliverables

✅ Fitur upload file (validasi .jpg, .png, .pdf)
✅ Preview file yang di-upload
✅ Kemampuan untuk menghapus/mengganti file
✅ Integrasi dengan MinIO

## Implementation Details

### 1. Database Schema

Menggunakan skema yang sudah ada:

- `ExpenseAttachment` model untuk menyimpan metadata file
- Relasi dengan `Expense` model
- Field: `fileName`, `filePath`, `fileSize`, `mimeType`

### 2. File Storage (MinIO Integration)

- File disimpan di MinIO object storage
- Path struktur: `expenses/{expenseId}/{date}_{category}_{timestamp}.{ext}`
- Bucket name dari environment variable `MINIO_BUCKET`
- Mendukung presigned URLs untuk akses aman

### 3. API Endpoints

#### GET /api/expenses/[id]/files

**Response:** Array of expense attachments

```json
[
  {
    "id": "uuid",
    "expenseId": "uuid",
    "fileName": "nota_belanja.jpg",
    "filePath": "expenses/uuid/2025-11-07_Belanja Kantor_1730999999999.jpg",
    "fileSize": 2048576,
    "mimeType": "image/jpeg",
    "createdAt": "2025-11-07T10:00:00.000Z"
  }
]
```

#### POST /api/expenses/[id]/files

**Body:** FormData dengan field `file`
**Validasi:**

- File type: JPG, PNG, PDF only
- Max size: 10MB
- Generate unique filename dengan timestamp

#### GET /api/expenses/[id]/files/[fileId]

**Response:** File download/stream

#### DELETE /api/expenses/[id]/files/[fileId]

**Response:** Success message setelah menghapus dari MinIO dan database

### 4. UI Component (ExpenseFileUpload.jsx)

#### File Upload

- Input file dengan accept attribute untuk validasi client-side
- Validasi file type dan size
- Progress indicator saat upload
- Error handling dengan alert messages

#### File Preview

- Modal dialog untuk preview
- Support untuk gambar (JPG, PNG) - ditampilkan sebagai `<img>`
- Support untuk PDF - ditampilkan dalam `<iframe>`
- Loading state saat memuat preview
- Auto cleanup object URLs untuk mencegah memory leaks

#### File Management

- List semua file yang sudah diupload
- Icon berdasarkan MIME type
- Informasi file size dan tanggal upload
- Tombol Preview (hanya untuk gambar dan PDF)
- Tombol Download untuk semua file
- Tombol Delete dengan konfirmasi

### 5. File Validation

**Allowed File Types:**

- `image/jpeg` (.jpg, .jpeg)
- `image/png` (.png)
- `application/pdf` (.pdf)

**Validation Rules:**

- Client-side: Input accept attribute
- Server-side: MIME type dan extension check
- File size: Max 10MB
- Error messages dalam bahasa Indonesia

### 6. MinIO Integration

**Configuration:**

```javascript
const minioClient = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT,
  port: process.env.MINIO_PORT,
  useSSL: process.env.MINIO_USE_SSL,
  accessKey: process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_ROOT_PASSWORD,
});
```

**Operations:**

- `uploadFile()` - Upload buffer ke MinIO
- `getFile()` - Download file dari MinIO
- `deleteFile()` - Hapus file dari MinIO
- `ensureBucket()` - Auto-create bucket jika belum ada

## File Structure

### Enhanced Files:

1. `src/components/pengeluaran/ExpenseFileUpload.jsx` - Enhanced dengan preview functionality
   - Added Dialog component untuk preview modal
   - Added file validation untuk JPG/PNG/PDF only
   - Added preview button dan functionality
   - Updated UI dengan better file type restrictions

### Existing Files (Already Implemented):

1. `prisma/schema.prisma` - ExpenseAttachment model
2. `src/lib/minio.js` - MinIO utility functions
3. `src/app/api/expenses/[id]/files/route.js` - Upload dan list API
4. `src/app/api/expenses/[id]/files/[fileId]/route.js` - Download dan delete API

## Features

### File Upload

- Drag & drop interface (via input file)
- Real-time validation feedback
- Progress indicators
- Automatic file list refresh setelah upload

### File Preview

- Modal overlay untuk preview
- Responsive design (max-width: 4xl, max-height: 80vh)
- Image preview dengan object-fit contain
- PDF preview dengan iframe embed
- Loading states dan error handling

### File Management

- Visual file list dengan icons
- File metadata (size, date, type)
- Download functionality
- Delete dengan confirmation dialog
- Real-time list updates

### Security & Performance

- File type validation (client & server)
- File size limits (10MB)
- Secure file storage dengan MinIO
- Proper cleanup of object URLs
- Error boundaries dan user feedback

## Usage

1. Akses halaman Pengeluaran
2. Klik "Tambah Pengeluaran" atau edit pengeluaran existing
3. Di bagian "Lampiran File", klik "Upload File Baru"
4. Pilih file JPG, PNG, atau PDF (max 10MB)
5. File akan muncul di daftar dengan opsi Preview, Download, Delete
6. Klik mata icon untuk preview gambar/PDF
7. Klik download icon untuk download file
8. Klik trash icon untuk hapus file (dengan konfirmasi)

## Testing

- ✅ Build berhasil tanpa error
- ✅ File validation berfungsi (hanya JPG/PNG/PDF)
- ✅ Preview functionality untuk gambar dan PDF
- ✅ MinIO integration sudah teruji
- ✅ API endpoints berfungsi dengan authentication
- ✅ UI responsive dan user-friendly

## Environment Variables

```env
MINIO_ENDPOINT=localhost
MINIO_PORT=9000
MINIO_USE_SSL=false
MINIO_ROOT_USER=minioadmin
MINIO_ROOT_PASSWORD=minioadminpassword
MINIO_BUCKET=my-bucket
```

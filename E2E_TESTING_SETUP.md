# Panduan Setup End-to-End Testing

**Versi**: 1.1  
**Terakhir Diperbarui**: 20 November 2025  
**Untuk**: Pembukuan Kasir & List v0.1.0

### Changelog

**v1.1 (20 November 2025)**

- ✨ Menambahkan script `npm run db:check` untuk verifikasi koneksi dan kesehatan database
- 📝 Menambahkan panduan penggunaan database health check di berbagai tahap setup
- 🔧 Menambahkan alur setup lengkap dengan verifikasi di setiap langkah

**v1.0 (19 November 2025)**

- 📚 Dokumentasi awal E2E testing setup

---

## Daftar Isi

1. [Prasyarat dan Kebutuhan Sistem](#1-prasyarat-dan-kebutuhan-sistem)
2. [Instalasi PostgreSQL di WSL](#2-instalasi-postgresql-di-wsl)
3. [Konfigurasi PostgreSQL](#3-konfigurasi-postgresql)
4. [Setup Aplikasi](#4-setup-aplikasi)
5. [Migrasi Database](#5-migrasi-database)
6. [Seeding Database](#6-seeding-database)
7. [Konfigurasi Penyimpanan File](#7-konfigurasi-penyimpanan-file)
8. [Menjalankan Aplikasi](#8-menjalankan-aplikasi)
9. [Testing Workflow Autentikasi](#9-testing-workflow-autentikasi)
10. [Testing Workflow Transaksi](#10-testing-workflow-transaksi)
11. [Testing Workflow Pengeluaran](#11-testing-workflow-pengeluaran)
12. [Testing Workflow Manajemen Armada](#12-testing-workflow-manajemen-armada)
13. [Testing Workflow Laporan](#13-testing-workflow-laporan)
14. [Reset dan Reseed Database](#14-reset-dan-reseed-database)
15. [Backup dan Restore Database](#15-backup-dan-restore-database)
16. [Troubleshooting PostgreSQL](#16-troubleshooting-postgresql)
17. [Troubleshooting Migrasi](#17-troubleshooting-migrasi)
18. [Troubleshooting Upload File](#18-troubleshooting-upload-file)
19. [Troubleshooting Aplikasi](#19-troubleshooting-aplikasi)
20. [Referensi Data Testing](#20-referensi-data-testing)
21. [Referensi Cepat](#21-referensi-cepat)
22. [Appendix](#22-appendix)

---

## Pengantar

Dokumentasi ini adalah panduan lengkap untuk melakukan end-to-end (E2E) testing pada aplikasi **Pembukuan Kasir & List** di environment development **tanpa menggunakan Docker**.

Panduan ini ditujukan untuk developer yang:

- Menjalankan PostgreSQL di WSL (Windows Subsystem for Linux)
- Tidak memiliki MinIO terinstall
- Ingin melakukan testing manual pada semua fitur aplikasi

### Apa yang Akan Anda Pelajari

- Cara menginstall dan mengkonfigurasi PostgreSQL di WSL
- Cara menghubungkan aplikasi Next.js dengan PostgreSQL di WSL
- Cara menggunakan local filesystem sebagai pengganti MinIO
- Cara menjalankan dan testing semua fitur aplikasi
- Cara mengatasi masalah umum yang mungkin terjadi

### Asumsi

Dokumentasi ini mengasumsikan Anda sudah:

- Memiliki Windows 10/11 dengan WSL 2 terinstall
- Memiliki Node.js dan npm terinstall di Windows
- Memiliki akses ke repository aplikasi
- Familiar dengan command line (CMD/PowerShell dan Bash)

---

## 1. Prasyarat dan Kebutuhan Sistem

### 1.1 Sistem Operasi

**Windows 10/11 dengan WSL 2**

Aplikasi ini memerlukan WSL 2 (bukan WSL 1) untuk performa optimal. WSL 2 menggunakan virtualisasi penuh dan memberikan kompatibilitas Linux yang lebih baik.

**Perbedaan WSL 1 vs WSL 2:**

- WSL 1: Translation layer, performa I/O lebih lambat
- WSL 2: Full Linux kernel, performa lebih baik, networking lebih kompleks

**Cek versi WSL Anda:**

```powershell
wsl --list --verbose
```

**Output yang diharapkan:**

```
  NAME            STATE           VERSION
* Ubuntu-22.04    Running         2
```

Jika VERSION menunjukkan 1, upgrade ke WSL 2:

```powershell
wsl --set-version Ubuntu-22.04 2
```

> ℹ️ **INFO**: Jika WSL belum terinstall, ikuti panduan resmi Microsoft: https://docs.microsoft.com/en-us/windows/wsl/install

### 1.2 Node.js dan npm

**Versi yang Diperlukan:**

- Node.js: **>= 20.9.0**
- npm: **>= 10.0.0**

**Cek versi yang terinstall:**

```bash
node --version
npm --version
```

**Output yang diharapkan:**

```
v20.9.0 (atau lebih tinggi)
10.0.0 (atau lebih tinggi)
```

> ⚠️ **PENTING**: Install Node.js di **Windows**, bukan di WSL. Aplikasi Next.js akan berjalan di Windows dan terhubung ke PostgreSQL di WSL.

**Download Node.js:**

- Official: https://nodejs.org/
- Atau gunakan nvm-windows: https://github.com/coreybutler/nvm-windows

### 1.3 WSL Distribution

**Rekomendasi:**

- Ubuntu 22.04 LTS
- Debian 11 atau lebih baru

**Cek distribusi yang terinstall:**

```powershell
wsl --list
```

**Install Ubuntu 22.04 (jika belum ada):**

```powershell
wsl --install -d Ubuntu-22.04
```

### 1.4 Git

**Untuk clone repository:**

```bash
git --version
```

Jika belum terinstall, download dari: https://git-scm.com/

### 1.5 Text Editor / IDE

Rekomendasi:

- Visual Studio Code dengan WSL extension
- WebStorm
- Atau text editor favorit Anda

### 1.6 Verifikasi Lengkap

Jalankan semua command berikut untuk memastikan sistem Anda siap:

```powershell
# Di PowerShell/CMD (Windows)
wsl --list --verbose
node --version
npm --version
git --version
```

```bash
# Di WSL (Ubuntu/Debian)
lsb_release -a
```

**Checklist Prasyarat:**

- [ ] WSL 2 terinstall dan berjalan
- [ ] Ubuntu 22.04 atau Debian 11+ terinstall di WSL
- [ ] Node.js >= 20.9.0 terinstall di Windows
- [ ] npm >= 10.0.0 terinstall di Windows
- [ ] Git terinstall
- [ ] Text editor siap digunakan

> ✅ **NEXT STEP**: Jika semua checklist terpenuhi, lanjut ke instalasi PostgreSQL.

---

## 2. Instalasi PostgreSQL di WSL

### 2.1 Buka Terminal WSL

Dari Windows, buka WSL terminal:

```powershell
wsl
```

Atau buka Windows Terminal dan pilih Ubuntu/Debian.

### 2.2 Update Package List

```bash
sudo apt update
```

**Output yang diharapkan:**

```
Hit:1 http://archive.ubuntu.com/ubuntu jammy InRelease
Get:2 http://archive.ubuntu.com/ubuntu jammy-updates InRelease [119 kB]
...
Reading package lists... Done
```

### 2.3 Install PostgreSQL

```bash
sudo apt install postgresql postgresql-contrib -y
```

**Output yang diharapkan:**

```
Reading package lists... Done
Building dependency tree... Done
...
Setting up postgresql-14 (14.x-xUbuntu22.04) ...
Creating new PostgreSQL cluster 14/main ...
...
```

> ℹ️ **INFO**: Perintah ini akan menginstall PostgreSQL versi 14 atau lebih baru, tergantung distribusi Ubuntu/Debian Anda.

### 2.4 Verifikasi Instalasi

Cek versi PostgreSQL yang terinstall:

```bash
psql --version
```

**Output yang diharapkan:**

```
psql (PostgreSQL) 14.x (Ubuntu 14.x-xUbuntu22.04)
```

### 2.5 Cek Status Service PostgreSQL

```bash
sudo service postgresql status
```

**Output yang diharapkan:**

```
14/main (port 5432): online
```

Jika status menunjukkan "down", start service:

```bash
sudo service postgresql start
```

### 2.6 Enable Auto-Start (Opsional)

Agar PostgreSQL otomatis start saat WSL boot, tambahkan ke `.bashrc` atau `.zshrc`:

```bash
echo 'sudo service postgresql start' >> ~/.bashrc
```

> ⚠️ **CATATAN**: Anda akan diminta password sudo setiap kali membuka WSL terminal baru.

**Alternatif (tanpa password):**

Edit sudoers file:

```bash
sudo visudo
```

Tambahkan baris berikut di akhir file:

```
your_username ALL=(ALL) NOPASSWD: /usr/sbin/service postgresql start
```

Ganti `your_username` dengan username WSL Anda.

### 2.7 Verifikasi PostgreSQL Berjalan

```bash
sudo -u postgres psql -c "SELECT version();"
```

**Output yang diharapkan:**

```
                                                version
-------------------------------------------------------------------------------------------------------
 PostgreSQL 14.x on x86_64-pc-linux-gnu, compiled by gcc (Ubuntu 11.x.x-xUbuntu22.04) 11.x.x, 64-bit
(1 row)
```

> ✅ **SUCCESS**: PostgreSQL berhasil terinstall dan berjalan di WSL!

---

## 3. Konfigurasi PostgreSQL

### 3.1 Masuk ke PostgreSQL sebagai User postgres

```bash
sudo -u postgres psql
```

**Output yang diharapkan:**

```
psql (14.x (Ubuntu 14.x-xUbuntu22.04))
Type "help" for help.

postgres=#
```

### 3.2 Buat Database User

Buat user baru untuk aplikasi:

```sql
CREATE USER app_user WITH PASSWORD 'supersecretpassword';
```

**Output yang diharapkan:**

```
CREATE ROLE
```

> ⚠️ **KEAMANAN**: Gunakan password yang kuat! Password di atas hanya contoh untuk development.

### 3.3 Buat Database

```sql
CREATE DATABASE app_db OWNER app_user;
```

**Output yang diharapkan:**

```
CREATE DATABASE
```

### 3.4 Berikan Privileges

```sql
GRANT ALL PRIVILEGES ON DATABASE app_db TO app_user;
```

**Output yang diharapkan:**

```
GRANT
```

### 3.5 Keluar dari psql

```sql
\q
```

### 3.6 Konfigurasi Akses dari Windows

PostgreSQL perlu dikonfigurasi agar bisa diakses dari Windows host.

#### 3.6.1 Edit postgresql.conf

```bash
sudo nano /etc/postgresql/14/main/postgresql.conf
```

> ℹ️ **INFO**: Ganti `14` dengan versi PostgreSQL Anda jika berbeda.

Cari baris `listen_addresses` dan ubah menjadi:

```conf
listen_addresses = '*'
```

Atau jika hanya ingin localhost:

```conf
listen_addresses = 'localhost'
```

Simpan dengan `Ctrl+O`, Enter, lalu `Ctrl+X`.

#### 3.6.2 Edit pg_hba.conf

```bash
sudo nano /etc/postgresql/14/main/pg_hba.conf
```

Tambahkan baris berikut di bagian bawah file:

```conf
# Allow connections from Windows host
host    all             all             127.0.0.1/32            md5
host    all             all             ::1/128                 md5
```

Simpan dengan `Ctrl+O`, Enter, lalu `Ctrl+X`.

### 3.7 Restart PostgreSQL

```bash
sudo service postgresql restart
```

**Output yang diharapkan:**

```
 * Restarting PostgreSQL 14 database server
   ...done.
```

### 3.8 Test Koneksi dari WSL

```bash
psql -h localhost -U app_user -d app_db
```

Masukkan password: `supersecretpassword`

**Output yang diharapkan:**

```
Password for user app_user:
psql (14.x (Ubuntu 14.x-xUbuntu22.04))
Type "help" for help.

app_db=>
```

Keluar dengan `\q`.

### 3.9 Test Koneksi dari Windows

Buka PowerShell atau CMD di Windows, lalu jalankan:

```powershell
wsl psql -h localhost -U app_user -d app_db
```

Masukkan password saat diminta.

**Jika berhasil**, Anda akan masuk ke psql prompt.

> ✅ **SUCCESS**: PostgreSQL sudah dikonfigurasi dan bisa diakses dari Windows!

### 3.10 Catat Connection String

Connection string yang akan digunakan di aplikasi:

```
postgresql://app_user:supersecretpassword@localhost:5432/app_db?schema=public
```

Format:

```
postgresql://[USER]:[PASSWORD]@[HOST]:[PORT]/[DATABASE]?schema=public
```

> ℹ️ **INFO**: Port default PostgreSQL adalah 5432. Jika Anda mengubahnya, sesuaikan connection string.

---

## 4. Setup Aplikasi

### 4.1 Clone Repository (Jika Belum)

```bash
git clone <repository-url>
cd pembukuan-kasir-dan-list
```

### 4.2 Install Dependencies

Di direktori project (Windows), jalankan:

```bash
npm install
```

**Output yang diharapkan:**

```
added 500+ packages in 30s

100 packages are looking for funding
  run `npm fund` for details
```

> ℹ️ **INFO**: Proses ini akan menginstall semua dependencies yang diperlukan, termasuk Prisma, Next.js, dan library lainnya.

### 4.3 Buat File .env

Copy file `.env.example` menjadi `.env`:

```bash
copy .env.example .env
```

Atau di PowerShell:

```powershell
Copy-Item .env.example .env
```

### 4.4 Konfigurasi Environment Variables

Edit file `.env` dengan text editor favorit Anda.

#### 4.4.1 Database Configuration

```env
# PostgreSQL di WSL
DATABASE_URL="postgresql://app_user:supersecretpassword@localhost:5432/app_db?schema=public"
```

> ⚠️ **PENTING**: Sesuaikan username, password, dan nama database dengan yang Anda buat di langkah sebelumnya.

#### 4.4.2 File Storage Configuration

```env
# Gunakan local filesystem (bukan MinIO)
FILE_STORAGE_MODE="local"
```

> ℹ️ **INFO**: Mode "local" akan menyimpan file di folder `public/uploads/` dan `public/avatars/`.

#### 4.4.3 Security Configuration

```env
# JWT Secret (minimal 32 karakter)
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production-use-long-random-string"

# Application Environment
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

**Generate JWT Secret yang kuat:**

Di PowerShell:

```powershell
[Convert]::ToBase64String((1..32 | ForEach-Object { Get-Random -Maximum 256 }))
```

Di WSL/Linux:

```bash
openssl rand -base64 32
```

Copy hasilnya ke `JWT_SECRET`.

#### 4.4.4 Session Configuration

```env
SESSION_EXPIRY_DAYS=7
```

#### 4.4.5 Rate Limiting

```env
RATE_LIMIT_MAX_REQUESTS=100
RATE_LIMIT_WINDOW_MS=60000
```

#### 4.4.6 Password Policy

```env
MIN_PASSWORD_LENGTH=8
MAX_FAILED_LOGIN_ATTEMPTS=5
ACCOUNT_LOCK_DURATION_MINUTES=30
```

#### 4.4.7 Audit Logging

```env
ENABLE_AUDIT_LOGGING=true
AUDIT_LOG_RETENTION_DAYS=365
```

#### 4.4.8 Email Configuration (Opsional)

Jika ingin test fitur email (password reset, notifikasi):

```env
SMTP_HOST="smtp.gmail.com"
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER="your-email@gmail.com"
SMTP_PASSWORD="your-app-password"
SMTP_FROM="noreply@pembukuan.com"
APP_NAME="Pembukuan Kasir"
```

> ℹ️ **INFO**: Untuk Gmail, gunakan App Password, bukan password akun biasa. Panduan: https://support.google.com/accounts/answer/185833

#### 4.4.9 CORS Configuration

```env
ALLOWED_ORIGINS="http://localhost:3000,https://yourdomain.com"
```

#### 4.4.10 Default Admin User

```env
DEFAULT_ADMIN_USERNAME="admin"
DEFAULT_ADMIN_EMAIL="admin@pembukuan.com"
DEFAULT_ADMIN_PASSWORD="admin@12345"
```

> ⚠️ **KEAMANAN**: Password default ini hanya untuk development. Ganti segera setelah login pertama kali!

### 4.5 Verifikasi File .env

Pastikan file `.env` Anda memiliki minimal konfigurasi berikut:

```env
DATABASE_URL="postgresql://app_user:supersecretpassword@localhost:5432/app_db?schema=public"
FILE_STORAGE_MODE="local"
JWT_SECRET="<your-generated-secret>"
NODE_ENV="development"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
DEFAULT_ADMIN_USERNAME="admin"
DEFAULT_ADMIN_EMAIL="admin@pembukuan.com"
DEFAULT_ADMIN_PASSWORD="admin@12345"
```

> ✅ **SUCCESS**: Aplikasi sudah dikonfigurasi dan siap untuk migrasi database!

---

## 5. Migrasi Database

Setelah PostgreSQL dikonfigurasi dan environment variables diatur, langkah selanjutnya adalah menjalankan migrasi database untuk membuat schema dan tabel yang diperlukan aplikasi.

### 5.1 Apa itu Migrasi Database?

Migrasi database adalah proses untuk:

- Membuat tabel-tabel di database
- Menambah atau mengubah kolom
- Membuat relasi antar tabel
- Menambah index untuk performa
- Melacak perubahan schema dari waktu ke waktu

Aplikasi ini menggunakan **Prisma** sebagai ORM (Object-Relational Mapping) dan migration tool.

### 5.2 Generate Prisma Client

Sebelum menjalankan migrasi, generate Prisma Client terlebih dahulu:

```bash
npm run db:generate
```

**Output yang diharapkan:**

```
> pembukuan-kasir-dan-list@0.1.0 db:generate
> prisma generate

Prisma schema loaded from prisma\schema.prisma

✔ Generated Prisma Client (v6.18.0) to .\node_modules\@prisma\client in 150ms

Start by importing your Prisma Client (See: https://pris.ly/d/importing-client)
```

> ℹ️ **INFO**: Perintah ini membuat TypeScript types dan client API berdasarkan schema Prisma. Anda perlu menjalankan ini setiap kali mengubah `prisma/schema.prisma`.

### 5.3 Jalankan Migrasi

Jalankan migrasi untuk membuat semua tabel di database:

```bash
npm run db:migrate
```

**Output yang diharapkan:**

```
> pembukuan-kasir-dan-list@0.1.0 db:migrate
> prisma migrate dev

Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "app_db", schema "public" at "localhost:5432"

Applying migration `20251113171742_init`

The following migration(s) have been applied:

migrations/
  └─ 20251113171742_init/
    └─ migration.sql

Your database is now in sync with your schema.

✔ Generated Prisma Client (v6.18.0) to .\node_modules\@prisma\client in 120ms
```

> ✅ **SUCCESS**: Migrasi berhasil! Database schema sudah dibuat.

### 5.4 Verifikasi Migrasi

#### 5.4.1 Cek Status Migrasi

Untuk melihat status migrasi yang sudah dijalankan:

```bash
npx prisma migrate status
```

**Output yang diharapkan:**

```
Environment variables loaded from .env
Prisma schema loaded from prisma\schema.prisma
Datasource "db": PostgreSQL database "app_db", schema "public" at "localhost:5432"

Database schema is up to date!
```

#### 5.4.2 Verifikasi Tabel di Database

Masuk ke PostgreSQL dan cek tabel yang sudah dibuat:

```bash
wsl psql -h localhost -U app_user -d app_db
```

Di psql prompt, jalankan:

```sql
\dt
```

**Output yang diharapkan:**

```
                    List of relations
 Schema |            Name            | Type  |   Owner
--------+----------------------------+-------+----------
 public | AuditLog                   | table | app_user
 public | Driver                     | table | app_user
 public | Expense                    | table | app_user
 public | ExpenseFile                | table | app_user
 public | PasswordResetToken         | table | app_user
 public | ServicePackage             | table | app_user
 public | Staff                      | table | app_user
 public | Transaction                | table | app_user
 public | User                       | table | app_user
 public | Vehicle                    | table | app_user
 public | _prisma_migrations         | table | app_user
(11 rows)
```

Keluar dari psql dengan `\q`.

#### 5.4.3 Cek Detail Tabel (Opsional)

Untuk melihat struktur tabel tertentu:

```sql
\d Transaction
```

**Output yang diharapkan:**

```
                                            Table "public.Transaction"
        Column         |           Type           | Collation | Nullable |      Default
-----------------------+--------------------------+-----------+----------+-------------------
 id                    | text                     |           | not null |
 invoice_code          | text                     |           | not null |
 customer_name         | text                     |           | not null |
 customer_phone        | text                     |           | not null |
 package_id            | text                     |           | not null |
 vehicle_id            | text                     |           | not null |
 driver_id             | text                     |           | not null |
 ...
```

### 5.5 Memahami File Migrasi

File migrasi tersimpan di folder `prisma/migrations/`. Setiap migrasi memiliki:

- **Timestamp**: Waktu pembuatan (contoh: `20251113171742`)
- **Nama**: Deskripsi perubahan (contoh: `init`)
- **migration.sql**: SQL commands yang dijalankan

**Contoh struktur:**

```
prisma/
└── migrations/
    ├── 20251113171742_init/
    │   └── migration.sql
    ├── 20251114044541_add_custom_pricing/
    │   └── migration.sql
    └── migration_lock.toml
```

> ℹ️ **INFO**: File `migration_lock.toml` memastikan migrasi dijalankan dengan database provider yang sama (PostgreSQL).

### 5.6 Troubleshooting Migrasi

#### Problem 1: Error "connect ECONNREFUSED"

**Symptoms:**

```
Error: P1001: Can't reach database server at `localhost:5432`
```

**Penyebab:**

- PostgreSQL tidak berjalan di WSL
- DATABASE_URL salah
- Port tidak sesuai

**Solusi:**

1. Cek status PostgreSQL:

   ```bash
   wsl sudo service postgresql status
   ```

2. Start jika tidak berjalan:

   ```bash
   wsl sudo service postgresql start
   ```

3. Verifikasi DATABASE_URL di `.env`:

   ```env
   DATABASE_URL="postgresql://app_user:supersecretpassword@localhost:5432/app_db?schema=public"
   ```

4. Test koneksi manual:
   ```bash
   wsl psql -h localhost -U app_user -d app_db
   ```

#### Problem 2: Error "password authentication failed"

**Symptoms:**

```
Error: P1001: Authentication failed against database server at `localhost`
```

**Penyebab:**

- Password salah di DATABASE_URL
- User tidak ada
- pg_hba.conf tidak dikonfigurasi dengan benar

**Solusi:**

1. Verifikasi password di `.env` sesuai dengan yang dibuat di PostgreSQL

2. Cek user exists:

   ```bash
   wsl sudo -u postgres psql -c "\du"
   ```

3. Reset password jika perlu:

   ```bash
   wsl sudo -u postgres psql -c "ALTER USER app_user WITH PASSWORD 'supersecretpassword';"
   ```

4. Verifikasi pg_hba.conf:
   ```bash
   wsl sudo nano /etc/postgresql/14/main/pg_hba.conf
   ```
   Pastikan ada baris:
   ```
   host    all             all             127.0.0.1/32            md5
   ```

#### Problem 3: Error "relation already exists"

**Symptoms:**

```
Error: P3005: The database schema is not empty. Read more about how to baseline an existing production database: https://pris.ly/d/migrate-baseline
```

**Penyebab:**

- Database sudah memiliki tabel
- Migrasi sudah pernah dijalankan sebagian
- Ada tabel manual yang dibuat

**Solusi:**

**Opsi 1: Reset Database (Development Only)**

> ⚠️ **WARNING**: Ini akan menghapus SEMUA data!

```bash
npm run db:reset
```

Kemudian jalankan migrasi lagi:

```bash
npm run db:migrate
```

**Opsi 2: Baseline Existing Database**

Jika Anda ingin mempertahankan data yang ada:

```bash
npx prisma migrate resolve --applied 20251113171742_init
```

Ganti `20251113171742_init` dengan nama migrasi yang sudah ada.

**Opsi 3: Drop Manual Tables**

Jika ada tabel yang dibuat manual, drop terlebih dahulu:

```bash
wsl psql -h localhost -U app_user -d app_db -c "DROP TABLE IF EXISTS table_name CASCADE;"
```

#### Problem 4: Error "migration failed"

**Symptoms:**

```
Error: Migration failed to apply cleanly to the shadow database.
```

**Penyebab:**

- SQL syntax error di migration file
- Constraint violation
- Schema drift

**Solusi:**

1. Cek status migrasi:

   ```bash
   npx prisma migrate status
   ```

2. Lihat detail error di output

3. Jika migrasi gagal di tengah jalan, mark sebagai rolled back:

   ```bash
   npx prisma migrate resolve --rolled-back <migration-name>
   ```

4. Perbaiki migration file di `prisma/migrations/` jika perlu

5. Jalankan ulang:
   ```bash
   npm run db:migrate
   ```

#### Problem 5: Error "shadow database"

**Symptoms:**

```
Error: A migration failed when applied to the shadow database.
```

**Penyebab:**

- Prisma tidak bisa membuat temporary shadow database
- User tidak memiliki permission CREATE DATABASE

**Solusi:**

1. Berikan permission CREATE DATABASE ke user:

   ```bash
   wsl sudo -u postgres psql -c "ALTER USER app_user CREATEDB;"
   ```

2. Atau disable shadow database (tidak direkomendasikan):
   ```bash
   npx prisma migrate dev --skip-generate --skip-seed
   ```

#### Problem 6: Migrasi Stuck atau Hanging

**Symptoms:**

- Command tidak selesai
- Tidak ada output
- Process tidak respond

**Solusi:**

1. Cancel dengan `Ctrl+C`

2. Cek apakah ada lock di database:

   ```bash
   wsl psql -h localhost -U app_user -d app_db -c "SELECT * FROM pg_locks WHERE NOT granted;"
   ```

3. Kill process yang lock (jika ada):

   ```bash
   wsl sudo -u postgres psql -c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = 'app_db' AND pid <> pg_backend_pid();"
   ```

4. Jalankan ulang migrasi

### 5.7 Verifikasi Koneksi Database

Sebelum atau setelah menjalankan migrasi, Anda bisa memverifikasi koneksi database menggunakan script khusus:

```bash
npm run db:check
```

**Output yang diharapkan**:

```
🔍 Checking database connection...

1️⃣  Testing basic connection...
✅ Database connected successfully

2️⃣  Testing query execution...
✅ Query executed successfully
   Time: 2025-11-20 14:30:45.123+07
   Version: PostgreSQL 14.x on x86_64-pc-linux-gnu

3️⃣  Checking database tables...
✅ Found 11 tables:
   - AuditLog
   - Driver
   - Expense
   - ExpenseFile
   - PasswordResetToken
   - ServicePackage
   - Staff
   - Transaction
   - User
   - Vehicle
   - _prisma_migrations

4️⃣  Verifying critical tables...
✅ All critical tables exist

5️⃣  Checking database size...
✅ Database size: 8192 kB

6️⃣  Checking active connections...
✅ Active connections: 3

✅ All database checks passed!

📊 Summary:
   - Connection: OK
   - Tables: 11 found
   - Database size: 8192 kB
   - Active connections: 3

🔌 Disconnected from database
```

**Kapan menggunakan `npm run db:check`**:

- Setelah setup PostgreSQL untuk memastikan koneksi berhasil
- Sebelum menjalankan migrasi untuk verifikasi database siap
- Saat troubleshooting masalah koneksi
- Untuk monitoring kesehatan database
- Sebelum deploy untuk memastikan database production siap

**Troubleshooting dengan db:check**:

Jika koneksi gagal, script akan memberikan informasi error dan saran troubleshooting:

```
❌ Database connection failed!

Error details:
   Message: Can't reach database server at `localhost:5432`
   Code: P1001

💡 Troubleshooting:
   - Check if PostgreSQL is running
   - Verify DATABASE_URL in .env file
   - Check network connectivity
```

### 5.8 Command Reference

| Command                      | Deskripsi                                  |
| ---------------------------- | ------------------------------------------ |
| `npm run db:check`           | Verifikasi koneksi dan kesehatan database  |
| `npm run db:generate`        | Generate Prisma Client                     |
| `npm run db:migrate`         | Jalankan migrasi (development)             |
| `npm run db:migrate:deploy`  | Jalankan migrasi (production)              |
| `npx prisma migrate status`  | Cek status migrasi                         |
| `npx prisma migrate resolve` | Mark migrasi sebagai applied/rolled back   |
| `npx prisma migrate reset`   | Reset database dan jalankan ulang migrasi  |
| `npx prisma db push`         | Push schema tanpa membuat migration file   |
| `npx prisma studio`          | Buka Prisma Studio (GUI untuk database)    |
| `npm run db:reset`           | Reset database (WARNING: hapus semua data) |

### 5.9 Best Practices

1. **Selalu backup database** sebelum menjalankan migrasi di production
2. **Test migrasi** di development environment terlebih dahulu
3. **Jangan edit migration files** yang sudah dijalankan
4. **Commit migration files** ke version control
5. **Generate Prisma Client** setelah setiap perubahan schema
6. **Cek migration status** sebelum deploy
7. **Verifikasi koneksi database** dengan `npm run db:check` sebelum operasi penting

> ✅ **SUCCESS**: Database sudah siap! Langkah selanjutnya adalah seeding data untuk testing.

---

## 6. Seeding Database

Setelah migrasi database berhasil, langkah selanjutnya adalah mengisi database dengan data awal (seeding) untuk keperluan testing. Aplikasi ini menyediakan **3 pilihan seed script** dengan tujuan yang berbeda.

### 6.1 Apa itu Database Seeding?

Database seeding adalah proses mengisi database dengan data awal yang diperlukan untuk:

- **Testing aplikasi**: Data sample untuk menguji semua fitur
- **Development**: Data realistis untuk development
- **Demo**: Data lengkap untuk presentasi atau demo

### 6.2 Pilihan Seed Script

Aplikasi ini menyediakan 3 seed script dengan tingkat kelengkapan data yang berbeda:

| Script            | Command                    | Data yang Dibuat                                  | Kapan Digunakan                |
| ----------------- | -------------------------- | ------------------------------------------------- | ------------------------------ |
| **seed-admin**    | `npm run db:seed-admin`    | Hanya user admin                                  | Setup cepat, hanya perlu login |
| **seed-master**   | `npm run db:seed-master`   | Admin + Master data (paket, armada, sopir, staff) | Testing CRUD master data       |
| **seed-complete** | `npm run db:seed-complete` | Semua data + transaksi + pengeluaran              | Testing lengkap semua fitur    |

### 6.3 Seed Script 1: Admin Only (seed-admin)

**Tujuan**: Membuat user admin saja, tanpa data lainnya.

**Kapan digunakan**:

- Anda hanya perlu login ke aplikasi
- Anda ingin membuat data sendiri secara manual
- Setup paling cepat (< 1 detik)

**Command**:

```bash
npm run db:seed-admin
```

**Output yang diharapkan**:

```
> pembukuan-kasir-dan-list@0.1.0 db:seed-admin
> node prisma/seed-admin.js

🌱 Seeding default admin user...
✅ Default admin user created successfully!

📋 Credentials:
   Username: admin
   Email: admin@pembukuan.com
   Password: admin@12345

⚠️  IMPORTANT: Change the default password immediately after first login!
```

**Data yang dibuat**:

- **1 User Admin**
  - Username: `admin`
  - Email: `admin@pembukuan.com`
  - Password: `admin@12345`
  - Role: `ADMIN`

> ⚠️ **KEAMANAN**: Password default `admin@12345` hanya untuk development! Ganti segera setelah login pertama kali di production.

**Verifikasi**:

```bash
wsl psql -h localhost -U app_user -d app_db -c "SELECT username, email, role FROM \"User\";"
```

**Output yang diharapkan**:

```
 username |         email          | role
----------+------------------------+-------
 admin    | admin@pembukuan.com    | ADMIN
(1 row)
```

---

### 6.4 Seed Script 2: Master Data (seed-master)

**Tujuan**: Membuat admin + semua master data yang diperlukan untuk operasional.

**Kapan digunakan**:

- Anda ingin testing CRUD untuk master data
- Anda perlu data paket, armada, sopir, dan staff
- Anda tidak perlu transaksi atau pengeluaran
- Setup sedang (2-3 detik)

**Command**:

```bash
npm run db:seed-master
```

**Output yang diharapkan**:

```
> pembukuan-kasir-dan-list@0.1.0 db:seed-master
> node prisma/seed-master.js

🌱 Starting master data seeding...

🧹 Cleaning existing master data...
✅ Master data cleaned

👥 Creating users...
✅ Created Administrator (ADMIN)
✅ Created Operator (OPERATOR)

📦 Creating service packages...
✅ Created Sewa Mobil 12 Jam (CAR_RENTAL)
✅ Created Sewa Mobil 24 Jam (Full Day) (CAR_RENTAL)
✅ Created Sewa Mobil 6 Jam (Half Day) (CAR_RENTAL)
✅ Created Sewa Mobil Luar Kota (CAR_RENTAL)
✅ Created Airport Transfer (Antar/Jemput) (CAR_RENTAL)
✅ Created Sewa Bulanan Karyawan (CAR_RENTAL)
✅ Created Paket Wedding Car (CAR_RENTAL)
✅ Created Wisata Yogyakarta 4 Hari 3 Malam (TOUR_PACKAGE)
✅ Created City Tour Jakarta (TOUR_PACKAGE)

🚗 Creating armada...
✅ Created vehicle: B 1234 ABC (Innova Reborn 2020)
✅ Created vehicle: B 5678 DEF (Innova Reborn 2019)
✅ Created vehicle: B 9012 GHI (Hi-Ace 2021)
✅ Created vehicle: B 3456 JKL (Avanza 2022)

👨‍✈️ Creating drivers...
✅ Created driver: Budi Santoso
✅ Created driver: Ahmad Wijaya
✅ Created driver: Dedi Kurniawan
✅ Created driver: Eko Prasetyo

👔 Creating staff...
✅ Created staff: Siti Rahayu (Admin)
✅ Created staff: Andi Firmansyah (Finance)
✅ Created staff: Maya Sari (Operations)
✅ Created staff: Rudi Hartono (Mechanic)
✅ Created staff: Nina Putri (Marketing)

🎉 Master data seeding completed!
📊 Summary:
   👥 Users: 2 (Admin, Operator)
   📦 Service Packages: 9 (7 CAR_RENTAL + 2 TOUR_PACKAGE)
   🚗 Vehicles: 4
   👨‍✈️ Drivers: 4
   👔 Staff: 5

💡 Next steps:
   • Run 'npm run db:migrate' to apply schema changes
   • Start the application with 'npm run dev'
   • Use seed-complete.js for full data with transactions & expenses
```

**Data yang dibuat**:

1. **2 Users**:
   - Admin: `admin` / `admin@12345` (ADMIN)
   - Operator: `operator` / `password123` (OPERATOR)

2. **9 Service Packages**:
   - 7 CAR_RENTAL packages (12 jam, 24 jam, 6 jam, luar kota, airport, bulanan, wedding)
   - 2 TOUR_PACKAGE (Yogyakarta 4H3M, City Tour Jakarta)

3. **4 Vehicles (Armada)**:
   - B 1234 ABC - Toyota Innova Reborn 2020 (READY)
   - B 5678 DEF - Toyota Innova Reborn 2019 (READY)
   - B 9012 GHI - Toyota Hi-Ace 2021 (READY)
   - B 3456 JKL - Toyota Avanza 2022 (READY)

4. **4 Drivers**:
   - Budi Santoso (READY)
   - Ahmad Wijaya (READY)
   - Dedi Kurniawan (READY)
   - Eko Prasetyo (READY)

5. **5 Staff**:
   - Siti Rahayu (Admin)
   - Andi Firmansyah (Finance)
   - Maya Sari (Operations)
   - Rudi Hartono (Mechanic)
   - Nina Putri (Marketing)

**Verifikasi**:

```bash
# Cek jumlah data
wsl psql -h localhost -U app_user -d app_db -c "
SELECT
  (SELECT COUNT(*) FROM \"User\") as users,
  (SELECT COUNT(*) FROM \"ServicePackage\") as packages,
  (SELECT COUNT(*) FROM \"Armada\") as vehicles,
  (SELECT COUNT(*) FROM \"Driver\") as drivers,
  (SELECT COUNT(*) FROM \"Staff\") as staff;
"
```

**Output yang diharapkan**:

```
 users | packages | vehicles | drivers | staff
-------+----------+----------+---------+-------
     2 |        9 |        4 |       4 |     5
(1 row)
```

---

### 6.5 Seed Script 3: Complete Data (seed-complete)

**Tujuan**: Membuat semua data termasuk transaksi dan pengeluaran untuk testing lengkap.

**Kapan digunakan**:

- Anda ingin testing semua fitur aplikasi
- Anda perlu data transaksi dan pengeluaran untuk testing laporan
- Anda ingin demo aplikasi dengan data realistis
- Setup lengkap (5-10 detik)

**Command**:

```bash
npm run db:seed-complete
```

**Output yang diharapkan**:

```
> pembukuan-kasir-dan-list@0.1.0 db:seed-complete
> node prisma/seed-complete.js

🌱 Starting complete database seeding...

🧹 Cleaning existing data...
✅ Database cleaned

👥 Creating users...
✅ Created Administrator (ADMIN)

📦 Creating service packages...
✅ Created package: Sewa Mobil 12 Jam
✅ Created package: Sewa Mobil 24 Jam (Full Day)
✅ Created package: Sewa Mobil Luar Kota
✅ Created package: Sewa Mobil 6 Jam (Half Day)
✅ Created package: Airport Transfer (Antar/Jemput)
✅ Created package: Paket Wedding Car
✅ Created package: City Tour Jakarta
✅ Created package: Sewa Bulanan Karyawan
✅ Created package: Paket Pernikahan Custom
✅ Created package: Paket Wisata Custom
✅ Created package: Paket Korporasi Custom

🚗 Creating armada...
✅ Created vehicle: B 1234 ABC (Innova Reborn 2020)
✅ Created vehicle: B 5678 DEF (Innova Reborn 2019)
✅ Created vehicle: B 9012 GHI (Hi-Ace 2021)
✅ Created vehicle: B 3456 JKL (Avanza 2022)

👨‍✈️ Creating drivers...
✅ Created driver: Budi Santoso
✅ Created driver: Ahmad Wijaya
✅ Created driver: Dedi Kurniawan
✅ Created driver: Eko Prasetyo

👔 Creating staff...
✅ Created staff: Siti Rahayu (Admin)
✅ Created staff: Andi Firmansyah (Finance)
✅ Created staff: Rudi Hartono (Mekanik)
✅ Created staff: Nina Kusuma (Customer Service)
✅ Created staff: Dimas Prasetya (Operasional)
✅ Created staff: Lina Marlina (HR)
✅ Created staff: Bambang Suryadi (IT Support)
✅ Created staff: Fitri Handayani (Marketing)

💰 Creating transactions for Oktober 2025...
✅ Created transaction: PT. Maju Bersama (Rp 500,000)
✅ Created transaction: Keluarga Bpk. Wijaya (Rp 800,000)
✅ Created transaction: Rombongan Wisata Keluarga (Rp 1,200,000)
✅ Created transaction: CV. Global Tour (Rp 1,500,000)
✅ Created transaction: Wedding Organizer Indah (Rp 500,000)
✅ Created transaction: Ibu Siti Nurjanah (Rp 800,000)

💰 Creating transactions for November 2025...
✅ Created transaction: Event Organizer Prima (Rp 500,000)
✅ Created transaction: PT. Berkah Sejahtera (Rp 800,000, DP: Rp 400,000)
✅ Created transaction: Keluarga Ibu Ratna (Rp 1,200,000, DP: Rp 300,000)

🎯 Creating TOUR_PACKAGE transactions...
✅ Created TOUR_PACKAGE transaction: Rombongan Wisata Bali Indah (Bali 3H, 5 pax, Rp 11,000,000)
✅ Created TOUR_PACKAGE transaction: Keluarga Besar Pak Budi (Yogyakarta 4H, 8 pax, Rp 18,400,000)
✅ Created TOUR_PACKAGE transaction: Komunitas Photography Jakarta (Bandung 2H, 12 pax, Rp 16,800,000)
✅ Created TOUR_PACKAGE transaction: Pak Ahmad & Ibu Siti (Bali 3H VIP, 2 pax, Rp 9,000,000)

📝 Creating expenses for Oktober 2025...
✅ Created 16 expense records for Oktober 2025

📝 Creating expenses for November 2025...
✅ Created 6 expense records for November 2025


🎉 Database seeding completed successfully!

📊 SUMMARY:
─────────────────────────────────────────
✅ Users created: 1 (1 Admin)
✅ Service packages: 11 (8 CAR_RENTAL + 3 TOUR_PACKAGE)
✅ Vehicles (Armada): 4
✅ Drivers: 4
✅ Staff: 8
✅ Transactions Oktober: 6 (all PAID)
✅ Transactions November: 7 (1 UNPAID, 2 DOWN_PAYMENT, 4 TOUR_PACKAGE)
✅ Total Transactions: 13
✅ Expenses Oktober: 16
✅ Expenses November: 6
✅ Total Expenses: 22
✅ TOUR_PACKAGE Features:
   - Bali Tour (3H/2N): 3 hotel tiers, 5+ price ranges each
   - Yogyakarta Tour (4H/3N): 3 hotel tiers, 5+ price ranges each
   - Bandung Tour (2H/1N): 3 hotel tiers, 5+ price ranges each
   - Complete itineraries with day-by-day activities
─────────────────────────────────────────
```

**Data yang dibuat**:

1. **1 User Admin**:
   - Username: `admin`
   - Password: `admin@12345`
   - Role: ADMIN

2. **11 Service Packages**:
   - 8 CAR_RENTAL packages (berbagai durasi dan tipe)
   - 3 TOUR_PACKAGE lengkap dengan hotel tiers dan itinerary

3. **4 Vehicles (Armada)**:
   - Toyota Innova Reborn 2020 & 2019
   - Toyota Hi-Ace 2021
   - Toyota Avanza 2022

4. **4 Drivers**:
   - Dengan status READY dan ON_TRIP

5. **8 Staff**:
   - Berbagai posisi (Admin, Finance, Mekanik, CS, Operasional, HR, IT, Marketing)
   - Status ACTIVE dan INACTIVE

6. **13 Transactions**:
   - 6 transaksi Oktober 2025 (semua PAID)
   - 3 transaksi November 2025 (CAR_RENTAL dengan berbagai status)
   - 4 transaksi TOUR_PACKAGE (Bali, Yogyakarta, Bandung)
   - Berbagai payment status: PAID, UNPAID, DOWN_PAYMENT

7. **22 Expenses**:
   - 16 pengeluaran Oktober 2025
   - 6 pengeluaran November 2025
   - Kategori: BBM, GAJI_SOPIR, PERAWATAN_ARMADA, OPERASIONAL_LAINNYA, LISTRIK

**Verifikasi**:

```bash
# Cek semua data
wsl psql -h localhost -U app_user -d app_db -c "
SELECT
  (SELECT COUNT(*) FROM \"User\") as users,
  (SELECT COUNT(*) FROM \"ServicePackage\") as packages,
  (SELECT COUNT(*) FROM \"Armada\") as vehicles,
  (SELECT COUNT(*) FROM \"Driver\") as drivers,
  (SELECT COUNT(*) FROM \"Staff\") as staff,
  (SELECT COUNT(*) FROM \"Transaction\") as transactions,
  (SELECT COUNT(*) FROM \"Expense\") as expenses;
"
```

**Output yang diharapkan**:

```
 users | packages | vehicles | drivers | staff | transactions | expenses
-------+----------+----------+---------+-------+--------------+----------
     1 |       11 |        4 |       4 |     8 |           13 |       22
(1 row)
```

---

### 6.6 Kredensial Default

Semua seed script membuat user admin dengan kredensial yang sama:

| Field        | Value                 |
| ------------ | --------------------- |
| **Username** | `admin`               |
| **Email**    | `admin@pembukuan.com` |
| **Password** | `admin@12345`         |
| **Role**     | `ADMIN`               |

> ⚠️ **PERINGATAN KEAMANAN**:
>
> Password default `admin@12345` **HANYA untuk development dan testing**!
>
> **WAJIB ganti password** segera setelah:
>
> - Login pertama kali
> - Sebelum deploy ke production
> - Sebelum memberikan akses ke orang lain
>
> Cara ganti password:
>
> 1. Login dengan kredensial default
> 2. Klik menu user di pojok kanan atas
> 3. Pilih "Change Password"
> 4. Masukkan password baru yang kuat (min 8 karakter, kombinasi huruf, angka, simbol)

---

### 6.7 Memilih Seed Script yang Tepat

**Decision Tree**:

```
Apakah Anda perlu data transaksi dan pengeluaran?
├─ TIDAK → Apakah Anda perlu master data (paket, armada, sopir)?
│          ├─ TIDAK → Gunakan seed-admin (paling cepat)
│          └─ YA → Gunakan seed-master
└─ YA → Gunakan seed-complete (paling lengkap)
```

**Rekomendasi berdasarkan use case**:

| Use Case                   | Seed Script     | Alasan                                           |
| -------------------------- | --------------- | ------------------------------------------------ |
| Hanya perlu login          | `seed-admin`    | Paling cepat, minimal data                       |
| Testing CRUD master data   | `seed-master`   | Ada data paket, armada, sopir, staff             |
| Testing workflow transaksi | `seed-complete` | Ada transaksi dengan berbagai status             |
| Testing laporan keuangan   | `seed-complete` | Ada transaksi dan pengeluaran                    |
| Testing approval workflow  | `seed-complete` | Ada transaksi dengan status UNPAID, DOWN_PAYMENT |
| Demo aplikasi              | `seed-complete` | Data paling lengkap dan realistis                |
| Development baru           | `seed-admin`    | Buat data sendiri sesuai kebutuhan               |

---

### 6.8 Menjalankan Ulang Seed Script

**Jika seed script sudah pernah dijalankan**:

Seed script akan **menghapus semua data** sebelum membuat data baru. Ini aman untuk development, tapi **HATI-HATI di production**!

**Perilaku setiap script**:

1. **seed-admin**:
   - Cek apakah admin sudah ada
   - Jika sudah ada, skip (tidak menghapus)
   - Jika belum ada, buat admin baru

2. **seed-master**:
   - **Menghapus semua data** (users, packages, vehicles, drivers, staff, transactions, expenses)
   - Membuat data master baru

3. **seed-complete**:
   - **Menghapus semua data** (users, packages, vehicles, drivers, staff, transactions, expenses)
   - Membuat semua data baru

> ⚠️ **WARNING**: `seed-master` dan `seed-complete` akan **menghapus SEMUA data** di database! Backup dulu jika ada data penting.

**Cara aman menjalankan ulang**:

```bash
# 1. Backup database dulu (opsional tapi direkomendasikan)
wsl pg_dump -U app_user -h localhost app_db > backup_$(date +%Y%m%d_%H%M%S).sql

# 2. Jalankan seed script
npm run db:seed-complete

# 3. Jika ada masalah, restore dari backup
wsl psql -U app_user -h localhost app_db < backup_20251119_143000.sql
```

---

### 6.9 Troubleshooting Seeding

#### Problem 1: Error "User already exists"

**Symptoms** (hanya untuk seed-admin):

```
⚠️  Admin user already exists. Skipping...
   Username: admin
   Email: admin@pembukuan.com
```

**Penyebab**:

- Admin user sudah dibuat sebelumnya
- Ini bukan error, hanya informasi

**Solusi**:

- Tidak perlu action, admin sudah ada
- Jika ingin reset, gunakan `npm run db:reset` lalu seed ulang

#### Problem 2: Error "Foreign key constraint"

**Symptoms**:

```
Error: Foreign key constraint failed on the field: `armadaId`
```

**Penyebab**:

- Ada data orphan (transaksi tanpa armada, dll)
- Database tidak bersih sebelum seeding

**Solusi**:

```bash
# Reset database dan jalankan ulang
npm run db:reset
npm run db:migrate
npm run db:seed-complete
```

#### Problem 3: Seed script hang atau lambat

**Symptoms**:

- Script tidak selesai-selesai
- Tidak ada output

**Penyebab**:

- Database connection timeout
- PostgreSQL overloaded

**Solusi**:

1. Cancel dengan `Ctrl+C`

2. Restart PostgreSQL:

   ```bash
   wsl sudo service postgresql restart
   ```

3. Jalankan ulang seed script

#### Problem 4: Error "Unique constraint failed"

**Symptoms**:

```
Error: Unique constraint failed on the fields: (`username`)
```

**Penyebab**:

- Data dengan username/email yang sama sudah ada
- Seed script tidak menghapus data lama

**Solusi**:

**Opsi 1: Reset database** (menghapus semua data):

```bash
npm run db:reset
npm run db:migrate
npm run db:seed-complete
```

**Opsi 2: Hapus data manual**:

```bash
wsl psql -h localhost -U app_user -d app_db -c "DELETE FROM \"User\" WHERE username = 'admin';"
```

Lalu jalankan seed script lagi.

#### Problem 5: Error "Cannot read property of undefined"

**Symptoms**:

```
TypeError: Cannot read property 'id' of undefined
```

**Penyebab**:

- Seed script gagal membuat data sebelumnya
- Referensi ke data yang tidak ada

**Solusi**:

1. Cek output seed script, lihat di mana error pertama kali muncul

2. Reset database:

   ```bash
   npm run db:reset
   npm run db:migrate
   ```

3. Jalankan seed script lagi dengan output verbose:

   ```bash
   npm run db:seed-complete 2>&1 | tee seed-output.log
   ```

4. Jika masih error, cek file `seed-output.log` untuk detail error

---

### 6.10 Verifikasi Data Seeding

Setelah seeding berhasil, verifikasi data dengan cara berikut:

#### Verifikasi via psql

```bash
# Masuk ke database
wsl psql -h localhost -U app_user -d app_db

# Cek semua tabel
\dt

# Cek jumlah data di setiap tabel
SELECT
  'User' as table_name, COUNT(*) as count FROM "User"
UNION ALL
SELECT 'ServicePackage', COUNT(*) FROM "ServicePackage"
UNION ALL
SELECT 'Armada', COUNT(*) FROM "Armada"
UNION ALL
SELECT 'Driver', COUNT(*) FROM "Driver"
UNION ALL
SELECT 'Staff', COUNT(*) FROM "Staff"
UNION ALL
SELECT 'Transaction', COUNT(*) FROM "Transaction"
UNION ALL
SELECT 'Expense', COUNT(*) FROM "Expense";

# Keluar
\q
```

#### Verifikasi via Prisma Studio

Prisma Studio adalah GUI untuk melihat dan mengedit data database:

```bash
npm run db:studio
```

Browser akan otomatis terbuka di `http://localhost:5555` dengan interface visual untuk melihat semua data.

#### Verifikasi via Aplikasi

1. Start aplikasi:

   ```bash
   npm run dev
   ```

2. Buka browser: `http://localhost:3000`

3. Login dengan kredensial admin:
   - Username: `admin`
   - Password: `admin@12345`

4. Cek setiap menu:
   - Dashboard: Lihat statistik
   - Paket: Lihat service packages
   - Armada: Lihat vehicles
   - Sopir: Lihat drivers
   - Staff: Lihat staff
   - Transaksi: Lihat transactions (jika seed-complete)
   - Pengeluaran: Lihat expenses (jika seed-complete)
   - Laporan: Generate reports (jika seed-complete)

---

### 6.11 Command Reference

| Command                    | Deskripsi          | Data yang Dibuat                      | Waktu      |
| -------------------------- | ------------------ | ------------------------------------- | ---------- |
| `npm run db:check`         | Cek koneksi DB     | -                                     | < 1 detik  |
| `npm run db:seed-admin`    | Seed admin only    | 1 admin user                          | < 1 detik  |
| `npm run db:seed-master`   | Seed master data   | Admin + master data (no transactions) | 2-3 detik  |
| `npm run db:seed-complete` | Seed complete data | Semua data + transactions + expenses  | 5-10 detik |
| `npm run db:reset`         | Reset database     | Menghapus semua data dan migrasi      | 5-10 detik |
| `npm run db:studio`        | Open Prisma Studio | -                                     | -          |

---

> ✅ **SUCCESS**: Database sudah terisi dengan data testing! Langkah selanjutnya adalah konfigurasi file storage.

---

## 7. Konfigurasi Penyimpanan File

Aplikasi Pembukuan Kasir & List memerlukan penyimpanan file untuk:

- **Upload bukti pengeluaran** (foto struk, invoice, dll)
- **Avatar user** (foto profil)
- **Dokumen transaksi** (opsional)

Secara default, aplikasi menggunakan **MinIO** (S3-compatible object storage) untuk penyimpanan file. Namun, untuk keperluan E2E testing tanpa MinIO, aplikasi mendukung **local filesystem storage** sebagai alternatif.

### 7.1 Apa itu FILE_STORAGE_MODE?

`FILE_STORAGE_MODE` adalah environment variable yang menentukan cara aplikasi menyimpan file upload.

**Pilihan mode**:

| Mode      | Deskripsi                                 | Kapan Digunakan                  |
| --------- | ----------------------------------------- | -------------------------------- |
| `"minio"` | Menyimpan file di MinIO object storage    | Production, deployment dengan S3 |
| `"local"` | Menyimpan file di local filesystem (disk) | Development, testing tanpa MinIO |

**Untuk E2E testing tanpa MinIO**, kita akan menggunakan mode `"local"`.

### 7.2 Konfigurasi Mode Local

#### 7.2.1 Set Environment Variable

Buka file `.env` dan pastikan `FILE_STORAGE_MODE` diset ke `"local"`:

```env
FILE_STORAGE_MODE="local"
```

> ℹ️ **INFO**: Jika Anda sudah mengikuti langkah [4.4.2 File Storage Configuration](#442-file-storage-configuration), setting ini sudah ada di file `.env` Anda.

#### 7.2.2 Verifikasi Setting

Cek apakah setting sudah benar:

**Di Windows (PowerShell)**:

```powershell
Get-Content .env | Select-String "FILE_STORAGE_MODE"
```

**Di Windows (CMD)**:

```cmd
findstr "FILE_STORAGE_MODE" .env
```

**Output yang diharapkan**:

```
FILE_STORAGE_MODE="local"
```

### 7.3 Membuat Direktori Upload

Saat menggunakan mode `"local"`, aplikasi akan menyimpan file di direktori berikut:

```
public/
├── uploads/     # File upload pengeluaran (bukti, invoice, dll)
└── avatars/     # Avatar user (foto profil)
```

#### 7.3.1 Cek Apakah Direktori Sudah Ada

```bash
dir public
```

Atau di PowerShell:

```powershell
Get-ChildItem public
```

**Output yang diharapkan**:

```
    Directory: C:\path\to\pembukuan-kasir-dan-list\public

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        11/19/2025   2:30 PM                avatars
d-----        11/19/2025   2:30 PM                uploads
-a----        11/13/2025  10:15 AM           1234 file.svg
-a----        11/13/2025  10:15 AM           5678 globe.svg
...
```

#### 7.3.2 Membuat Direktori (Jika Belum Ada)

**Di Windows (CMD)**:

```cmd
mkdir public\uploads
mkdir public\avatars
```

**Di Windows (PowerShell)**:

```powershell
New-Item -ItemType Directory -Path "public\uploads" -Force
New-Item -ItemType Directory -Path "public\avatars" -Force
```

**Di WSL/Linux** (jika menjalankan dari WSL):

```bash
mkdir -p public/uploads public/avatars
```

**Output yang diharapkan**:

```
Directory: C:\path\to\pembukuan-kasir-dan-list\public

Mode                 LastWriteTime         Length Name
----                 -------------         ------ ----
d-----        11/19/2025   3:45 PM                avatars
d-----        11/19/2025   3:45 PM                uploads
```

> ✅ **SUCCESS**: Direktori upload berhasil dibuat!

### 7.4 Struktur Direktori File Storage

Setelah direktori dibuat, struktur lengkap akan terlihat seperti ini:

```
pembukuan-kasir-dan-list/
├── public/
│   ├── uploads/              # File upload pengeluaran
│   │   ├── .gitkeep         # Placeholder agar folder ter-commit ke git
│   │   └── expense-*.jpg    # File upload akan tersimpan di sini
│   ├── avatars/              # Avatar user
│   │   ├── .gitkeep         # Placeholder agar folder ter-commit ke git
│   │   └── user-*.jpg       # Avatar akan tersimpan di sini
│   ├── file.svg
│   ├── globe.svg
│   └── ...
└── ...
```

**Penjelasan**:

- **`public/uploads/`**: Menyimpan semua file yang diupload untuk pengeluaran (expense)
  - Format nama file: `expense-[uuid]-[uuid].[ext]`
  - Contoh: `expense-a4d3c763-dd6b-464b-aa50-5637c187b614-a791db28-26e4-4cb3-8844-cdf8c918e24d.png`

- **`public/avatars/`**: Menyimpan avatar user
  - Format nama file: `user-[uuid].[ext]`
  - Contoh: `user-123e4567-e89b-12d3-a456-426614174000.jpg`

- **`.gitkeep`**: File placeholder kosong agar folder kosong bisa di-commit ke git
  - Folder kosong tidak bisa di-commit ke git
  - `.gitkeep` memastikan folder structure tetap ada di repository

### 7.5 File Permissions

#### 7.5.1 Windows

Di Windows, biasanya tidak perlu setting permission khusus. Aplikasi Next.js yang berjalan dengan user Anda akan otomatis memiliki akses read/write ke folder `public/`.

**Verifikasi akses**:

```powershell
# Test write access
echo "test" > public\uploads\test.txt

# Test read access
Get-Content public\uploads\test.txt

# Cleanup
Remove-Item public\uploads\test.txt
```

**Output yang diharapkan**:

```
test
```

Jika berhasil, berarti aplikasi bisa read/write ke folder uploads.

#### 7.5.2 WSL/Linux (Jika Menjalankan dari WSL)

Jika Anda menjalankan aplikasi dari WSL, pastikan permission folder sudah benar:

```bash
# Set permission agar bisa read/write
chmod 755 public/uploads public/avatars

# Verifikasi permission
ls -la public/ | grep -E "uploads|avatars"
```

**Output yang diharapkan**:

```
drwxr-xr-x  2 username username 4096 Nov 19 15:30 avatars
drwxr-xr-x  2 username username 4096 Nov 19 15:30 uploads
```

> ℹ️ **INFO**: Permission `755` berarti:
>
> - Owner (user): read, write, execute (7)
> - Group: read, execute (5)
> - Others: read, execute (5)

### 7.6 Verifikasi Konfigurasi File Storage

Setelah semua setup selesai, verifikasi bahwa konfigurasi file storage sudah benar:

#### 7.6.1 Checklist Verifikasi

- [ ] `FILE_STORAGE_MODE="local"` ada di file `.env`
- [ ] Folder `public/uploads/` sudah dibuat
- [ ] Folder `public/avatars/` sudah dibuat
- [ ] Aplikasi bisa write ke folder uploads (test dengan echo)
- [ ] Aplikasi bisa read dari folder uploads (test dengan cat/type)

#### 7.6.2 Test Upload via API (Opsional)

Jika aplikasi sudah running, Anda bisa test upload file via API endpoint:

```bash
npm run dev
```

Tunggu aplikasi start, lalu test upload:

**Di PowerShell**:

```powershell
# Buat test file
echo "test content" > test-upload.txt

# Upload via API (setelah login)
# Endpoint: POST /api/test-storage
# (Lihat src/app/api/test-storage/route.js untuk detail)
```

> ℹ️ **INFO**: Testing upload lengkap akan dilakukan di section [11. Testing Workflow Pengeluaran](#11-testing-workflow-pengeluaran).

#### 7.6.3 Verifikasi via Code

Cek file `src/lib/file-storage.js` untuk memastikan implementasi local storage:

```bash
type src\lib\file-storage.js
```

Atau di PowerShell:

```powershell
Get-Content src\lib\file-storage.js
```

Cari fungsi yang handle local storage:

```javascript
// Excerpt dari file-storage.js
if (process.env.FILE_STORAGE_MODE === "local") {
  // Local filesystem storage
  const uploadDir = path.join(process.cwd(), "public", "uploads");
  // ...
}
```

### 7.7 Cara Kerja Local File Storage

Ketika `FILE_STORAGE_MODE="local"`, berikut yang terjadi saat user upload file:

1. **User upload file** via form di aplikasi (contoh: form pengeluaran)

2. **Next.js API route** menerima file upload:
   - Endpoint: `POST /api/expenses` (dengan multipart/form-data)
   - File diterima sebagai `FormData`

3. **File disimpan ke disk**:
   - Generate unique filename: `expense-[uuid]-[uuid].[ext]`
   - Save ke: `public/uploads/expense-[uuid]-[uuid].[ext]`
   - Return file path: `/uploads/expense-[uuid]-[uuid].[ext]`

4. **File path disimpan ke database**:
   - Table: `ExpenseFile`
   - Column: `file_path` = `/uploads/expense-[uuid]-[uuid].[ext]`

5. **User akses file**:
   - URL: `http://localhost:3000/uploads/expense-[uuid]-[uuid].[ext]`
   - Next.js serve file dari `public/` folder secara otomatis

**Diagram alur**:

```
User Upload File
      ↓
Next.js API Route (/api/expenses)
      ↓
Save to: public/uploads/expense-xxx.jpg
      ↓
Save path to DB: /uploads/expense-xxx.jpg
      ↓
User Access: http://localhost:3000/uploads/expense-xxx.jpg
      ↓
Next.js serve from public/
```

### 7.8 Perbedaan Local vs MinIO Storage

| Aspek                | Local Storage                   | MinIO Storage                   |
| -------------------- | ------------------------------- | ------------------------------- |
| **Setup**            | Mudah, tidak perlu service      | Perlu install dan run MinIO     |
| **Performance**      | Cepat untuk file kecil          | Lebih baik untuk file besar     |
| **Scalability**      | Terbatas (disk space)           | Scalable (distributed storage)  |
| **Backup**           | Manual (copy folder)            | Built-in replication            |
| **Production Ready** | Tidak (single point of failure) | Ya (distributed, redundant)     |
| **URL Access**       | `/uploads/file.jpg`             | `https://minio.domain/file.jpg` |
| **Security**         | File permissions                | Access policies, encryption     |
| **Use Case**         | Development, testing            | Production, staging             |

> ⚠️ **PRODUCTION WARNING**: Local storage **TIDAK direkomendasikan** untuk production karena:
>
> - Single point of failure (jika disk rusak, file hilang)
> - Tidak scalable (terbatas disk space)
> - Tidak ada redundancy (tidak ada backup otomatis)
> - Sulit untuk distributed deployment (multiple servers)
>
> Untuk production, gunakan MinIO atau cloud storage (AWS S3, Google Cloud Storage, dll).

### 7.9 Troubleshooting File Storage

#### Problem 1: Error "ENOENT: no such file or directory"

**Symptoms**:

```
Error: ENOENT: no such file or directory, open 'C:\path\to\public\uploads\expense-xxx.jpg'
```

**Penyebab**:

- Folder `public/uploads/` tidak ada
- Path salah di code
- Permission denied

**Solusi**:

1. Pastikan folder ada:

   ```cmd
   mkdir public\uploads
   mkdir public\avatars
   ```

2. Verifikasi folder:

   ```cmd
   dir public
   ```

3. Restart aplikasi:

   ```bash
   # Stop dengan Ctrl+C
   npm run dev
   ```

#### Problem 2: File upload berhasil tapi tidak bisa diakses

**Symptoms**:

- Upload berhasil (status 200)
- File ada di `public/uploads/`
- Tapi akses via browser return 404

**Penyebab**:

- Next.js belum reload static files
- Path salah di database
- File name encoding issue

**Solusi**:

1. Restart Next.js dev server:

   ```bash
   # Stop dengan Ctrl+C
   npm run dev
   ```

2. Cek file path di database:

   ```bash
   wsl psql -h localhost -U app_user -d app_db -c "SELECT file_path FROM \"ExpenseFile\" LIMIT 5;"
   ```

   **Output yang diharapkan**:

   ```
                                    file_path
   -------------------------------------------------------------------------
    /uploads/expense-a4d3c763-dd6b-464b-aa50-5637c187b614-a791db28.png
   ```

   Path harus dimulai dengan `/uploads/`, bukan `public/uploads/`.

3. Test akses langsung:

   ```
   http://localhost:3000/uploads/expense-xxx.jpg
   ```

#### Problem 3: Error "Permission denied"

**Symptoms**:

```
Error: EACCES: permission denied, open 'C:\path\to\public\uploads\expense-xxx.jpg'
```

**Penyebab**:

- Folder tidak writable
- Antivirus blocking
- File sedang dibuka program lain

**Solusi**:

**Windows**:

1. Cek permission folder:

   ```powershell
   Get-Acl public\uploads | Format-List
   ```

2. Test write access:

   ```powershell
   echo "test" > public\uploads\test.txt
   ```

3. Jika gagal, run PowerShell as Administrator dan set permission:

   ```powershell
   $acl = Get-Acl "public\uploads"
   $permission = "Everyone","FullControl","Allow"
   $accessRule = New-Object System.Security.AccessControl.FileSystemAccessRule $permission
   $acl.SetAccessRule($accessRule)
   Set-Acl "public\uploads" $acl
   ```

**WSL/Linux**:

```bash
# Set permission
chmod 755 public/uploads public/avatars

# Set ownership (jika perlu)
sudo chown -R $USER:$USER public/uploads public/avatars
```

#### Problem 4: FILE_STORAGE_MODE tidak terbaca

**Symptoms**:

- Aplikasi tetap mencoba connect ke MinIO
- Error: "MinIO connection failed"

**Penyebab**:

- `.env` file tidak terbaca
- Typo di environment variable name
- Aplikasi tidak restart setelah ubah `.env`

**Solusi**:

1. Verifikasi `.env` file ada di root project:

   ```cmd
   dir .env
   ```

2. Cek isi file:

   ```cmd
   findstr "FILE_STORAGE_MODE" .env
   ```

   **Output yang diharapkan**:

   ```
   FILE_STORAGE_MODE="local"
   ```

3. Pastikan tidak ada typo:
   - Harus `FILE_STORAGE_MODE` (bukan `FILE_STORAGE_MODE_`)
   - Harus `"local"` (bukan `"Local"` atau `"LOCAL"`)

4. Restart aplikasi:

   ```bash
   # Stop dengan Ctrl+C
   npm run dev
   ```

5. Verifikasi di code (opsional):

   Tambahkan console.log di `src/lib/file-storage.js`:

   ```javascript
   console.log("FILE_STORAGE_MODE:", process.env.FILE_STORAGE_MODE);
   ```

   Restart dan cek output di terminal.

#### Problem 5: File upload terlalu besar

**Symptoms**:

```
Error: File size exceeds maximum allowed size
```

**Penyebab**:

- File lebih besar dari limit yang diset
- Default Next.js body size limit: 2MB

**Solusi**:

1. Cek file size:

   ```powershell
   Get-Item path\to\file.jpg | Select-Object Name, Length
   ```

2. Jika file terlalu besar, compress dulu atau ubah limit di `next.config.mjs`:

   ```javascript
   // next.config.mjs
   export default {
     // ...
     serverActions: {
       bodySizeLimit: "10mb", // Increase limit
     },
   };
   ```

3. Restart aplikasi

> ℹ️ **INFO**: Untuk production, sebaiknya limit file size tetap kecil (2-5MB) untuk performa dan security.

### 7.10 Best Practices

1. **Gunakan local storage hanya untuk development/testing**
   - Production harus pakai MinIO atau cloud storage

2. **Backup folder uploads secara berkala**
   - Copy folder `public/uploads/` ke lokasi aman
   - Atau gunakan git LFS untuk file besar

3. **Jangan commit file upload ke git**
   - File `.gitignore` sudah include `public/uploads/*`
   - Hanya commit `.gitkeep` untuk maintain folder structure

4. **Monitor disk space**
   - File upload bisa cepat memenuhi disk
   - Hapus file lama yang tidak diperlukan

5. **Validate file type dan size**
   - Hanya terima file type yang diizinkan (jpg, png, pdf)
   - Limit file size (max 5MB untuk development)

6. **Gunakan unique filename**
   - Aplikasi sudah generate UUID untuk filename
   - Hindari filename collision

7. **Test upload/download secara berkala**
   - Pastikan file bisa diupload dan diakses
   - Test dengan berbagai file type dan size

### 7.11 Command Reference

| Command                                    | Deskripsi                  |
| ------------------------------------------ | -------------------------- |
| `mkdir public\uploads`                     | Buat folder uploads (CMD)  |
| `mkdir public\avatars`                     | Buat folder avatars (CMD)  |
| `New-Item -ItemType Directory -Path "..."` | Buat folder (PowerShell)   |
| `dir public`                               | List isi folder public     |
| `echo "test" > public\uploads\test.txt`    | Test write access          |
| `type public\uploads\test.txt`             | Test read access           |
| `findstr "FILE_STORAGE_MODE" .env`         | Cek setting di .env        |
| `chmod 755 public/uploads`                 | Set permission (WSL/Linux) |

---

> ✅ **SUCCESS**: File storage sudah dikonfigurasi! Langkah selanjutnya adalah menjalankan aplikasi.

---

## 7.12 Alur Setup Lengkap dengan Verifikasi

Berikut adalah alur setup lengkap dari awal hingga aplikasi siap dijalankan, termasuk verifikasi di setiap langkah:

### Step-by-Step Setup dengan Verifikasi

```bash
# 1. Install dependencies
npm install

# 2. Setup environment variables
copy .env.example .env
# Edit .env sesuai konfigurasi Anda

# 3. Verifikasi koneksi database
npm run db:check
# ✅ Pastikan semua check passed sebelum lanjut

# 4. Generate Prisma Client
npm run db:generate

# 5. Jalankan migrasi database
npm run db:migrate

# 6. Verifikasi migrasi berhasil
npm run db:check
# ✅ Cek bahwa semua tabel sudah dibuat

# 7. Seed database (pilih salah satu)
npm run db:seed-admin        # Minimal: hanya admin
npm run db:seed-master       # Sedang: admin + master data
npm run db:seed-complete     # Lengkap: semua data + transaksi

# 8. Verifikasi data berhasil dibuat
npm run db:check
# ✅ Cek jumlah tabel dan ukuran database

# 9. Setup file storage
mkdir public\uploads
mkdir public\avatars

# 10. Jalankan aplikasi
npm run dev
```

### Troubleshooting dengan db:check

Jika ada masalah di langkah manapun, gunakan `npm run db:check` untuk diagnosis:

```bash
npm run db:check
```

**Interpretasi hasil**:

- ❌ **Connection failed** → PostgreSQL tidak running atau DATABASE_URL salah
- ⚠️ **No tables found** → Migrasi belum dijalankan, run `npm run db:migrate`
- ⚠️ **Missing critical tables** → Migrasi tidak lengkap, run `npm run db:migrate` lagi
- ✅ **All checks passed** → Database siap digunakan!

---

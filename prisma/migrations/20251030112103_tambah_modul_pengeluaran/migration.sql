-- CreateEnum
CREATE TYPE "KategoriPengeluaran" AS ENUM ('SERVIS_ARMADA', 'BIAYA_KANTOR', 'LISTRIK_AIR', 'TOL_PARKIR_NON_PAKET', 'GAJI_ADMIN', 'LAIN_LAIN');

-- CreateTable
CREATE TABLE "Pengeluaran" (
    "id" TEXT NOT NULL,
    "tanggal" TIMESTAMP(3) NOT NULL,
    "kategori" "KategoriPengeluaran" NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "jumlah" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "armadaId" TEXT,

    CONSTRAINT "Pengeluaran_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Pengeluaran_armadaId_idx" ON "Pengeluaran"("armadaId");

-- AddForeignKey
ALTER TABLE "Pengeluaran" ADD CONSTRAINT "Pengeluaran_armadaId_fkey" FOREIGN KEY ("armadaId") REFERENCES "armadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

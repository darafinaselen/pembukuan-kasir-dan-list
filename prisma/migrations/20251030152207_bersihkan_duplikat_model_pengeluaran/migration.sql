/*
  Warnings:

  - You are about to drop the `Pengeluaran` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."Pengeluaran" DROP CONSTRAINT "Pengeluaran_armadaId_fkey";

-- DropTable
DROP TABLE "public"."Pengeluaran";

-- DropEnum
DROP TYPE "public"."KategoriPengeluaran";

-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('CAR_RENTAL', 'TOUR_PACKAGE');

-- CreateEnum
CREATE TYPE "ArmadaStatus" AS ENUM ('READY', 'BOOKED', 'ON_TRIP', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('READY', 'ON_TRIP', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'DOWN_PAYMENT', 'PAID');

-- CreateTable
CREATE TABLE "packages" (
    "id" TEXT NOT NULL,
    "package_name" TEXT NOT NULL,
    "package_type" "PackageType" NOT NULL,
    "description" TEXT,
    "default_price" INTEGER NOT NULL,
    "default_duration_hours" INTEGER NOT NULL,
    "default_overtime_rate" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "armadas" (
    "id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "status" "ArmadaStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "armadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "address" TEXT,
    "status" "DriverStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "drivers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expenses" (
    "id" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "armadaId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "transactions" (
    "id" TEXT NOT NULL,
    "invoice_code" TEXT NOT NULL,
    "customer_name" TEXT NOT NULL,
    "customer_phone" TEXT NOT NULL,
    "booking_date" DATE NOT NULL,
    "checkout_datetime" TIMESTAMP(3) NOT NULL,
    "checkin_datetime" TIMESTAMP(3) NOT NULL,
    "all_in_rate" INTEGER NOT NULL,
    "overtime_rate_per_hour" INTEGER NOT NULL,
    "fuel_cost" INTEGER NOT NULL,
    "driver_fee" INTEGER NOT NULL,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "packageId" TEXT,
    "armadaId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "armadas_license_plate_key" ON "armadas"("license_plate");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_invoice_code_key" ON "transactions"("invoice_code");

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_armadaId_fkey" FOREIGN KEY ("armadaId") REFERENCES "armadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_armadaId_fkey" FOREIGN KEY ("armadaId") REFERENCES "armadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

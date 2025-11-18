-- CreateEnum
CREATE TYPE "PackageType" AS ENUM ('CAR_RENTAL', 'TOUR_PACKAGE', 'FULL_DAY_TRIP');

-- CreateEnum
CREATE TYPE "ArmadaStatus" AS ENUM ('READY', 'BOOKED', 'ON_TRIP', 'MAINTENANCE');

-- CreateEnum
CREATE TYPE "DriverStatus" AS ENUM ('READY', 'BOOKED', 'ON_TRIP', 'OFF_DUTY');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('UNPAID', 'DOWN_PAYMENT', 'PAID');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('DRAFT', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "ExpenseApprovalStatus" AS ENUM ('APPROVED', 'PENDING_EDIT', 'PENDING_DELETE', 'REJECTED');

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('ADMIN', 'MANAGER', 'OPERATOR');

-- CreateEnum
CREATE TYPE "AuditAction" AS ENUM ('CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'EXPORT', 'COMPLETE', 'SUBMIT_APPROVAL', 'APPROVE', 'REJECT', 'REQUEST_EDIT', 'REQUEST_DELETE', 'APPROVE_EDIT', 'APPROVE_DELETE');

-- CreateEnum
CREATE TYPE "StaffStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ON_LEAVE', 'TERMINATED');

-- CreateEnum
CREATE TYPE "ExpenseCategory" AS ENUM ('LISTRIK', 'INTERNET', 'PAKET_DATA', 'KONSUMSI', 'GAJI_STAF_OPERASIONAL', 'GAJI_STAF_ADMIN', 'INSENTIF_BONUS', 'PAJAK', 'ALAT_TULIS_KANTOR', 'KOMPUTER_SUPPLIES', 'OPERASIONAL_LAINNYA', 'BBM', 'PERAWATAN_ARMADA', 'GAJI_SOPIR', 'LAINNYA');

-- CreateTable
CREATE TABLE "service_packages" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" "PackageType" NOT NULL,
    "description" TEXT,
    "includes" TEXT[],
    "excludes" TEXT[],
    "isCustomizable" BOOLEAN NOT NULL DEFAULT false,
    "customizableItems" TEXT[],
    "price" INTEGER,
    "durationHours" INTEGER,
    "overtimeRate" INTEGER,
    "durationDays" INTEGER,
    "durationNights" INTEGER,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "service_packages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_tiers" (
    "id" TEXT NOT NULL,
    "starRating" INTEGER NOT NULL,
    "servicePackageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_tiers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotels" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "hotelTierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "hotel_price_ranges" (
    "id" TEXT NOT NULL,
    "minPax" INTEGER NOT NULL,
    "maxPax" INTEGER NOT NULL,
    "price" INTEGER NOT NULL,
    "hotelTierId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "hotel_price_ranges_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "itinerary_days" (
    "id" TEXT NOT NULL,
    "day" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "servicePackageId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "itinerary_days_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "armadas" (
    "id" TEXT NOT NULL,
    "license_plate" TEXT NOT NULL,
    "brand" TEXT NOT NULL,
    "model" TEXT NOT NULL,
    "vehicle_type" TEXT,
    "year" INTEGER,
    "color" TEXT,
    "capacity" INTEGER,
    "status" "ArmadaStatus" NOT NULL DEFAULT 'READY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "armadas_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "drivers" (
    "id" TEXT NOT NULL,
    "driver_name" TEXT NOT NULL,
    "nik" TEXT,
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
    "paymentMonth" DATE,
    "category" "ExpenseCategory" NOT NULL,
    "description" TEXT NOT NULL,
    "amount" INTEGER NOT NULL,
    "armadaId" TEXT,
    "driverId" TEXT,
    "staffId" TEXT,
    "namaPenerima" TEXT,
    "approval_status" "ExpenseApprovalStatus" NOT NULL DEFAULT 'APPROVED',
    "edit_request_reason" TEXT,
    "delete_request_reason" TEXT,
    "rejection_reason" TEXT,
    "original_data" JSONB,
    "requested_by_id" TEXT,
    "approved_by_id" TEXT,
    "requested_at" TIMESTAMP(3),
    "approved_at" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "expenses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "expense_attachments" (
    "id" TEXT NOT NULL,
    "expenseId" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "filePath" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "expense_attachments_pkey" PRIMARY KEY ("id")
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
    "dp_amount" INTEGER,
    "payment_status" "PaymentStatus" NOT NULL DEFAULT 'UNPAID',
    "actual_checkin_datetime" TIMESTAMP(3),
    "actual_overtime_cost" INTEGER,
    "hotel_name" TEXT,
    "pax_count" INTEGER,
    "hotel_tier_id" TEXT,
    "approval_status" "ApprovalStatus" NOT NULL DEFAULT 'DRAFT',
    "submitted_at" TIMESTAMP(3),
    "submitted_by" TEXT,
    "approved_at" TIMESTAMP(3),
    "approved_by" TEXT,
    "rejected_at" TIMESTAMP(3),
    "rejected_by" TEXT,
    "rejection_reason" TEXT,
    "packageId" TEXT,
    "armadaId" TEXT NOT NULL,
    "driverId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "transactions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "username" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'OPERATOR',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "lastLoginAt" TIMESTAMP(3),
    "lastLoginIp" TEXT,
    "resetToken" TEXT,
    "resetTokenExpiry" TIMESTAMP(3),
    "failedLoginAttempts" INTEGER NOT NULL DEFAULT 0,
    "lockedUntil" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sessions" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "staff" (
    "id" TEXT NOT NULL,
    "staff_name" TEXT NOT NULL,
    "nik" TEXT,
    "position" TEXT NOT NULL,
    "phone_number" TEXT NOT NULL,
    "email" TEXT,
    "address" TEXT,
    "salary_amount" INTEGER NOT NULL,
    "allowances" INTEGER DEFAULT 0,
    "bank_name" TEXT,
    "bank_account" TEXT,
    "account_holder" TEXT,
    "status" "StaffStatus" NOT NULL DEFAULT 'ACTIVE',
    "join_date" DATE NOT NULL,
    "resign_date" DATE,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "staff_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audit_logs" (
    "id" TEXT NOT NULL,
    "userId" TEXT,
    "action" "AuditAction" NOT NULL,
    "resource" TEXT NOT NULL,
    "resourceId" TEXT,
    "description" TEXT NOT NULL,
    "metadata" JSONB,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "armadas_license_plate_key" ON "armadas"("license_plate");

-- CreateIndex
CREATE INDEX "expenses_armadaId_idx" ON "expenses"("armadaId");

-- CreateIndex
CREATE INDEX "expenses_driverId_idx" ON "expenses"("driverId");

-- CreateIndex
CREATE INDEX "expenses_staffId_idx" ON "expenses"("staffId");

-- CreateIndex
CREATE INDEX "expenses_requested_by_id_idx" ON "expenses"("requested_by_id");

-- CreateIndex
CREATE INDEX "expenses_approved_by_id_idx" ON "expenses"("approved_by_id");

-- CreateIndex
CREATE INDEX "expense_attachments_expenseId_idx" ON "expense_attachments"("expenseId");

-- CreateIndex
CREATE UNIQUE INDEX "transactions_invoice_code_key" ON "transactions"("invoice_code");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_resetToken_key" ON "users"("resetToken");

-- CreateIndex
CREATE UNIQUE INDEX "sessions_token_key" ON "sessions"("token");

-- CreateIndex
CREATE INDEX "sessions_userId_idx" ON "sessions"("userId");

-- CreateIndex
CREATE INDEX "sessions_token_idx" ON "sessions"("token");

-- CreateIndex
CREATE UNIQUE INDEX "staff_nik_key" ON "staff"("nik");

-- CreateIndex
CREATE INDEX "audit_logs_userId_idx" ON "audit_logs"("userId");

-- CreateIndex
CREATE INDEX "audit_logs_action_idx" ON "audit_logs"("action");

-- CreateIndex
CREATE INDEX "audit_logs_resource_idx" ON "audit_logs"("resource");

-- CreateIndex
CREATE INDEX "audit_logs_createdAt_idx" ON "audit_logs"("createdAt");

-- AddForeignKey
ALTER TABLE "hotel_tiers" ADD CONSTRAINT "hotel_tiers_servicePackageId_fkey" FOREIGN KEY ("servicePackageId") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotels" ADD CONSTRAINT "hotels_hotelTierId_fkey" FOREIGN KEY ("hotelTierId") REFERENCES "hotel_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "hotel_price_ranges" ADD CONSTRAINT "hotel_price_ranges_hotelTierId_fkey" FOREIGN KEY ("hotelTierId") REFERENCES "hotel_tiers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "itinerary_days" ADD CONSTRAINT "itinerary_days_servicePackageId_fkey" FOREIGN KEY ("servicePackageId") REFERENCES "service_packages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_armadaId_fkey" FOREIGN KEY ("armadaId") REFERENCES "armadas"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_staffId_fkey" FOREIGN KEY ("staffId") REFERENCES "staff"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_requested_by_id_fkey" FOREIGN KEY ("requested_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_approved_by_id_fkey" FOREIGN KEY ("approved_by_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "expense_attachments" ADD CONSTRAINT "expense_attachments_expenseId_fkey" FOREIGN KEY ("expenseId") REFERENCES "expenses"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_hotel_tier_id_fkey" FOREIGN KEY ("hotel_tier_id") REFERENCES "hotel_tiers"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_packageId_fkey" FOREIGN KEY ("packageId") REFERENCES "service_packages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_armadaId_fkey" FOREIGN KEY ("armadaId") REFERENCES "armadas"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "transactions" ADD CONSTRAINT "transactions_driverId_fkey" FOREIGN KEY ("driverId") REFERENCES "drivers"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_userId_fkey" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

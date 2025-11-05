/**
 * Validation Schemas
 * Zod schemas for request validation
 */

import { z } from "zod";

// User schemas
export const loginSchema = z.object({
  username: z.string().min(1, "Username is required"),
  password: z.string().min(1, "Password is required"),
});

export const registerSchema = z.object({
  username: z.string().min(3).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  name: z.string().min(1),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]).default("OPERATOR"),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  role: z.enum(["ADMIN", "MANAGER", "OPERATOR"]).optional(),
  isActive: z.boolean().optional(),
});

// Transaction schemas
export const createTransactionSchema = z.object({
  customer_name: z.string().min(1, "Customer name is required"),
  customer_phone: z.string().min(1, "Customer phone is required"),
  booking_date: z.string().datetime(),
  checkout_datetime: z.string().datetime(),
  checkin_datetime: z.string().datetime(),
  all_in_rate: z.number().int().min(0),
  overtime_rate_per_hour: z.number().int().min(0),
  dp_amount: z.number().int().min(0).optional().nullable(),
  payment_status: z.enum(["UNPAID", "DOWN_PAYMENT", "PAID"]).default("UNPAID"),
  packageId: z.string().uuid().optional().nullable(),
  armadaId: z.string().uuid(),
  driverId: z.string().uuid(),
});

export const updateTransactionSchema = createTransactionSchema.partial();

// Expense schemas
export const createExpenseSchema = z.object({
  date: z.string().datetime(),
  category: z.string().min(1, "Category is required"),
  description: z.string().min(1, "Description is required"),
  amount: z.number().int().min(0),
  armadaId: z.string().uuid().optional().nullable(),
});

export const updateExpenseSchema = createExpenseSchema.partial();

// Armada schemas
export const createArmadaSchema = z.object({
  license_plate: z.string().min(1, "License plate is required"),
  brand: z.string().min(1, "Brand is required"),
  model: z.string().min(1, "Model is required"),
  status: z
    .enum(["READY", "BOOKED", "ON_TRIP", "MAINTENANCE"])
    .default("READY"),
});

export const updateArmadaSchema = createArmadaSchema.partial();

// Driver schemas
export const createDriverSchema = z.object({
  driver_name: z.string().min(1, "Driver name is required"),
  nik: z.string().optional().nullable(),
  phone_number: z.string().min(1, "Phone number is required"),
  address: z.string().optional().nullable(),
  status: z.enum(["READY", "ON_TRIP", "OFF_DUTY"]).default("READY"),
});

export const updateDriverSchema = createDriverSchema.partial();

// Package schemas
export const createPackageSchema = z.object({
  name: z.string().min(1, "Package name is required"),
  type: z.enum(["CAR_RENTAL", "TOUR_PACKAGE", "FULL_DAY_TRIP"]),
  description: z.string().optional().nullable(),
  includes: z.array(z.string()).default([]),
  excludes: z.array(z.string()).default([]),
  isCustomizable: z.boolean().default(false),
  customizableItems: z.array(z.string()).default([]),
  // CAR_RENTAL fields
  price: z.number().int().min(0).optional().nullable(),
  durationHours: z.number().int().min(1).optional().nullable(),
  overtimeRate: z.number().int().min(0).optional().nullable(),
  // TOUR_PACKAGE fields
  durationDays: z.number().int().min(1).optional().nullable(),
  durationNights: z.number().int().min(0).optional().nullable(),
});

export const updatePackageSchema = createPackageSchema.partial();

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
});

export const dateRangeSchema = z.object({
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export const transactionFilterSchema = paginationSchema.extend({
  status: z.enum(["UNPAID", "DOWN_PAYMENT", "PAID"]).optional(),
  armadaId: z.string().uuid().optional(),
  driverId: z.string().uuid().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const auditLogFilterSchema = paginationSchema.extend({
  userId: z.string().uuid().optional(),
  action: z
    .enum(["CREATE", "UPDATE", "DELETE", "LOGIN", "LOGOUT", "VIEW", "EXPORT"])
    .optional(),
  resource: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

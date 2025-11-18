/**
 * Transaction Validator
 * Zod schemas for transaction data validation
 */

import { z } from "zod";

// Base schema for transaction data
export const createTransactionSchema = z
  .object({
    // Customer data
    customer_name: z.string().min(1, "Nama pelanggan wajib diisi"),
    customer_phone: z
      .string()
      .min(10, "Nomor telepon tidak valid")
      .max(15, "Nomor telepon terlalu panjang"),

    // Dates
    booking_date: z.string().datetime("Format tanggal booking tidak valid"),
    checkout_datetime: z
      .string()
      .datetime("Format tanggal checkout tidak valid"),
    checkin_datetime: z.string().datetime("Format tanggal checkin tidak valid"),

    // Financial data
    all_in_rate: z
      .number()
      .positive("Tarif harus angka positif")
      .int("Tarif harus angka bulat"),
    overtime_rate_per_hour: z
      .number()
      .nonnegative("Tarif overtime tidak boleh negatif")
      .int("Tarif overtime harus angka bulat")
      .optional()
      .nullable(),
    dp_amount: z
      .number()
      .nonnegative("DP tidak boleh negatif")
      .int("DP harus angka bulat")
      .optional()
      .nullable(),
    payment_status: z.enum(["UNPAID", "DOWN_PAYMENT", "PAID"]).optional(),

    // Optional tour package data
    hotel_name: z.string().optional().nullable(),
    pax_count: z
      .number()
      .positive("Jumlah pax harus positif")
      .int("Jumlah pax harus angka bulat")
      .optional()
      .nullable(),
    hotel_tier_id: z
      .string()
      .uuid("ID Hotel Tier tidak valid")
      .optional()
      .nullable(),
    custom_price: z
      .number()
      .positive("Harga custom harus positif")
      .int("Harga custom harus angka bulat")
      .optional()
      .nullable(),

    // Relations
    armadaId: z.string().uuid("ID Armada tidak valid"),
    driverId: z.string().uuid("ID Sopir tidak valid"),
    packageId: z.string().uuid("ID Paket tidak valid").optional().nullable(),
  })
  .refine(
    (data) => {
      // Validate that checkin is after checkout
      const checkout = new Date(data.checkout_datetime);
      const checkin = new Date(data.checkin_datetime);
      return checkin > checkout;
    },
    {
      message: "Tanggal checkin harus setelah checkout",
      path: ["checkin_datetime"],
    }
  );

// Schema for updating transaction (same as create for now)
export const updateTransactionSchema = createTransactionSchema;

// Helper function to validate transaction data
export function validateTransactionData(data, isUpdate = false) {
  const schema = isUpdate ? updateTransactionSchema : createTransactionSchema;
  return schema.safeParse(data);
}

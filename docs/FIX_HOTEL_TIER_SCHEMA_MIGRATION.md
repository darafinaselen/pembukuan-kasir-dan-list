# ✅ FIXED: Hotel Tier Schema & Migration

## Masalah

Error Prisma: `Unknown field 'hotelTier' for include statement on model Transaction`

## Root Cause

Field `hotel_tier_id` dan relasi `hotelTier` **tidak ada di Prisma schema**, meski sudah ditambahkan di code (validator, API, frontend).

## Solusi yang Diterapkan

### 1. **Update Prisma Schema**

**File**: `prisma/schema.prisma`

#### Model Transaction:

```prisma
// Data Tambahan untuk Paket Wisata
hotel_name String?
pax_count  Int?

// ✅ ADDED: Relasi ke HotelTier
hotel_tier_id String?
hotelTier     HotelTier? @relation(fields: [hotel_tier_id], references: [id], onDelete: SetNull)
```

#### Model HotelTier:

```prisma
model HotelTier {
  id               String            @id @default(uuid())
  starRating       Int
  servicePackageId String
  servicePackage   ServicePackage    @relation(fields: [servicePackageId], references: [id], onDelete: Cascade)
  hotels           Hotel[]
  priceRanges      HotelPriceRange[]
  transactions     Transaction[]     // ✅ ADDED: Relasi balik

  @@map("hotel_tiers")
}
```

### 2. **Create Migration**

**File**: `scripts/migrate-add-hotel-tier.js`

Migration script yang menambahkan:

- Column `hotel_tier_id` (TEXT, nullable)
- Foreign key constraint ke `hotel_tiers.id`
- Index untuk performance

**Executed successfully** ✅

### 3. **Update API Routes**

Sementara menghapus include `hotelTier` dari API (akan ditambahkan setelah Prisma generate):

**Files**:

- `src/app/api/transactions/route.js` - GET all
- `src/app/api/transactions/[id]/route.js` - GET single, UPDATE

## Next Steps

⚠️ **IMPORTANT**: Untuk menyelesaikan fix ini, jalankan:

```bash
# 1. Stop development server (Ctrl+C di terminal npm run dev)
# 2. Generate Prisma Client dengan schema baru
npx prisma generate

# 3. Start development server lagi
npm run dev

# 4. Test transaksi tour package
```

## Setelah Prisma Generate Selesai

Tambahkan kembali include `hotelTier` di API routes untuk fetch data lengkap:

```javascript
include: {
  package: {
    include: {
      hotelTiers: {
        include: { hotels: true, priceRanges: true }
      }
    }
  },
  armada: true,
  driver: true,
  hotelTier: {  // ✅ Add this back
    include: {
      hotels: true,
      priceRanges: true
    }
  }
}
```

## Status

- [x] Schema updated
- [x] Migration created and executed
- [x] Database column added
- [ ] Prisma generate (needs dev server stopped)
- [ ] Re-add hotelTier include in APIs
- [ ] Test complete flow

## Testing After Fix

1. Stop dev server
2. Run `npx prisma generate`
3. Start dev server
4. Create tour package transaction
5. Select hotel tier
6. Save → Verify `hotel_tier_id` saved
7. Edit transaction → Verify hotel tier displays

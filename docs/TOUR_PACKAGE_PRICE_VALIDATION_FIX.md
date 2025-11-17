# Perbaikan TOUR PACKAGE Price Validation

## 🐛 Problem yang Ditemukan

User melaporkan bahwa ketika membuat/update paket TOUR_PACKAGE dengan data lengkap, data yang tersimpan menunjukkan:

```json
{
  "priceRanges": [
    {
      "minPax": 1,
      "maxPax": 3,
      "price": 0 // ❌ MASALAH: Harga 0 tidak seharusnya bisa tersimpan
    }
  ]
}
```

## 🔍 Root Cause Analysis

### 1. **Validasi Frontend Tidak Lengkap**

Di `PackageForm.jsx`, validasi priceRanges memiliki kelemahan:

```javascript
// SEBELUM (TIDAK LENGKAP):
if (tier.priceRanges && Array.isArray(tier.priceRanges)) {
  const v = validatePriceRangesForTier(tier.priceRanges);
  // ...
}
```

**Masalah:**

- Tidak mengecek apakah `priceRanges` kosong `[]`
- Tidak mengecek apakah `priceRanges` null/undefined
- Validasi `hasValidPriceRange` hanya mengecek "apakah ada minimal 1 range valid", bukan "apakah SEMUA range valid"

### 2. **Validasi API Tidak Lengkap**

Di API routes (`route.js` dan `[id]/route.js`), validasi juga tidak lengkap:

```javascript
// SEBELUM (TIDAK LENGKAP):
if (tier.priceRanges) {
  const v = validatePriceRangesForTier(tier.priceRanges);
  // ...
}
```

**Masalah:**

- Tidak memvalidasi apakah array kosong
- Tidak mengecek apakah ada minimal satu harga valid > 0

### 3. **CurrencyInput Behavior**

CurrencyInput mengirim:

- String kosong `""` → dikonversi menjadi `0` oleh `Number()`
- String valid `"50000"` → dikonversi menjadi `50000`

## ✅ Solusi yang Diterapkan

### 1. **Enhanced Frontend Validation** (`PackageForm.jsx`)

```javascript
// SESUDAH (LENGKAP):
for (let i = 0; i < data.tarifHotel.length; i++) {
  const tier = data.tarifHotel[i];

  // ✅ Validasi priceRanges exist
  if (!tier.priceRanges || !Array.isArray(tier.priceRanges)) {
    setError(`tarifHotel.${i}.priceRanges`, {
      type: "manual",
      message: "Tarif hotel harus memiliki rentang harga",
    });
    return;
  }

  // ✅ Validasi priceRanges tidak kosong
  if (tier.priceRanges.length === 0) {
    setError(`tarifHotel.${i}.priceRanges`, {
      type: "manual",
      message: "Minimal satu rentang harga harus diisi",
    });
    return;
  }

  // ✅ Validasi setiap price range
  const v = validatePriceRangesForTier(tier.priceRanges);
  if (!v.ok) {
    setError(`tarifHotel.${i}.priceRanges`, {
      type: "manual",
      message: v.message,
    });
    return;
  }

  // ✅ Validasi ada minimal 1 harga valid > 0
  if (
    tier.priceRanges.some((pr) => {
      const price =
        typeof pr.price === "string"
          ? Number(pr.price.trim() || 0)
          : Number(pr.price || 0);
      return price > 0;
    })
  ) {
    hasValidPriceRange = true;
  }
}

// ✅ Validasi minimal ada 1 tier dengan harga valid
if (!hasValidPriceRange) {
  setError("tarifHotel", {
    type: "manual",
    message:
      "Paket Tour harus memiliki setidaknya satu rentang harga yang valid (harga > 0)",
  });
  return;
}
```

### 2. **Enhanced API Validation** (CREATE & UPDATE)

**File:** `src/app/api/packages/route.js` dan `src/app/api/packages/[id]/route.js`

```javascript
// SESUDAH (LENGKAP):
for (let i = 0; i < hotelTiers.length; i++) {
  const tier = hotelTiers[i];

  // ✅ Validasi priceRanges exist dan tidak kosong
  if (
    !tier.priceRanges ||
    !Array.isArray(tier.priceRanges) ||
    tier.priceRanges.length === 0
  ) {
    return errorResponse(
      `Tingkat hotel ke-${i + 1} harus memiliki minimal satu rentang harga`,
      400
    );
  }

  // ✅ Validasi format price ranges
  const v = validatePriceRangesForTier(tier.priceRanges);
  if (!v.ok) {
    return errorResponse(
      `Validasi priceRanges gagal di tingkat ke-${i + 1}: ${v.message}`,
      400
    );
  }

  // ✅ Validasi ada minimal 1 harga valid > 0
  const hasValidPrice = tier.priceRanges.some((r) => {
    const price =
      typeof r.price === "string"
        ? Number(r.price.trim() || 0)
        : Number(r.price || 0);
    return price > 0;
  });

  if (!hasValidPrice) {
    return errorResponse(
      `Tingkat hotel ke-${i + 1} harus memiliki minimal satu rentang harga dengan nilai > 0`,
      400
    );
  }
}
```

## 📋 Validation Rules (Comprehensive)

### Level 1: Individual Price Range (`validatePriceRangesForTier`)

✅ `minPax >= 1`
✅ `maxPax >= minPax`
✅ `price > 0` (tidak boleh 0, null, atau string kosong)
✅ `price` harus finite number
✅ No overlapping ranges

### Level 2: Tier Level (PackageForm & API)

✅ `priceRanges` must exist and be an array
✅ `priceRanges` must not be empty (length > 0)
✅ All ranges must pass Level 1 validation
✅ At least one range must have valid price > 0

### Level 3: Package Level (PackageForm)

✅ At least one hotel tier must have valid price ranges
✅ Cannot submit without valid pricing data

## 🧪 Test Results

```
Test 1: Price = 0               → ✅ REJECTED (Correct)
Test 2: Price = ""              → ✅ REJECTED (Correct)
Test 3: Price = "50000"         → ✅ ACCEPTED (Correct)
Test 4: Price = 50000           → ✅ ACCEPTED (Correct)
Test 5: Empty array []          → ⚠️  ACCEPTED by validator (handled by higher level)
Test 6: Mixed valid/invalid     → ✅ REJECTED (Correct)
```

## 🎯 Impact

### Before Fix:

- ❌ User bisa submit dengan `price: 0`
- ❌ User bisa submit dengan `priceRanges: []`
- ❌ Data tidak valid masuk ke database

### After Fix:

- ✅ Form mencegah submit jika ada `price <= 0`
- ✅ Form mencegah submit jika `priceRanges` kosong
- ✅ API double-check validasi
- ✅ Error messages jelas dan membantu user

## 🚀 Testing Instructions

1. **Test Case: Submit dengan price 0**
   - Buat paket TOUR_PACKAGE baru
   - Isi rentang harga dengan price = 0
   - Klik Submit
   - **Expected:** Error "Harga harus berupa angka yang valid dan > 0"

2. **Test Case: Submit tanpa price ranges**
   - Buat paket TOUR_PACKAGE baru
   - Jangan tambahkan price range
   - Klik Submit
   - **Expected:** Error "Minimal satu rentang harga harus diisi"

3. **Test Case: Submit dengan price valid**
   - Buat paket TOUR_PACKAGE baru
   - Isi rentang harga dengan price = 50000
   - Klik Submit
   - **Expected:** Berhasil tersimpan dengan price = 50000

## 📝 Files Modified

1. `src/components/packages/PackageForm.jsx` - Enhanced frontend validation
2. `src/app/api/packages/route.js` - Enhanced API CREATE validation
3. `src/app/api/packages/[id]/route.js` - Enhanced API UPDATE validation
4. `test-tour-package-validation.js` - Test suite untuk validasi

## ⚙️ Configuration Notes

- CurrencyInput masih mengirim string values (tidak berubah)
- Validasi di `src/lib/utils.js` sudah benar (tidak perlu diubah)
- API tidak melakukan multiply by 1000 untuk TOUR_PACKAGE prices (sudah diperbaiki sebelumnya)

## 🔒 Security & Data Integrity

- Multi-layer validation (Frontend + Backend)
- Consistent error messages
- Prevention of invalid data at database level
- User-friendly error feedback

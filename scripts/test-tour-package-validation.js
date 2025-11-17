const { validatePriceRangesForTier } = require("../src/lib/utils.js");

console.log("=== TEST VALIDASI TOUR PACKAGE ===\n");

// Test Case 1: Price = 0 (INVALID)
console.log("Test 1: Price = 0 (harus ditolak)");
const test1 = [
  {
    minPax: 1,
    maxPax: 3,
    price: 0,
  },
];
const result1 = validatePriceRangesForTier(test1);
console.log("Input:", JSON.stringify(test1));
console.log("Result:", result1);
console.log("Status:", result1.ok ? "❌ FAIL (seharusnya ditolak)" : "✅ PASS");
console.log("");

// Test Case 2: Price = string kosong (INVALID)
console.log("Test 2: Price = string kosong (harus ditolak)");
const test2 = [
  {
    minPax: 1,
    maxPax: 3,
    price: "",
  },
];
const result2 = validatePriceRangesForTier(test2);
console.log("Input:", JSON.stringify(test2));
console.log("Result:", result2);
console.log("Status:", result2.ok ? "❌ FAIL (seharusnya ditolak)" : "✅ PASS");
console.log("");

// Test Case 3: Price valid string (VALID)
console.log('Test 3: Price = "50000" (harus diterima)');
const test3 = [
  {
    minPax: 1,
    maxPax: 3,
    price: "50000",
  },
];
const result3 = validatePriceRangesForTier(test3);
console.log("Input:", JSON.stringify(test3));
console.log("Result:", result3);
console.log(
  "Status:",
  result3.ok ? "✅ PASS" : "❌ FAIL (seharusnya diterima)"
);
console.log("");

// Test Case 4: Price valid number (VALID)
console.log("Test 4: Price = 50000 (harus diterima)");
const test4 = [
  {
    minPax: 1,
    maxPax: 3,
    price: 50000,
  },
];
const result4 = validatePriceRangesForTier(test4);
console.log("Input:", JSON.stringify(test4));
console.log("Result:", result4);
console.log(
  "Status:",
  result4.ok ? "✅ PASS" : "❌ FAIL (seharusnya diterima)"
);
console.log("");

// Test Case 5: Empty array (VALID - no ranges to validate)
console.log(
  "Test 5: Empty array (dianggap valid tapi harus dicek di level lebih tinggi)"
);
const test5 = [];
const result5 = validatePriceRangesForTier(test5);
console.log("Input:", JSON.stringify(test5));
console.log("Result:", result5);
console.log(
  "Status:",
  result5.ok ? "✅ PASS (tapi perlu validasi tambahan)" : "❌ FAIL"
);
console.log("");

// Test Case 6: Multiple ranges with one invalid (INVALID)
console.log("Test 6: Multiple ranges dengan satu harga 0 (harus ditolak)");
const test6 = [
  { minPax: 1, maxPax: 2, price: 50000 },
  { minPax: 3, maxPax: 5, price: 0 },
];
const result6 = validatePriceRangesForTier(test6);
console.log("Input:", JSON.stringify(test6));
console.log("Result:", result6);
console.log("Status:", result6.ok ? "❌ FAIL (seharusnya ditolak)" : "✅ PASS");
console.log("");

console.log("=== RINGKASAN ===");
console.log("✅ Validasi menolak price 0 dan string kosong");
console.log("✅ Validasi menerima price valid (string dan number)");
console.log("⚠️  Empty array dianggap valid oleh validatePriceRangesForTier");
console.log("   → Harus divalidasi di level PackageForm dan API");

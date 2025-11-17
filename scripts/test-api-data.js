const testData = {
  namaPaket: "Test Tour Package API",
  tipePaket: "Paket Tour",
  deskripsi: "Test description for API",
  durasiHari: 3,
  durasiMalam: 2,
  tarifHotel: [
    {
      tingkat: "Bintang 3",
      daftarHotel: ["Hotel A", "Hotel B"],
      priceRanges: [
        { minPax: 1, maxPax: 3, price: 50000 },
        { minPax: 4, maxPax: 6, price: 45000 },
      ],
    },
  ],
  itinerary: [
    { hari: 1, aktivitas: "Day 1 activity" },
    { hari: 2, aktivitas: "Day 2 activity" },
  ],
};

console.log("Data yang akan dikirim ke API:");
console.log("Type:", testData.tipePaket);
console.log("Hotel Tiers:", testData.tarifHotel.length);
console.log("Price Ranges per Tier:");
testData.tarifHotel.forEach((tier, i) => {
  console.log(
    `  Tier ${i + 1} (${tier.tingkat}): ${tier.priceRanges.length} ranges`
  );
  tier.priceRanges.forEach((range, j) => {
    console.log(
      `    Range ${j + 1}: ${range.minPax}-${range.maxPax}pax = Rp ${range.price.toLocaleString()}k`
    );
  });
});

console.log("\nValidasi data:");
const { validatePriceRangesForTier } = require("../src/lib/utils.js");
testData.tarifHotel.forEach((tier, i) => {
  const result = validatePriceRangesForTier(tier.priceRanges);
  console.log(
    `Tier ${i + 1} validation:`,
    result.ok ? "PASS" : "FAIL - " + result.message
  );
});

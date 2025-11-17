const testData = {
  namaPaket: "Test Tour Package",
  tipePaket: "Paket Tour",
  deskripsi: "Test description",
  durasiHari: 3,
  durasiMalam: 2,
  tarifHotel: [
    {
      tingkat: "Bintang 3",
      daftarHotel: ["Hotel A", "Hotel B"],
      priceRanges: [
        { minPax: 1, maxPax: 3, price: 50000 }, // 50,000 (ribuan)
        { minPax: 4, maxPax: 6, price: 45000 }, // 45,000 (ribuan)
      ],
    },
  ],
  itinerary: [
    { hari: 1, aktivitas: "Day 1 activity" },
    { hari: 2, aktivitas: "Day 2 activity" },
  ],
};

console.log("Test data structure:");
console.log(JSON.stringify(testData, null, 2));
console.log("\nPrice ranges validation:");
testData.tarifHotel.forEach((tier, i) => {
  console.log(`Tier ${i + 1} price ranges:`);
  tier.priceRanges.forEach((range, j) => {
    console.log(
      `  Range ${j + 1}: minPax=${range.minPax}, maxPax=${range.maxPax}, price=${range.price} (ribuan)`
    );
  });
});

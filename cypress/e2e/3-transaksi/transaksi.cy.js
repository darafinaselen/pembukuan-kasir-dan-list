describe("3. Manajemen Transaksi - Part 1 (Creation & Submission)", () => {
  const generateName = (prefix) =>
    `${prefix} ${Math.floor(Math.random() * 10000)}`;
  const getFutureDate = (daysToAdd) => {
    const date = new Date();
    date.setDate(date.getDate() + daysToAdd);
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date.toISOString().slice(0, 16);
  };

  const checkin = getFutureDate(2);
  const checkout = getFutureDate(5);
  let customerSewaMobil = "";

  beforeEach(() => {
    cy.on("uncaught:exception", () => false);
  });

  // TC-TRANS-001: Buat Transaksi Baru - Paket Sewa Mobil
  it("TC-TRANS-001: Buat Transaksi Baru - Paket Sewa Mobil", () => {
    customerSewaMobil = generateName("Sewa Mobil Client");

    cy.loginAs("ADMIN");
    cy.visit("/transaksi");
    cy.wait(1000);
    cy.contains(/Input Transaksi Baru/i)
      .should("be.visible")
      .click();

    cy.get('input[name="customer_name"]')
      .should("be.visible")
      .type(customerSewaMobil);
    cy.get('input[name="customer_phone"]').type("081234567890");

    cy.get('select[name="package_type"]').select("Sewa Mobil", { force: true });
    cy.get('select[name="package_id"]').select(1);
    cy.get('select[name="vehicle_id"]').select(1);
    cy.get('select[name="driver_id"]').select(1);
    cy.get('input[name="checkout_date"]').type(checkin);
    cy.get('input[name="checkin_date"]').type(checkout);
    cy.get('input[name="destination"]').type("Bandung");
    cy.contains(/simpan transaksi/i).click();

    cy.contains(/berhasil|sukses|success/i).should("be.visible");
    cy.contains("tr", customerSewaMobil).should("contain", "DRAFT");
    cy.visit("/armada");
    cy.contains("Mobil Avanza").should("contain", "READY");
  });

  // TC-TRANS-002: Buat Transaksi - Paket Wisata dengan Hotel
  it("TC-TRANS-002: Buat Transaksi - Paket Wisata dengan Hotel", () => {
    const customerWisata = generateName("Wisata Client");

    cy.loginAs("ADMIN");
    cy.visit("/transaksi");
    cy.contains(/tambah|buat/i).click();

    cy.get('input[name="customer_name"]').type(customerWisata);
    cy.get('input[name="customer_phone"]').type("081234567890");
    cy.get('select[name="package_type"]').select("Paket Wisata", {
      force: true,
    });
    cy.get('select[name="package_id"]').select(1);
    cy.get('input[name="passenger_count"]').type("4");
    cy.get('select[name="hotel_tier"]').select("Bintang 3");

    cy.get('select[name="vehicle_id"]').select(1);
    cy.get('select[name="driver_id"]').select(1);
    cy.get('input[name="checkout_date"]').type(checkin);
    cy.get('input[name="checkin_date"]').type(checkout);

    cy.contains(/simpan|save/i).click();
    cy.contains(customerWisata).should("be.visible");
    cy.contains("tr", customerWisata)
      .find("td")
      .eq(4)
      .should("not.have.text", "Rp 0");
  });

  // TC-TRANS-003: Buat Transaksi - Paket Full Day
  it("TC-TRANS-003: Buat Transaksi - Paket Full Day", () => {
    const customerFullDay = generateName("Full Day Client");

    cy.loginAs("ADMIN");
    cy.visit("/transaksi");
    cy.contains(/tambah|buat/i).click();

    cy.get('input[name="customer_name"]').type(customerFullDay);
    cy.get('input[name="customer_phone"]').type("081234567890");
    cy.get('select[name="package_type"]').select("Full Day", { force: true });
    cy.get('select[name="package_id"]').select(1);
    cy.get('input[name="duration_days"]').type("3");

    cy.get('select[name="vehicle_id"]').select(1);
    cy.get('select[name="driver_id"]').select(1);
    cy.get('input[name="checkout_date"]').type(checkin);
    cy.get('input[name="checkin_date"]').type(checkout);

    cy.contains(/simpan|save/i).click();

    // Validasi
    cy.contains(customerFullDay).should("be.visible");
    cy.contains("tr", customerFullDay).should("contain", "DRAFT");
  });

  // TC-TRANS-004: Buat Transaksi - Harga Custom
  it("TC-TRANS-004: Buat Transaksi - Harga Custom", () => {
    const customerCustom = generateName("Custom Price Client");
    const hargaCustom = "5000000";

    cy.loginAs("ADMIN");
    cy.visit("/transaksi");
    cy.contains(/tambah|buat/i).click();

    cy.get('input[name="customer_name"]').type(customerCustom);
    cy.get('input[name="customer_phone"]').type("081234567890");
    cy.get('select[name="package_type"]').select("Custom", { force: true });
    cy.get('input[name="custom_price"]').should("be.visible").type(hargaCustom);

    cy.get('select[name="vehicle_id"]').select(1);
    cy.get('select[name="driver_id"]').select(1);
    cy.get('input[name="checkout_date"]').type(checkin);
    cy.get('input[name="checkin_date"]').type(checkout);
    cy.get('input[name="destination"]').type("Custom Trip");

    cy.contains(/simpan|save/i).click();

    cy.contains("tr", customerCustom).should("be.visible");
    cy.contains("tr", customerCustom)
      .contains(/5\.000\.000|5,000,000/)
      .should("be.visible");
  });

  // TC-TRANS-005: Submit Transaksi untuk Persetujuan
  it("TC-TRANS-005: Submit Transaksi (Draft -> Pending)", () => {
    if (!customerSewaMobil) {
      cy.log("⚠️ Data TC-001 hilang/gagal, membuat data baru...");
      customerSewaMobil = generateName("Sewa Mobil Client");
    }

    cy.loginAs("ADMIN");
    cy.visit("/transaksi");
    cy.contains("tr", customerSewaMobil).should("contain", "DRAFT");
    cy.contains("tr", customerSewaMobil).within(() => {
      cy.get('button[title="Submit"], .btn-submit')
        .should("be.visible")
        .click();
    });

    cy.get("body").then(($body) => {
      if ($body.find(".swal2-confirm, button.confirm-btn").length > 0) {
        cy.get(".swal2-confirm, button.confirm-btn").click();
      }
    });

    // --- VALIDASI HASIL ---
    cy.wait(1000);
    cy.contains("tr", customerSewaMobil).should("contain", "PENDING");
    cy.contains("tr", customerSewaMobil).within(() => {
      cy.get('button[title="Edit"]').should("not.exist");
    });
    cy.visit("/armada");
    cy.contains(/BOOKED|Dipesan/i).should("be.visible");

    cy.log("✅ Transaksi berhasil di-submit dan aset berhasil di-booking.");
  });
});

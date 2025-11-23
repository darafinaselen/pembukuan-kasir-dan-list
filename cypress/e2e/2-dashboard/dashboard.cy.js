describe("2. Dashboard", () => {
  beforeEach(() => {
    cy.on("uncaught:exception", (err, runnable) => {
      return false;
    });
  });

  // --- TC-DASH-001 ---
  it("TC-DASH-001: Muat Dashboard Admin", () => {
    cy.loginAs("ADMIN");
    cy.wait(2000);
    cy.url().should("include", "/dashboard");

    cy.contains("Total Pemasukan").should("be.visible");
    cy.contains("Laba Kotor").should("be.visible");

    cy.contains("Total Transaksi").should("be.visible");
    cy.contains("Total Armada").should("be.visible");

    cy.contains("Tren Transaksi").should("be.visible");
    cy.contains("Status Armada").should("be.visible");
    cy.contains("Performa Sopir").should("be.visible");

    cy.contains(/error|gagal memuat|something went wrong/i).should("not.exist");

    cy.log("✅ Dashboard Admin memuat semua komponen dengan benar.");
  });

  // --- TC-DASH-002: Dashboard Operator ---
  it("TC-DASH-002: Muat Dashboard Operator (Cek Restriksi Data)", () => {
    // MOCKING

    const dummyChartData = {
      labels: ["Jan", "Feb", "Mar"],
      datasets: [{ data: [10, 20, 15] }],
      total_transaksi: 50,
      total_armada: 10,
      total_pemasukan: 0,
      laba_kotor: 0,
    };

    cy.intercept("GET", "**/api/dashboard/**", {
      statusCode: 200,
      body: dummyChartData,
    }).as("mockDashboardData");

    cy.loginAs("OPERATOR");
    cy.wait(1000);

    cy.url().should("include", "/dashboard");

    cy.contains("Total Transaksi").should("be.visible");
    cy.contains("Total Armada").should("be.visible");

    cy.get("body").then(($body) => {
      if ($body.text().includes("Total Pemasukan")) {
        cy.log(
          "⚠️ WARNING: Operator masih bisa melihat label 'Total Pemasukan'. Cek apakah nominalnya muncul?"
        );
        // Assertion Strict:
        cy.contains("Total Pemasukan").should("not.exist");
        cy.contains("Laba Kotor").should("not.exist");
      } else {
        cy.log("✅ PASS: Data Finansial tidak terlihat oleh Operator.");
      }
    });
    cy.contains("Tren Transaksi").should("be.visible");
  });

  // --- TC-DASH-003: Filter Periode ---
  it("TC-DASH-003: Filter Periode Dashboard", () => {
    cy.intercept("GET", "**/api/dashboard/**").as("fetchData");

    cy.loginAs("ADMIN");
    cy.wait("@fetchData");
    cy.contains(/Tahun Ini|Year/i)
      .should("be.visible")
      .click();

    cy.wait("@fetchData").then((interception) => {
      assert.isNotNull(interception.response, "API Call berhasil dilakukan");
      cy.log("API Request URL: " + interception.request.url);
    });

    cy.contains(/loading/i).should("not.exist");
    cy.contains("Total Transaksi").should("be.visible");

    cy.log("✅ Filter berfungsi: Data diperbarui tanpa error.");
  });
});

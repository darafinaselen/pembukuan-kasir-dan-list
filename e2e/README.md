# End-to-End Testing dengan Playwright

## 📋 Overview

Dokumentasi untuk End-to-End (E2E) testing menggunakan Playwright untuk aplikasi Pembukuan Kasir & List.

## 🚀 Setup

### 1. Install Dependencies

```bash
npm install
npx playwright install chromium
```

### 2. Setup Environment Variables

Buat file `.env.test` (opsional):

```env
PLAYWRIGHT_TEST_BASE_URL=http://localhost:3000
TEST_ADMIN_EMAIL=admin@example.com
TEST_ADMIN_PASSWORD=admin123
TEST_MANAGER_EMAIL=manager@example.com
TEST_MANAGER_PASSWORD=manager123
TEST_OPERATOR_EMAIL=operator@example.com
TEST_OPERATOR_PASSWORD=operator123
```

### 3. Run Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run with UI mode (interactive)
npm run test:e2e:ui

# Run in headed mode (see browser)
npm run test:e2e:headed

# Run in debug mode
npm run test:e2e:debug

# View test report
npm run test:e2e:report
```

## 📁 Struktur File

```
e2e/
├── .auth/
│   └── admin.json          # Saved auth state
├── helpers/
│   └── auth.js            # Authentication helpers
├── login.spec.js          # Login tests
├── dashboard.spec.js      # Dashboard tests
├── transaksi.spec.js      # Transaction tests (with availability check)
├── armada.spec.js         # Vehicle tests
├── sopir.spec.js          # Driver tests
├── paket.spec.js          # Package tests
├── staff.spec.js          # Staff tests
├── pengeluaran.spec.js    # Expense tests
├── laporan.spec.js        # Report tests (including performance report)
├── users.spec.js          # User management tests
├── global-setup.js        # Global setup (auth state)
└── README.md              # This file
```

## 🧪 Test Cases

### 1. Login (`login.spec.js`)
- ✅ Display login form
- ✅ Show error for empty fields
- ✅ Show error for invalid credentials
- ✅ Successfully login with valid credentials
- ✅ Redirect to login when accessing protected route

### 2. Dashboard (`dashboard.spec.js`)
- ✅ Display dashboard page
- ✅ Display dashboard stats cards
- ✅ Display transaction chart
- ✅ Display fleet status chart
- ✅ Display top 5 packages widget
- ✅ Change period filter

### 3. Transaksi (`transaksi.spec.js`)
- ✅ Display transactions page
- ✅ Open transaction dialog
- ✅ Check vehicle availability when dates change
- ✅ Display transactions table
- ✅ Filter transactions by date range
- ✅ Display transaction details

### 4. Armada (`armada.spec.js`)
- ✅ Display armada page
- ✅ Open add armada dialog
- ✅ Create new armada
- ✅ Filter armada by status
- ✅ Search armada
- ✅ Edit armada

### 5. Sopir (`sopir.spec.js`)
- ✅ Display sopir page
- ✅ Open add sopir dialog
- ✅ Create new sopir
- ✅ Search sopir
- ✅ Edit sopir

### 6. Paket (`paket.spec.js`)
- ✅ Display paket page
- ✅ Open add paket dialog
- ✅ Create new paket
- ✅ Display paket list
- ✅ View paket details
- ✅ Edit paket

### 7. Staff (`staff.spec.js`)
- ✅ Display staff page
- ✅ Open add staff dialog
- ✅ Create new staff
- ✅ Filter staff by status
- ✅ Search staff

### 8. Pengeluaran (`pengeluaran.spec.js`)
- ✅ Display pengeluaran page
- ✅ Open add pengeluaran dialog
- ✅ Create new pengeluaran
- ✅ Filter pengeluaran by date range
- ✅ Filter pengeluaran by category

### 9. Laporan (`laporan.spec.js`)
- ✅ Display laporan page
- ✅ Display laporan transaksi tab
- ✅ Display laporan laba rugi tab
- ✅ Display laporan pemasukan tab
- ✅ Display laporan pengeluaran tab
- ✅ Display rekapitulasi tab
- ✅ Display laporan kinerja tab
- ✅ Display driver performance in laporan kinerja
- ✅ Display package performance in laporan kinerja
- ✅ Filter reports by date range

### 10. Users (`users.spec.js`)
- ✅ Display users page
- ✅ Display users list
- ✅ Display user information

## 🔧 Helpers

### Authentication Helpers (`helpers/auth.js`)

```javascript
// Login as admin
await loginAsAdmin(page);

// Login as manager
await loginAsManager(page);

// Login as operator
await loginAsOperator(page);

// Get auth cookie
const cookie = await getAuthCookie(page);

// Save auth state
await saveAuthState(page, 'path/to/file.json');

// Load auth state
const state = loadAuthState('path/to/file.json');
```

## 📊 Test Results

Test results akan disimpan di:
- `test-results/` - Screenshots, videos, traces
- `playwright-report/` - HTML report

## 🐛 Debugging

### 1. Run in Debug Mode

```bash
npm run test:e2e:debug
```

### 2. Run Specific Test

```bash
npx playwright test e2e/login.spec.js
```

### 3. Run with Trace

```bash
npx playwright test --trace on
```

### 4. View Trace

```bash
npx playwright show-trace trace.zip
```

## ⚙️ Configuration

Konfigurasi Playwright ada di `playwright.config.js`:

- **Base URL**: `http://localhost:3000`
- **Browsers**: Chromium (default)
- **Retries**: 2 (on CI), 0 (local)
- **Workers**: 1 (on CI), unlimited (local)
- **Timeout**: 10s (action), 30s (navigation)

## 🔐 Authentication

Tests menggunakan saved auth state untuk menghindari login berulang:

1. `global-setup.js` login sebagai admin dan save state
2. Tests menggunakan saved state dari `e2e/.auth/admin.json`
3. Jika state tidak ada, tests akan login manual

## 📝 Best Practices

1. **Use data-testid**: Tambahkan `data-testid` untuk selector yang stabil
2. **Wait for elements**: Selalu gunakan `waitForSelector` atau `waitForLoadState`
3. **Use assertions**: Gunakan `expect` untuk verifikasi
4. **Clean up**: Hapus test data setelah test selesai
5. **Isolate tests**: Setiap test harus independent

## 🚨 Troubleshooting

### Test fails with timeout
- Pastikan server development berjalan (`npm run dev`)
- Periksa network requests di browser DevTools
- Increase timeout di `playwright.config.js`

### Authentication fails
- Periksa credentials di `.env.test`
- Pastikan database sudah di-seed dengan test users
- Hapus `e2e/.auth/admin.json` dan run ulang

### Selector not found
- Gunakan Playwright Inspector untuk debug: `npm run test:e2e:debug`
- Periksa selector dengan `page.locator('selector').screenshot()`
- Gunakan `page.pause()` untuk pause test

## 📚 Resources

- [Playwright Documentation](https://playwright.dev)
- [Playwright Best Practices](https://playwright.dev/docs/best-practices)
- [Playwright API Reference](https://playwright.dev/docs/api/class-playwright)


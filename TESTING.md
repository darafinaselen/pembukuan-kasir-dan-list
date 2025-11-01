# Test Documentation - Accounting Logic Unit Tests

## Overview

Unit tests komprehensif untuk memvalidasi logika akuntansi di aplikasi pembukuan kasir.

## Test Coverage

### 1. `calculateTransactionFinancials` - 42 test cases

#### Normal Transactions (2 tests)

- ✅ Transaksi 12 jam tanpa overtime
- ✅ Transaksi tanpa package (default 12 jam)

#### Transactions with Overtime (3 tests)

- ✅ Transaksi dengan 3 jam overtime
- ✅ Transaksi dengan 1 jam overtime
- ✅ Transaksi dengan overtime besar (12 jam)

#### Edge Cases (7 tests)

- ✅ Invalid time range (checkin sebelum checkout)
- ✅ Overtime rate = 0
- ✅ Missing/null values
- ✅ Zero costs
- ✅ Negative profit (rugi)

#### Rounding Behavior (2 tests)

- ✅ Pembulatan untuk 12.4 jam
- ✅ Pembulatan untuk 12.6 jam

### 2. `calculateAggregateFinancials` - 3 test cases

- ✅ Agregasi multiple transaksi
- ✅ Handle empty array
- ✅ Handle single transaction

### 3. `calculateNetProfit` - 4 test cases

- ✅ Kalkulasi net profit normal
- ✅ Handle zero gross profit
- ✅ Handle zero expenses
- ✅ Handle negative net profit

### 4. `validateTransactionFinancials` - 6 test cases

- ✅ Validasi transaksi yang benar
- ✅ Catch invalid time range
- ✅ Catch negative all_in_rate
- ✅ Catch negative overtime_rate
- ✅ Catch multiple validation errors

### 5. `formatCurrency` - 4 test cases

- ✅ Format currency standar
- ✅ Handle invalid inputs
- ✅ Format negative numbers
- ✅ Format large numbers

### 6. `formatCurrencyCompact` - 4 test cases

- ✅ Format small numbers
- ✅ Format millions compactly
- ✅ Format billions compactly
- ✅ Handle zero

### 7. Integration Tests - 2 test cases

- ✅ Kalkulasi daily revenue dengan 5 transaksi
- ✅ Kalkulasi month-end profit

## Test Scenarios

### Scenario 1: Transaksi Normal Tanpa Overtime

```javascript
Input:
- Checkout: 08:00, Checkin: 20:00 (12 jam)
- All-in rate: Rp 500.000
- Overtime rate: Rp 50.000/jam
- Fuel: Rp 100.000, Driver: Rp 150.000

Expected Output:
- Lama sewa: 12 jam
- Overtime: 0 jam
- Overtime fee: Rp 0
- Total pendapatan: Rp 500.000
- Total biaya ops: Rp 250.000
- Laba kotor: Rp 250.000
```

### Scenario 2: Transaksi Dengan Overtime

```javascript
Input:
- Checkout: 08:00, Checkin: 23:00 (15 jam)
- All-in rate: Rp 500.000
- Overtime rate: Rp 50.000/jam
- Fuel: Rp 100.000, Driver: Rp 150.000
- Package: 12 jam

Expected Output:
- Lama sewa: 15 jam
- Overtime: 3 jam
- Overtime fee: Rp 150.000 (3 × 50.000)
- Total pendapatan: Rp 650.000 (500.000 + 150.000)
- Total biaya ops: Rp 250.000
- Laba kotor: Rp 400.000
```

### Scenario 3: Agregasi Daily Revenue

```javascript
Input: 5 transaksi dalam sehari
- Transaksi 1: Rp 500k (no OT)
- Transaksi 2: Rp 650k (1h OT)
- Transaksi 3: Rp 880k (3h OT)
- Transaksi 4: Rp 550k (no OT)
- Transaksi 5: Rp 400k (no OT)

Expected Output:
- Transaction count: 5
- Total revenue: > Rp 2.750.000
- Average revenue: > Rp 500.000
- Total gross profit: > 0
```

### Scenario 4: Month-end Profit Calculation

```javascript
Input:
- Gross profit: Rp 50.000.000
- Office expenses: Rp 15.000.000

Expected Output:
- Net profit: Rp 35.000.000
- Profit margin: 70%
```

## Running Tests

### Run All Tests

```bash
npm test
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

### Run Tests with Coverage

```bash
npm run test:coverage
```

### Run Specific Test File

```bash
npm test accounting.test.js
```

### Run Specific Test Suite

```bash
npm test -- --testNamePattern="calculateTransactionFinancials"
```

## Expected Results

### Coverage Goals

- **Statements**: > 95%
- **Branches**: > 90%
- **Functions**: 100%
- **Lines**: > 95%

### Test Execution Time

- Total tests: 42+
- Expected duration: < 2 seconds
- All tests should pass: ✅

## Validation Checklist

### Financial Accuracy

- ✅ Revenue calculation includes overtime fees
- ✅ Gross profit = Revenue - Operational costs
- ✅ Overtime calculation based on package duration
- ✅ Rounding follows business rules

### Edge Case Handling

- ✅ Invalid time ranges handled gracefully
- ✅ Zero/null values don't break calculations
- ✅ Negative profits (losses) calculated correctly
- ✅ Missing data fields have sensible defaults

### Data Validation

- ✅ Negative rates rejected
- ✅ Invalid time ranges flagged
- ✅ Multiple validation errors reported
- ✅ Validation messages are clear

### Integration

- ✅ Aggregate functions work with multiple transactions
- ✅ Net profit calculation includes office expenses
- ✅ Daily/monthly reporting scenarios validated
- ✅ Real-world transaction patterns tested

## Troubleshooting

### Test Failures

If tests fail, check:

1. **Formula changes**: Ensure accounting.js matches test expectations
2. **Data format**: Verify datetime strings are ISO 8601 format
3. **Rounding**: Check Math.round() behavior with fractional hours
4. **Edge cases**: Confirm null/undefined handling in accounting.js

### Coverage Issues

If coverage is low:

1. Run `npm run test:coverage` to see report
2. Check `coverage/lcov-report/index.html` for visual report
3. Add tests for uncovered branches
4. Review edge cases that may be missed

## Maintenance

### Adding New Tests

1. Identify new business rule or edge case
2. Add test to appropriate `describe` block
3. Follow naming convention: `should [expected behavior]`
4. Use realistic data values
5. Verify test fails before implementing feature

### Updating Tests

When accounting logic changes:

1. Update affected test expectations
2. Run full test suite to catch regressions
3. Update this documentation
4. Update AUDIT_AKUNTANSI.md if formulas change

## CI/CD Integration

### Pre-commit Hook

```bash
npm test
```

### Pre-push Hook

```bash
npm run test:coverage
```

### CI Pipeline

```yaml
- name: Run tests
  run: npm test

- name: Check coverage
  run: npm run test:coverage

- name: Upload coverage
  uses: codecov/codecov-action@v3
```

## Contact

Untuk pertanyaan tentang tests, hubungi tim development atau lihat:

- `AUDIT_AKUNTANSI.md` - Audit lengkap logika akuntansi
- `AUDIT_SUMMARY.md` - Ringkasan executive
- `src/lib/accounting.js` - Source code yang di-test

# 🧪 Approval Workflow - Testing Documentation

## 📋 Overview

Dokumentasi lengkap untuk menjalankan unit test dan integration test pada sistem approval workflow.

---

## 🎯 Test Coverage

### 1. Unit Tests

**File**: `src/app/api/__tests__/approval-workflow.test.js`

Mencakup:

- ✅ Submit Transaction (DRAFT → PENDING)
- ✅ Approve Transaction (PENDING → APPROVED)
- ✅ Reject Transaction (PENDING → REJECTED)
- ✅ Get Pending Transactions List
- ✅ Edit Protection (PENDING & APPROVED)
- ✅ Delete Protection (PENDING & APPROVED)
- ✅ Status Transition Validations
- ✅ Permission Checks (OPERATOR, MANAGER, ADMIN)

**Total Test Cases**: 30+ scenarios

### 2. Component Tests

**File**: `src/components/transaksi/__tests__/ApprovalStatusBadge.test.jsx`

Mencakup:

- ✅ DRAFT status rendering (gray)
- ✅ PENDING status rendering (yellow)
- ✅ APPROVED status rendering (green)
- ✅ REJECTED status rendering (red)
- ✅ Unknown status handling
- ✅ Custom className support
- ✅ Null/undefined status handling

**Total Test Cases**: 10 scenarios

### 3. Integration Tests

**File**: `scripts/test-approval-workflow.js`

Mencakup:

- ✅ Full workflow: DRAFT → PENDING → APPROVED
- ✅ Full workflow: DRAFT → PENDING → REJECTED
- ✅ Multi-role authentication (OPERATOR, MANAGER, ADMIN)
- ✅ Edit/delete protection validation
- ✅ API endpoint integration
- ✅ Database state verification

**Total Test Cases**: 10 end-to-end scenarios

---

## 🚀 Running Tests

### Prerequisites

```powershell
# Install dependencies
npm install

# Generate Prisma client
npx prisma generate

# Setup test database (optional)
npm run db:reset
npm run db:seed-complete
```

---

### Unit Tests

#### Run All Unit Tests

```powershell
npm test
```

#### Run Approval Workflow Tests Only

```powershell
npm run test:approval
```

#### Run Tests in Watch Mode

```powershell
npm run test:watch
```

#### Run Tests with Coverage Report

```powershell
npm run test:coverage
```

**Expected Output**:

```
PASS  src/app/api/__tests__/approval-workflow.test.js
  Approval Workflow - Submit Transaction
    ✓ should submit DRAFT transaction to PENDING (25ms)
    ✓ should reject if transaction not found (10ms)
    ✓ should reject if transaction is not in DRAFT status (8ms)
    ✓ should allow OPERATOR to submit (12ms)

  Approval Workflow - Approve Transaction
    ✓ should approve PENDING transaction to APPROVED (15ms)
    ✓ should reject if transaction is not in PENDING status (9ms)
    ✓ should allow ADMIN to approve (11ms)

  Approval Workflow - Reject Transaction
    ✓ should reject PENDING transaction with reason (18ms)
    ✓ should reject if rejection_reason is empty (7ms)
    ✓ should reject if rejection_reason is missing (8ms)
    ✓ should reject if transaction is not in PENDING status (9ms)

  ... (more test results)

Test Suites: 1 passed, 1 total
Tests:       30 passed, 30 total
Snapshots:   0 total
Time:        3.456s
```

---

### Component Tests

#### Run Component Tests

```powershell
npm test -- ApprovalStatusBadge.test.jsx
```

**Expected Output**:

```
PASS  src/components/transaksi/__tests__/ApprovalStatusBadge.test.jsx
  ApprovalStatusBadge Component
    ✓ should render DRAFT status with gray color (45ms)
    ✓ should render PENDING status with yellow color (12ms)
    ✓ should render APPROVED status with green color (10ms)
    ✓ should render REJECTED status with red color (11ms)
    ✓ should render unknown status with default gray color (9ms)
    ✓ should accept custom className (8ms)
    ✓ should handle null status gracefully (7ms)
    ✓ should handle undefined status gracefully (8ms)

Test Suites: 1 passed, 1 total
Tests:       10 passed, 10 total
```

---

### Integration Tests

#### Prerequisites for Integration Tests

1. **Start development server**:

   ```powershell
   npm run dev
   ```

2. **Ensure database is seeded**:

   ```powershell
   npm run db:seed-complete
   ```

3. **Test users must exist**:
   - `operator@example.com` (password: `password123`)
   - `manager@example.com` (password: `password123`)
   - `admin@example.com` (password: `password123`)

#### Run Integration Tests

```powershell
# In a separate terminal (while dev server is running)
npm run test:approval-integration
```

**Expected Output**:

```
🧪 Starting Approval Workflow Integration Tests

📝 Test 1: Login as different users
✅ Operator logged in
✅ Manager logged in
✅ Admin logged in

📝 Test 2: Create transaction as OPERATOR (DRAFT)
✅ Transaction created: RLM-20251112-ABC123
   Status: DRAFT

📝 Test 3: Submit for approval (DRAFT → PENDING)
✅ Transaction submitted: RLM-20251112-ABC123
   Status: PENDING

📝 Test 4: Try to edit PENDING transaction (should fail)
✅ Edit blocked as expected (403)
   Error: Transaksi tidak dapat diedit karena sedang menunggu persetujuan

📝 Test 5: Try to delete PENDING transaction (should fail)
✅ Delete blocked as expected (403)
   Error: Transaksi tidak dapat dihapus karena sedang menunggu persetujuan

📝 Test 6: Get pending transactions list
✅ Found 1 pending transactions
   Total: 1

📝 Test 7: Approve transaction as MANAGER (PENDING → APPROVED)
✅ Transaction approved: RLM-20251112-ABC123
   Status: APPROVED

📝 Test 8: Try to edit APPROVED transaction (should fail)
✅ Edit blocked as expected (403)
   Error: Transaksi yang sudah disetujui tidak dapat diedit

📝 Test 9: Create, submit, and reject transaction
✅ Transaction 2 created: RLM-20251112-DEF456
✅ Transaction 2 submitted: PENDING
✅ Transaction 2 rejected: RLM-20251112-DEF456
   Status: REJECTED
   Reason: Data tidak lengkap, mohon dilengkapi

📝 Test 10: Try to edit REJECTED transaction (should succeed)
✅ Edit allowed for REJECTED transaction

============================================================
✅ ALL TESTS PASSED!
============================================================

📊 Test Summary:
  ✓ Login with different roles
  ✓ Create transaction (DRAFT)
  ✓ Submit for approval (DRAFT → PENDING)
  ✓ Edit protection for PENDING
  ✓ Delete protection for PENDING
  ✓ Get pending transactions list
  ✓ Approve transaction (PENDING → APPROVED)
  ✓ Edit protection for APPROVED
  ✓ Reject transaction (PENDING → REJECTED)
  ✓ Edit allowed for REJECTED
```

---

## 🔍 Test Scenarios Detail

### Scenario 1: Submit for Approval

```javascript
// Given: Transaction in DRAFT status
// When: OPERATOR submits for approval
// Then: Status changes to PENDING
// And: submitted_at and submitted_by are recorded
```

### Scenario 2: Approve Transaction

```javascript
// Given: Transaction in PENDING status
// When: MANAGER/ADMIN approves
// Then: Status changes to APPROVED
// And: approved_at and approved_by are recorded
```

### Scenario 3: Reject Transaction

```javascript
// Given: Transaction in PENDING status
// When: MANAGER/ADMIN rejects with reason
// Then: Status changes to REJECTED
// And: rejected_at, rejected_by, rejection_reason are recorded
```

### Scenario 4: Edit Protection - PENDING

```javascript
// Given: Transaction in PENDING status
// When: User tries to edit
// Then: Request is blocked with 403 error
// And: Error message indicates waiting for approval
```

### Scenario 5: Edit Protection - APPROVED

```javascript
// Given: Transaction in APPROVED status
// When: User tries to edit (even ADMIN)
// Then: Request is blocked with 403 error
// And: Error message indicates already approved
```

### Scenario 6: Delete Protection - PENDING

```javascript
// Given: Transaction in PENDING status
// When: User tries to delete
// Then: Request is blocked with 403 error
// And: Error message indicates waiting for approval
```

### Scenario 7: Delete Protection - APPROVED

```javascript
// Given: Transaction in APPROVED status
// When: User tries to delete (even ADMIN)
// Then: Request is blocked with 403 error
// And: Error message indicates already approved
```

### Scenario 8: Edit Allowed - DRAFT/REJECTED

```javascript
// Given: Transaction in DRAFT or REJECTED status
// When: User with permission tries to edit
// Then: Edit is allowed
// And: Transaction is updated successfully
```

### Scenario 9: Invalid Status Transitions

```javascript
// Given: Transaction in DRAFT status
// When: User tries to approve directly (skipping PENDING)
// Then: Request fails with 400 error
// And: Error indicates invalid status
```

### Scenario 10: Permission Checks

```javascript
// Given: Transaction in PENDING status
// When: OPERATOR tries to approve/reject
// Then: Request fails with 403 error (via middleware)
// But: MANAGER and ADMIN can approve/reject
```

---

## 🐛 Debugging Failed Tests

### Unit Test Failures

#### Mock Issues

```javascript
// If you see "Cannot read property 'findUnique' of undefined"
// Check that prisma mock is properly defined:
jest.mock("@/lib/prisma", () => ({
  prisma: {
    transaction: {
      findUnique: jest.fn(),
      // ... other methods
    },
  },
}));
```

#### Async Issues

```javascript
// Ensure params is awaited in Next.js 15+
const { id } = await params;
```

### Integration Test Failures

#### Server Not Running

```
❌ TEST FAILED: fetch failed
```

**Solution**: Start dev server with `npm run dev`

#### Database Not Seeded

```
❌ TEST FAILED: Login failed for operator@example.com
```

**Solution**: Run `npm run db:seed-complete`

#### Transaction Creation Failed

```
❌ TEST FAILED: Create transaction failed
```

**Solution**: Check that armada, driver, and package IDs exist in database

---

## 📊 Coverage Report

### Generate Coverage Report

```powershell
npm run test:coverage
```

### View Coverage in Browser

```powershell
# After running coverage, open:
# coverage/lcov-report/index.html
```

### Expected Coverage Metrics

```
File                                    | % Stmts | % Branch | % Funcs | % Lines
----------------------------------------|---------|----------|---------|--------
src/app/api/transactions/.../submit    |   100   |   100    |   100   |   100
src/app/api/transactions/.../approve   |   100   |   100    |   100   |   100
src/app/api/transactions/.../reject    |   100   |   100    |   100   |   100
src/app/api/transactions/pending       |   100   |   100    |   100   |   100
src/components/.../ApprovalStatusBadge |   100   |   100    |   100   |   100
```

---

## ✅ Test Checklist

### Before Running Tests

- [ ] Node.js >= 20.9.0 installed
- [ ] Dependencies installed (`npm install`)
- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database migrated (`npm run db:migrate`)
- [ ] Database seeded (`npm run db:seed-complete`)
- [ ] Dev server running (for integration tests)

### Test Execution

- [ ] Unit tests pass (`npm run test:approval`)
- [ ] Component tests pass
- [ ] Integration tests pass (`npm run test:approval-integration`)
- [ ] Coverage meets threshold (>80%)
- [ ] No console errors or warnings

### Validation

- [ ] All API endpoints return correct status codes
- [ ] Database state changes correctly
- [ ] Audit logs are created
- [ ] Permissions are enforced
- [ ] Error messages are user-friendly
- [ ] Status transitions follow workflow

---

## 🔧 Troubleshooting

### Common Issues

#### 1. Jest Configuration

If tests can't find modules, check `jest.config.js`:

```javascript
moduleNameMapper: {
  "^@/(.*)$": "<rootDir>/src/$1",
},
```

#### 2. Prisma Mock

If Prisma methods are undefined:

```javascript
// Reset mocks before each test
beforeEach(() => {
  jest.clearAllMocks();
});
```

#### 3. Next.js 15+ Params

If you get "params is not iterable":

```javascript
// Use Promise.resolve() in mock params
const params = createMockParams("trans-1");
// Where createMockParams returns: { params: Promise.resolve({ id }) }
```

#### 4. Integration Test Timeout

If tests timeout, increase timeout:

```javascript
// In test file
jest.setTimeout(30000); // 30 seconds
```

---

## 📝 Adding New Tests

### Template for New Test Case

```javascript
describe("Approval Workflow - New Feature", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test("should handle new scenario", async () => {
    // Arrange
    const mockData = {
      /* test data */
    };
    prisma.transaction.findUnique.mockResolvedValue(mockData);

    // Act
    const request = createMockRequest(/* params */);
    const params = createMockParams(/* id */);
    const response = await handler(request, params);
    const data = await response.json();

    // Assert
    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
    expect(data.data.someField).toBe(expectedValue);
  });
});
```

---

## 🎯 CI/CD Integration

### GitHub Actions Example

```yaml
name: Test Approval Workflow

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm ci

      - name: Generate Prisma Client
        run: npx prisma generate

      - name: Run unit tests
        run: npm run test:approval

      - name: Run component tests
        run: npm test -- ApprovalStatusBadge.test.jsx

      - name: Generate coverage
        run: npm run test:coverage

      - name: Upload coverage
        uses: codecov/codecov-action@v3
```

---

## 📚 References

- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Next.js Testing](https://nextjs.org/docs/app/building-your-application/testing)
- [Prisma Testing](https://www.prisma.io/docs/guides/testing)

---

Generated: November 12, 2025

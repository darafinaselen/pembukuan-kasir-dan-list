# 📅 Testing Plan - 18 Hours (Approval Workflow System)

## 📋 Overview

Comprehensive testing plan untuk approval workflow system mencakup Unit Testing, Integration Testing, dan Full System Regression Testing.

**Total Estimated Time**: 18 hours
- Unit Testing: 5 hours
- Integration Testing: 5 hours  
- Full System Regression Testing: 8 hours

**Automated Execution Time**: ~5 minutes

---

## 🎯 Phase 1: Unit Testing (5 hours)

### Objective
Menguji logika perubahan status di backend secara isolated.

### Test Coverage

#### 1.1 Status Transition Logic (1.5 hours)
**Test Cases**:
- ✅ DRAFT → PENDING (submit)
- ✅ PENDING → APPROVED (approve)
- ✅ PENDING → REJECTED (reject)
- ✅ REJECTED → editable (can edit and resubmit)
- ❌ DRAFT → APPROVED (skip PENDING - should fail)
- ❌ APPROVED → PENDING (reverse flow - should fail)

**File**: `src/app/api/__tests__/approval-workflow.test.js`

#### 1.2 Permission Validation (1 hour)
**Test Cases**:
- ✅ OPERATOR can submit transactions
- ✅ MANAGER can approve/reject
- ✅ ADMIN can approve/reject
- ❌ OPERATOR cannot approve/reject

#### 1.3 Edit/Delete Protection (1.5 hours)
**Test Cases**:
- ✅ DRAFT transactions can be edited
- ✅ REJECTED transactions can be edited
- ❌ PENDING transactions cannot be edited (403)
- ❌ APPROVED transactions cannot be edited (403)
- ❌ PENDING transactions cannot be deleted (403)
- ❌ APPROVED transactions cannot be deleted (403)

#### 1.4 Data Validation (1 hour)
**Test Cases**:
- ❌ Submit non-existent transaction
- ❌ Approve non-PENDING transaction
- ❌ Reject without reason
- ❌ Reject with empty reason
- ✅ Reject with valid reason

### Running Unit Tests

```powershell
# Run all unit tests
npm run test:approval

# Expected output:
# Test Suites: 1 passed, 1 total
# Tests:       25 passed, 25 total
# Time:        ~3.5s
```

### Success Criteria
- ✅ All 25 test cases pass
- ✅ Code coverage > 80%
- ✅ No console errors
- ✅ All status transitions validated

---

## 🎯 Phase 2: Integration Testing (5 hours)

### Objective
Menguji workflow lengkap dari perspektif user (Operator dan Admin).

### 2.1 Skenario Operator (2.5 hours)

#### Test Flow:
```
1. Login sebagai Operator
2. Buat Transaksi → Simpan Draft (status: DRAFT)
3. Verifikasi data bisa diedit (status: DRAFT)
4. Buka lagi, klik "Kirim untuk Persetujuan"
5. Verifikasi status berubah → PENDING
6. Verifikasi data terkunci (tombol Edit/Hapus hilang)
7. Verifikasi edit ditolak (API returns 403)
8. Verifikasi delete ditolak (API returns 403)
9. Buat Pengeluaran → Upload Bukti (W2)
10. Re-fetch pengeluaran dan verifikasi data
```

**Expected Results**:
- ✅ Transaction created with DRAFT status
- ✅ DRAFT transaction is editable
- ✅ Status changes to PENDING after submit
- ✅ PENDING transaction is locked (403 on edit/delete)
- ✅ Expense created successfully
- ✅ Audit logs recorded for all actions

**Running Test**:
```powershell
npm run test:operator
```

**Test File**: `scripts/test-operator-scenario.js`

### 2.2 Skenario Admin (2.5 hours)

#### Test Flow:
```
1. Login sebagai Admin
2. Lihat daftar transaksi PENDING
3. Klik "Approve" pada transaksi pertama
4. Verifikasi status berubah → APPROVED
5. Verifikasi approved_at dan approved_by tercatat
6. Klik "Reject" pada transaksi kedua dengan alasan
7. Verifikasi status berubah → REJECTED
8. Verifikasi rejection_reason tersimpan
9. Cek Laporan Pemasukan (W1)
10. Cek Laporan Pengeluaran (W2)
11. Cek Laporan Kinerja Armada & Driver (W3/W4)
12. Cek Audit Log untuk tracking
```

**Expected Results**:
- ✅ Pending transactions listed correctly
- ✅ Approve action changes status to APPROVED
- ✅ Reject action requires reason
- ✅ Rejection reason is saved
- ✅ All reports accessible by Admin
- ✅ Audit logs show all approval actions

**Running Test**:
```powershell
npm run test:admin
```

**Test File**: `scripts/test-admin-scenario.js`

### Success Criteria
- ✅ All operator workflows complete successfully
- ✅ All admin workflows complete successfully
- ✅ API responses match expectations
- ✅ Database state changes correctly
- ✅ Audit logs created for all actions

---

## 🎯 Phase 3: Full System Regression Testing (8 hours)

### Objective
Pengujian menyeluruh semua alur utama sistem dengan approval workflow.

### 3.1 Operator Role Testing (3 hours)

#### W1: Transaksi Workflow
```
✓ Buat Transaksi (DRAFT)
✓ Edit Transaksi (DRAFT allowed)
✓ Kirim untuk Persetujuan (DRAFT → PENDING)
✓ Verifikasi transaksi terkunci
✓ Complete Transaction (setelah APPROVED)
✓ Cek history transaksi
```

#### W2: Pengeluaran Workflow
```
✓ Buat Pengeluaran
✓ Upload Bukti (file attachment)
✓ Kirim untuk Persetujuan (W5)
✓ Verifikasi status
✓ Cek list pengeluaran
```

#### Hak Akses W4: Role-based UI
```
✓ Dashboard: Hide "Total Pemasukan" widget
✓ Dashboard: Hide "Laba Kotor" widget
✓ Dashboard: Hide "Analisis Tren" chart
✓ Sidebar: Hide "Laporan Laba Rugi" menu
✓ Sidebar: Simplified "Transaksi" menu (no submenu)
✓ Verify OPERATOR cannot access admin routes
```

**Test Checklist**:
- [ ] Create transaction with all required fields
- [ ] Edit draft transaction successfully
- [ ] Submit for approval (status PENDING)
- [ ] Verify edit/delete blocked (403)
- [ ] Create expense with attachment
- [ ] Verify UI widgets hidden for OPERATOR
- [ ] Verify menu items restricted
- [ ] Attempt to access admin routes (should fail)

### 3.2 Admin Role Testing (3 hours)

#### W1: Laporan Pemasukan
```
✓ View income report summary
✓ Filter by date range
✓ Export to Excel
✓ Verify calculations
✓ Check transaction breakdown
```

#### W2: Laporan Pengeluaran
```
✓ View expense report
✓ Filter by category
✓ Filter by payment month
✓ View attachments
✓ Verify totals
```

#### W3/W4: Laporan Kinerja
```
✓ View vehicle performance (W3)
  - Trip count
  - Revenue per vehicle
  - Utilization rate
✓ View driver performance (W4)
  - Trip count
  - Revenue per driver
  - Rating/feedback
```

#### W5: Approval Workflow
```
✓ View pending transactions list
✓ Approve transaction (PENDING → APPROVED)
✓ Reject transaction with reason (PENDING → REJECTED)
✓ Verify audit logs
✓ Check approval history
```

**Test Checklist**:
- [ ] Access all report pages
- [ ] Verify data accuracy
- [ ] Test date range filters
- [ ] Approve at least 2 transactions
- [ ] Reject at least 1 transaction with reason
- [ ] Verify audit log entries
- [ ] Export reports to Excel
- [ ] Verify all calculations correct

### 3.3 Manager Role Testing (1 hour)

```
✓ Same as Admin but with limited user management
✓ Can approve/reject transactions
✓ Can view all reports
✓ Cannot manage users
✓ Cannot view audit logs
```

### 3.4 Cross-cutting Concerns (1 hour)

#### Audit Logging
```
✓ All CREATE actions logged
✓ All UPDATE actions logged
✓ All DELETE actions logged
✓ All APPROVE actions logged
✓ All REJECT actions logged
✓ User, timestamp, IP recorded
```

#### Data Integrity
```
✓ No orphaned records
✓ Foreign keys maintained
✓ Status consistency
✓ Audit trail complete
```

#### Performance
```
✓ Page load < 2 seconds
✓ API response < 500ms
✓ Database queries optimized
✓ No N+1 queries
```

### Running Full Regression

```powershell
# Run complete regression test suite
npm run test:regression

# This will execute:
# 1. Unit tests
# 2. Operator scenario
# 3. Admin scenario
# 4. Approval workflow integration
# 5. Generate comprehensive report
```

### Success Criteria
- ✅ All workflows complete without errors
- ✅ All role permissions enforced
- ✅ All reports display correct data
- ✅ All audit logs created
- ✅ Performance benchmarks met
- ✅ No data integrity issues

---

## 📊 Test Execution Matrix

| Test Type | Test Count | Expected Duration | Actual Duration | Status |
|-----------|-----------|-------------------|-----------------|--------|
| Unit Tests | 25 | 5 hours | ~3.5s | ✅ PASS |
| Operator Integration | 10 | 2.5 hours | ~30s | ⏳ PENDING |
| Admin Integration | 12 | 2.5 hours | ~30s | ⏳ PENDING |
| Full Regression | 50+ | 8 hours | ~3 min | ⏳ PENDING |
| **TOTAL** | **97+** | **18 hours** | **~5 min** | ⏳ |

---

## 🛠️ Test Environment Setup

### Prerequisites
```powershell
# 1. Install dependencies
npm install

# 2. Generate Prisma client
npx prisma generate

# 3. Setup database
npm run db:reset
npm run db:seed-complete

# 4. Start development server
npm run dev
```

### Environment Variables
```env
DATABASE_URL="postgresql://..."
JWT_SECRET="your-secret-key"
NEXTAUTH_URL="http://localhost:3000"
NEXTAUTH_SECRET="your-nextauth-secret"
```

### Test Users
```
OPERATOR:
  Email: operator@example.com
  Password: password123

MANAGER:
  Email: manager@example.com
  Password: password123

ADMIN:
  Email: admin@example.com
  Password: password123
```

---

## 📝 Test Execution Steps

### Step 1: Run Unit Tests (5 hours manual → 3.5s automated)
```powershell
npm run test:approval
```

**Expected Output**:
```
✅ Test Suites: 1 passed, 1 total
✅ Tests:       25 passed, 25 total
⏱️  Time:        3.5s
```

### Step 2: Run Operator Scenario (2.5 hours manual → 30s automated)
```powershell
npm run test:operator
```

**Expected Output**:
```
✅ OPERATOR SCENARIO - ALL TESTS PASSED!

📊 TEST SUMMARY:
  ✓ Login sebagai Operator
  ✓ Buat Transaksi (DRAFT)
  ✓ Kirim untuk Persetujuan (DRAFT → PENDING)
  ✓ Verifikasi data terkunci
  ✓ Buat Pengeluaran
```

### Step 3: Run Admin Scenario (2.5 hours manual → 30s automated)
```powershell
npm run test:admin
```

**Expected Output**:
```
✅ ADMIN SCENARIO - ALL TESTS PASSED!

📊 TEST SUMMARY:
  ✓ Login sebagai Admin
  ✓ Lihat transaksi PENDING
  ✓ Approve transaksi
  ✓ Reject transaksi
  ✓ Cek Laporan Pemasukan & Pengeluaran
  ✓ Cek Laporan Kinerja
```

### Step 4: Run Full Regression (8 hours manual → 3 min automated)
```powershell
npm run test:regression
```

**Expected Output**:
```
═══════════════════════════════════════════════════════════════════════
  🎉 ALL TESTS PASSED!
  System is ready for production deployment
═══════════════════════════════════════════════════════════════════════

TEST EXECUTION SUMMARY
Total Tests: 4
Passed: 4
Failed: 0
Duration: 3.5 minutes
```

### Step 5: Run All Tests Together
```powershell
npm run test:all
```

---

## 🐛 Troubleshooting

### Common Issues

#### 1. Server Not Running
```
❌ Development server is NOT running!
💡 Solution: npm run dev
```

#### 2. Database Not Seeded
```
❌ Login failed for operator@example.com
💡 Solution: npm run db:seed-complete
```

#### 3. Port Already in Use
```
❌ Port 3000 is already in use
💡 Solution: Kill process or use different port
```

#### 4. Prisma Client Not Generated
```
❌ Cannot find module '@prisma/client'
💡 Solution: npx prisma generate
```

### Debug Mode

Enable verbose logging:
```powershell
$env:DEBUG="*"
npm run test:regression
```

---

## 📈 Test Metrics

### Coverage Goals
- Unit Test Coverage: > 80%
- Integration Test Coverage: 100% of workflows
- Regression Test Coverage: 100% of features

### Performance Benchmarks
- API Response Time: < 500ms
- Page Load Time: < 2s
- Database Query Time: < 100ms

### Quality Metrics
- Zero Critical Bugs
- Zero High-Priority Bugs
- 100% Pass Rate on Regression Tests

---

## ✅ Sign-off Checklist

### Unit Testing Phase
- [ ] All 25 unit tests pass
- [ ] Code coverage > 80%
- [ ] No console errors
- [ ] All edge cases covered

### Integration Testing Phase
- [ ] Operator scenario passes
- [ ] Admin scenario passes
- [ ] All API endpoints tested
- [ ] All user flows validated

### Regression Testing Phase
- [ ] All workflows tested
- [ ] All roles tested
- [ ] All reports validated
- [ ] Performance benchmarks met
- [ ] Audit logs complete

### Final Approval
- [ ] All test phases complete
- [ ] Documentation updated
- [ ] Known issues documented
- [ ] Ready for UAT

**Tested By**: _________________  
**Date**: _________________  
**Approved By**: _________________  
**Date**: _________________

---

## 📚 References

- [Unit Test Documentation](./APPROVAL_WORKFLOW_TESTING.md)
- [API Documentation](./APPROVAL_WORKFLOW_IMPLEMENTATION.md)
- [Test Results](../TEST_RESULTS.md)
- [Bug Report Template](../BUG_REPORT.md)

---

Generated: November 12, 2025  
Version: 1.0  
Status: Ready for Execution

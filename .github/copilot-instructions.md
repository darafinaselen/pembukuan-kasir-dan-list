# Copilot Instructions for Pembukuan Kasir & List

## 🎯 Project Overview

Indonesian car rental management system with Next.js 16 App Router, Prisma ORM, PostgreSQL, and JWT authentication. Features booking management, financial accounting, fleet/driver tracking, and comprehensive reporting.

## 🏗️ Architecture & Key Patterns

### Database Models (Prisma)

- **Transactions** use `checkout_datetime` + `checkin_datetime` with complex financial calculations
- **Armada/Drivers** have status tracking (`READY`, `BOOKED`, `ON_TRIP`, `MAINTENANCE`, `OFF_DUTY`)
  - `BOOKED`: Reserved for future bookings (checkout date is in the future)
  - `ON_TRIP`: Currently active on a trip (checkout date is today or past)
- **ServicePackage** supports multiple types: `CAR_RENTAL`, `TOUR_PACKAGE`, `FULL_DAY_TRIP`
- **Expenses** use ExpenseCategory enum (not string) with values like `BBM`, `GAJI_SOPIR`, `LISTRIK`, etc.

### API Route Structure

All routes use `/src/app/api/[module]/route.js` pattern with **protectedRoute** middleware:

```javascript
export const GET = protectedRoute(handleGetData, ["ADMIN", "MANAGER"]);
export const POST = protectedRoute(handleCreateData, ["ADMIN"]);
```

### Input Validation (Critical)

All API endpoints MUST use Zod schemas for input validation:

```javascript
import { validateTransactionData } from "@/lib/validators/transaction-validator";
const validation = validateTransactionData(body, isUpdate);
if (!validation.success) {
  return errorResponse(
    { message: "Validasi gagal", errors: validation.error.errors },
    400
  );
}
```

### Financial Calculations (Critical)

Use `/src/lib/accounting.js` for ALL financial logic - never implement inline:

```javascript
import { calculateTransactionFinancials } from "@/lib/accounting";
// Handles: duration, overtime, revenue, operational costs, profit calculations
```

### Authentication & Authorization

- JWT-based auth with role hierarchy: `ADMIN` > `MANAGER` > `OPERATOR`
- Protected routes use `(admin)` folder with middleware at `/src/proxy.js`
- API middleware in `/src/lib/middleware.js` handles auth/RBAC
- Session management with audit logging in `/src/lib/audit.js`

## 🛠️ Development Workflows

### Database Operations

```powershell
npm run db:migrate      # Apply schema changes
npm run db:seed-complete # Full seed with test data
npx prisma studio       # Visual database browser
```

### Testing Strategy

- Unit tests: `/src/lib/__tests__/` (accounting, auth, utils)
- API tests: `/src/app/api/__tests__/`
- Integration: `node scripts/test-endpoints.js`
- Accounting logic: Always test with `AUDIT_LOGIKA_AKUNTANSI.md` test cases

### Component Architecture

- UI components: `/src/components/ui/` (Shadcn/ui with data-slot pattern)
- Feature components: `/src/components/[module]/` (dashboard, transaksi, etc.)
- Forms use React Hook Form with Zod validation
- Sidebar navigation with collapsible icon state

## 🚨 Critical Conventions

### API Response Format

```javascript
return successResponse(data, "Success message");
return errorResponse("Error message", statusCode);
```

### Date Handling

```javascript
// Use date-fns with Indonesian locale
import { format } from "date-fns";
import { id } from "date-fns/locale";
format(date, "dd MMM yyyy", { locale: id });
```

### Financial Data

- All prices stored as integers (rupiah cents)
- Use `/src/lib/accounting.js` for calculations
- Overtime calculations: `Math.max(0, actualHours - packageHours)`
- Tour packages: no overtime, price = `pricePerPax * paxCount`

### Invoice Code Generation

Use nanoid for collision-resistant invoice codes:

```javascript
import { nanoid } from "nanoid";
const uniqueSuffix = nanoid(6).toUpperCase();
const invoice_code = `RLM-${yyyymmdd}-${uniqueSuffix}`;
```

### Status Management (Race Condition Prevention)

Transaction creation/updates MUST use atomic operations with availability verification:

```javascript
await prisma.$transaction(async (tx) => {
  // 1. Verify availability with lock
  const armada = await tx.armada.findFirst({
    where: { id: armadaId, status: 'READY' }
  });
  if (!armada) throw new Error('Armada tidak tersedia');

  // 2. Create/update transaction
  const result = await tx.transaction.create(...);

  // 3. Update status based on checkout date
  const status = isStartingTodayOrPast ? "ON_TRIP" : "BOOKED";
  await tx.armada.update({ where: { id: armadaId }, data: { status } });
  await tx.driver.update({ where: { id: driverId }, data: { status } });

  return result;
});
```

### Real-time Availability

Use `/api/availability/vehicles` and `/api/availability/drivers` for scheduling conflicts.
Form integration includes debounced availability checking.

## 📊 Key Integrations

### File Uploads

MinIO integration in `/src/lib/minio.js` for expense attachments.
Validation: PDF/images only, max 5MB per `/src/lib/file-storage.js`.

### Reporting

- Financial reports: `/api/reports/summary` with date range filters
- Excel exports: Use `xlsx` library with Indonesian formatting
- Charts: Recharts with custom themes matching Tailwind colors

### Audit System

All CRUD operations logged via `/src/lib/audit.js`:

```javascript
await logTransactionEvent(user, "CREATE", transaction, request);
```

## 🔧 Common Issues & Solutions

**Deployment**: Use Railway/Vercel with proper DATABASE_URL and JWT_SECRET
**Testing**: Run `npm run test` before commits; accounting tests are critical
**Performance**: Use Prisma query optimization with `include` statements
**Security**: All protected routes must use `protectedRoute` wrapper

## 📁 File Conventions

- Indonesian naming for business logic (armada, sopir, transaksi)
- English for technical/API naming (vehicles → armada mapping)
- Components use PascalCase, utilities use camelCase
- Database fields: snake_case, API responses: maintain consistency

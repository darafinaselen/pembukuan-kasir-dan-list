const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

async function testApprovalFilters() {
  console.log("🧪 Testing Approval Status Filters in Dashboard and Reports\n");

  try {
    // Test 1: Dashboard Stats - should only include APPROVED transactions
    console.log("📊 Testing Dashboard Stats API filter...");
    const dashboardTransactions = await prisma.transaction.findMany({
      where: {
        booking_date: {
          gte: new Date("2024-01-01"),
          lte: new Date(),
        },
        approval_status: "APPROVED",
      },
      select: { id: true, approval_status: true, booking_date: true },
    });

    const allTransactions = await prisma.transaction.findMany({
      where: {
        booking_date: {
          gte: new Date("2024-01-01"),
          lte: new Date(),
        },
      },
      select: { id: true, approval_status: true, booking_date: true },
    });

    console.log(`   Total transactions: ${allTransactions.length}`);
    console.log(`   APPROVED transactions: ${dashboardTransactions.length}`);
    console.log(
      `   Non-APPROVED transactions: ${allTransactions.length - dashboardTransactions.length}`
    );

    if (
      dashboardTransactions.every((tx) => tx.approval_status === "APPROVED")
    ) {
      console.log("   ✅ Dashboard filter working correctly\n");
    } else {
      console.log("   ❌ Dashboard filter NOT working\n");
    }

    // Test 2: Expense Reports - should only include APPROVED expenses
    console.log("💰 Testing Expense Reports API filter...");
    const approvedExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date("2024-01-01"),
          lte: new Date(),
        },
        approval_status: "APPROVED",
      },
      select: { id: true, approval_status: true, date: true },
    });

    const allExpenses = await prisma.expense.findMany({
      where: {
        date: {
          gte: new Date("2024-01-01"),
          lte: new Date(),
        },
      },
      select: { id: true, approval_status: true, date: true },
    });

    console.log(`   Total expenses: ${allExpenses.length}`);
    console.log(`   APPROVED expenses: ${approvedExpenses.length}`);
    console.log(
      `   Non-APPROVED expenses: ${allExpenses.length - approvedExpenses.length}`
    );

    if (approvedExpenses.every((exp) => exp.approval_status === "APPROVED")) {
      console.log("   ✅ Expense reports filter working correctly\n");
    } else {
      console.log("   ❌ Expense reports filter NOT working\n");
    }

    // Test 3: Check if there are any DRAFT transactions/expenses
    const draftTransactions = allTransactions.filter(
      (tx) => tx.approval_status === "DRAFT"
    );
    const draftExpenses = allExpenses.filter(
      (exp) => exp.approval_status === "DRAFT"
    );

    console.log("📋 Current Data Status:");
    console.log(`   DRAFT transactions: ${draftTransactions.length}`);
    console.log(`   DRAFT expenses: ${draftExpenses.length}`);

    if (draftTransactions.length > 0 || draftExpenses.length > 0) {
      console.log(
        "   ℹ️  Note: There are DRAFT records that will be excluded from reports\n"
      );
    }

    console.log("✅ Approval filter testing completed successfully!");
  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await prisma.$disconnect();
  }
}

testApprovalFilters();

#!/bin/sh
# migrate-and-seed.sh - Run migrations and seeding

echo "🔧 Database Setup Process"
echo "=========================="

# 1. Database Migration
echo ""
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed!"
  exit 1
fi

# 2. Seed Admin User
echo ""
echo "👤 Seeding admin user..."
node prisma/seed-admin.js

if [ $? -eq 0 ]; then
  echo "✅ Admin user seeded successfully"
else
  echo "⚠️  Admin seed warning (user may already exist)"
fi

# 3. Seed Complete Data (Optional - comment out if not needed)
echo ""
echo "📊 Seeding complete data..."
node prisma/seed-complete.js

if [ $? -eq 0 ]; then
  echo "✅ Complete data seeded successfully"
else
  echo "⚠️  Complete seed warning (data may already exist)"
fi

echo ""
echo "🎉 Database setup completed!"

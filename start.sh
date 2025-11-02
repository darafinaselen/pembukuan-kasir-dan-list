#!/bin/sh
# start.sh - Startup script untuk Railway deployment

echo "🚀 Starting deployment process..."

# 1. Database Migration
echo "📦 Running Prisma migrations..."
npx prisma migrate deploy

if [ $? -eq 0 ]; then
  echo "✅ Migrations completed successfully"
else
  echo "❌ Migration failed!"
  exit 1
fi

# 2. Seed Admin User
echo "👤 Seeding admin user..."
node prisma/seed-admin.js

if [ $? -eq 0 ]; then
  echo "✅ Admin user seeded successfully"
else
  echo "⚠️  Admin seed warning (may already exist)"
fi

# 3. Seed Complete Data
echo "📊 Seeding complete data..."

# Check if we should seed complete data (set SEED_COMPLETE_DATA=true in Railway)
if [ "$SEED_COMPLETE_DATA" = "true" ]; then
  node prisma/seed-complete.js
  if [ $? -eq 0 ]; then
    echo "✅ Complete data seeded successfully"
  else
    echo "⚠️  Complete seed warning (may already exist)"
  fi
else
  echo "⏭️  Skipping complete data seed (set SEED_COMPLETE_DATA=true to enable)"
fi

# 4. Start Application
echo "🎯 Starting Next.js application..."
exec npm start

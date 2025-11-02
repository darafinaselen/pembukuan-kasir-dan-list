#!/bin/sh
# start-standalone.sh - Startup script untuk standalone deployment

echo "🚀 Starting deployment process..."

# Note: For standalone builds, migrations should be run separately
# via Railway CLI or as a separate service

# Start Application
echo "🎯 Starting Next.js application..."
exec node server.js

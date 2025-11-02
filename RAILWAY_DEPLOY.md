# 🚀 Railway Deployment - Quick Guide

## ✅ Konfigurasi Sudah Siap!

Aplikasi ini sudah dikonfigurasi untuk:

- ✅ Node.js 20 (Next.js 16 compatible)
- ✅ Auto migrations on deploy
- ✅ Auto seed admin user
- ✅ Optional complete data seeding
- ✅ Health check endpoint
- ✅ Production optimized

---

## 📋 Pre-requisites

1. **Railway Account** - [Sign up](https://railway.app)
2. **GitHub Repository** - Code pushed to GitHub
3. **PostgreSQL Database** - Create di Railway

---

## 🎯 Deployment Steps

### 1. Setup Railway Project

```bash
# Install Railway CLI (optional)
npm i -g @railway/cli

# Or deploy via Railway Dashboard
```

### 2. Create PostgreSQL Database

1. Go to Railway Dashboard
2. Click **"New Project"**
3. Select **"Provision PostgreSQL"**
4. Copy `DATABASE_URL` yang di-generate

### 3. Create Web Service

1. Click **"New Service"**
2. Select **"GitHub Repo"**
3. Choose your repository
4. Railway akan auto-detect configuration

### 4. Set Environment Variables

Required variables:

```env
# Database
DATABASE_URL=${{Postgres.DATABASE_URL}}

# Security (generate dengan: openssl rand -base64 32)
JWT_SECRET=your-secret-min-32-chars
ENCRYPTION_KEY=your-key-min-32-chars

# App
NODE_ENV=production
NEXT_PUBLIC_BASE_URL=${{RAILWAY_PUBLIC_DOMAIN}}

# Optional - Enable sample data seeding
SEED_COMPLETE_DATA=true
```

### 5. Deploy!

```bash
git add .
git commit -m "deploy: Railway production"
git push origin main

# Railway akan otomatis:
# 1. Detect Dockerfile.railway
# 2. Build Docker image dengan Node.js 20
# 3. Run migrations (prisma migrate deploy)
# 4. Seed admin user
# 5. Seed sample data (if SEED_COMPLETE_DATA=true)
# 6. Start Next.js application
```

---

## 🔑 Default Admin Credentials

Setelah deployment berhasil, login dengan:

```
URL: https://your-app.railway.app
Email: admin@pembukuan.com
Password: admin123
```

**⚠️ PENTING**: Segera ganti password setelah first login!

---

## 📊 Startup Process

Saat container start, `start.sh` akan dijalankan:

```bash
🚀 Starting deployment process...
📦 Running Prisma migrations...      # Apply database migrations
✅ Migrations completed successfully

👤 Seeding admin user...             # Create admin user
✅ Admin user seeded successfully

📊 Seeding complete data...          # If SEED_COMPLETE_DATA=true
✅ Complete data seeded successfully

🎯 Starting Next.js application...   # Start web server
```

---

## 📁 Files untuk Deployment

### 1. `Dockerfile.railway`

Single-stage build optimized untuk Railway:

- Node.js 20 Alpine
- Auto migrations via start.sh
- Includes dev dependencies untuk Prisma CLI

### 2. `start.sh`

Startup script yang menjalankan:

- Prisma migrate deploy
- Seed admin user
- Seed complete data (optional)
- Start Next.js

### 3. `railway.json`

Railway configuration:

```json
{
  "build": {
    "builder": "DOCKERFILE",
    "dockerfilePath": "Dockerfile.railway"
  }
}
```

### 4. `package.json`

Updated dengan deployment scripts:

```json
{
  "db:migrate:deploy": "prisma migrate deploy",
  "db:seed-admin": "node prisma/seed-admin.js",
  "db:seed-complete": "node prisma/seed-complete.js",
  "db:setup": "All migrations and seeding"
}
```

---

## 🔍 Verify Deployment

### Check Logs

Railway Dashboard → Service → Deployments → View Logs

Look for:

```
✅ Migrations completed successfully
✅ Admin user seeded successfully
✅ Complete data seeded successfully
🎯 Starting Next.js application...
Ready on http://0.0.0.0:3003
```

### Test Endpoints

```bash
# Health check
curl https://your-app.railway.app/api/health

# Response:
{
  "status": "ok",
  "timestamp": "2025-11-03T...",
  "uptime": 123.45
}

# Login page
curl https://your-app.railway.app/
```

### Test Login

1. Go to your Railway public URL
2. Login with admin credentials
3. Should redirect to `/dashboard`
4. Check data (if complete seed enabled)

---

## 🐛 Troubleshooting

### Build Failed - Node.js Version

**Error**: `Node.js version ">=20.9.0" is required`

**Solution**: Already fixed! `Dockerfile.railway` uses Node.js 20.

---

### Migration Failed

**Error**: `Migration engine failed`

**Check**:

1. DATABASE_URL correct?
2. Database accessible?
3. Migrations valid?

**Fix**:

```bash
# Via Railway CLI
railway run npm run db:migrate:deploy

# Or check migrations
railway run npx prisma migrate status
```

---

### Admin User Already Exists

**Log**: `⚠️ Admin seed warning (may already exist)`

**Status**: ✅ Normal! Script detects existing user and skips.

---

### App Won't Start

**Check**:

1. All environment variables set?
2. JWT_SECRET and ENCRYPTION_KEY set?
3. Check Railway logs for errors

**Common Issues**:

```env
# Missing or too short
JWT_SECRET=secret  ❌ Too short!
JWT_SECRET=your-long-secret-key-here-min-32-chars  ✅

# Missing ENCRYPTION_KEY
ENCRYPTION_KEY=your-encryption-key-32-chars  ✅
```

---

## 📊 Environment Variables Reference

### Required

```env
DATABASE_URL          # PostgreSQL connection string
JWT_SECRET           # Min 32 chars
ENCRYPTION_KEY       # Min 32 chars
NODE_ENV            # production
```

### Optional

```env
NEXT_PUBLIC_BASE_URL       # Public domain
SEED_COMPLETE_DATA        # true|false
DEFAULT_ADMIN_EMAIL       # Override admin email
DEFAULT_ADMIN_PASSWORD    # Override admin password

# Email (if using reset password)
SMTP_HOST
SMTP_PORT
SMTP_USER
SMTP_PASSWORD
```

---

## 🔒 Security Checklist

- [ ] Change default admin password
- [ ] Set strong JWT_SECRET (min 32 chars)
- [ ] Set strong ENCRYPTION_KEY (min 32 chars)
- [ ] Don't enable SEED_COMPLETE_DATA in production
- [ ] Use Railway's private networking for database
- [ ] Enable database SSL/TLS
- [ ] Set up monitoring and alerts
- [ ] Review and rotate secrets regularly

---

## 📚 Additional Documentation

- **[DATABASE_SETUP.md](./DATABASE_SETUP.md)** - Detailed database & seeding guide
- **[DEPLOYMENT_FIX.md](./DEPLOYMENT_FIX.md)** - Node.js version fix details
- **[SECURITY.md](./SECURITY.md)** - Security implementation

---

## ✅ Deployment Status

**Current Configuration**:

- ✅ Node.js 20.18.0
- ✅ Dockerfile.railway ready
- ✅ Auto migrations enabled
- ✅ Auto seed admin enabled
- ✅ Optional complete data seed
- ✅ Health check endpoint
- ✅ Production optimized

**Ready to Deploy!** 🚀

Push ke GitHub dan Railway akan handle the rest!

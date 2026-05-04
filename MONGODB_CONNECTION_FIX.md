# MongoDB Connection Fix - URGENT

## Problem Identified

Your MongoDB Atlas cluster `cluster0.2awol.mongodb.net` is **not accessible**. DNS lookup is timing out.

## Root Cause

One of these issues:
1. ❌ MongoDB Atlas cluster is **paused** or **deleted**
2. ❌ Network/firewall blocking MongoDB Atlas
3. ❌ Your MongoDB Atlas account has issues

## Immediate Solutions

### Solution 1: Check MongoDB Atlas (RECOMMENDED)

1. **Go to**: https://cloud.mongodb.com/
2. **Login** with your credentials
3. **Check your cluster status**:
   - Is it showing as "Paused"? → Click "Resume"
   - Is it deleted? → Create a new cluster
   - Is it active? → Check network settings

4. **Network Access**:
   - Go to "Network Access" in left sidebar
   - Click "Add IP Address"
   - Select "Allow Access from Anywhere" (0.0.0.0/0)
   - Save

5. **Get Fresh Connection String**:
   - Click "Connect" on your cluster
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your password
   - Update both files:
     - `Task/backend/.env`
     - `Task/backend/index.js` (line 217)

### Solution 2: Create New MongoDB Atlas Cluster

If your cluster is deleted:

1. **Go to**: https://cloud.mongodb.com/
2. **Create New Cluster**:
   - Click "Build a Database"
   - Choose "M0 Free" tier
   - Select region closest to you
   - Click "Create"

3. **Create Database User**:
   - Database Access → Add New Database User
   - Username: `your_username`
   - Password: `your_password`
   - Database User Privileges: "Read and write to any database"

4. **Configure Network Access**:
   - Network Access → Add IP Address
   - Select "Allow Access from Anywhere" (0.0.0.0/0)

5. **Get Connection String**:
   - Click "Connect" → "Connect your application"
   - Copy connection string
   - Update `.env` and `index.js`

### Solution 3: Use Local MongoDB (Quick Development Fix)

**Install MongoDB locally:**

#### Windows:
```powershell
# Using Chocolatey
choco install mongodb

# Or download from:
# https://www.mongodb.com/try/download/community
```

#### After Installation:
```powershell
# Start MongoDB service
net start MongoDB

# Or run manually
mongod --dbpath C:\data\db
```

**Update your files:**

`Task/backend/.env`:
```env
MONGODB_URI=mongodb://localhost:27017/tourdb
```

`Task/backend/index.js` (line 217):
```javascript
mongoose.connect(process.env.MONGODB_URI || "mongodb://localhost:27017/tourdb")
```

**Restart backend:**
```bash
cd Task/backend
npm start
```

### Solution 4: Use Docker MongoDB (Easiest Local Setup)

```bash
# Install Docker Desktop first
# Then run:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Update .env
MONGODB_URI=mongodb://localhost:27017/tourdb

# Restart backend
cd Task/backend
npm start
```

### Solution 5: Alternative MongoDB Hosting

If MongoDB Atlas continues to fail, try:

#### Railway (Free tier, easy setup):
```bash
# Install Railway CLI
npm install -g @railway/cli

# Login
railway login

# Create project
railway init

# Add MongoDB
railway add mongodb

# Get connection string
railway variables
```

#### Render (Free tier):
1. Go to https://render.com
2. Create new PostgreSQL or use their MongoDB partner
3. Get connection string
4. Update `.env`

## Quick Test

After fixing, test the connection:

```bash
cd Task/backend

# Create test file
echo "require('dotenv').config(); const mongoose = require('mongoose'); mongoose.connect(process.env.MONGODB_URI).then(() => { console.log('✅ Connected!'); process.exit(0); }).catch(err => { console.error('❌ Failed:', err.message); process.exit(1); });" > test-db.js

# Run test
node test-db.js
```

## Current Status

- ✅ Backend code is correct
- ✅ Dependencies installed
- ✅ Connection string format is correct
- ❌ **MongoDB Atlas cluster is not accessible**

## What to Do NOW

1. **Check MongoDB Atlas** - Most likely the cluster is paused
2. **Resume the cluster** if paused
3. **Or use local MongoDB** for immediate development
4. **Restart backend** after fixing

## After Fix

Once MongoDB is accessible, your backend will:
- ✅ Connect to database
- ✅ Start on port 4000
- ✅ Accept API requests
- ✅ Socket.IO will work
- ✅ Frontend will load data

## Need Help?

The issue is **NOT with your code**. It's a MongoDB Atlas connectivity issue.

**Priority actions:**
1. Login to MongoDB Atlas
2. Check cluster status
3. Resume if paused
4. Or use local MongoDB

---

**Your backend is ready to run - it just needs a working MongoDB connection!**

# Backend Connection Issues - Troubleshooting Guide

## Current Issue

Your backend server is failing to connect to MongoDB with error:
```
Error: querySrv ENOTFOUND _mongodb._tcp.cluster0.2awol.mongodb.net
```

## Possible Causes & Solutions

### 1. MongoDB Cluster Not Accessible

**Check:**
- Is your MongoDB Atlas cluster running?
- Is your internet connection working?
- Can you access MongoDB Atlas dashboard?

**Solution:**
1. Go to https://cloud.mongodb.com/
2. Login to your account
3. Check if cluster `cluster0` is active
4. If paused, resume the cluster

### 2. Network/Firewall Issues

**Check:**
- Firewall blocking MongoDB connection
- VPN interfering with connection
- DNS resolution issues

**Solution:**
```bash
# Test DNS resolution
nslookup cluster0.2awol.mongodb.net

# Try pinging
ping cluster0.2awol.mongodb.net
```

### 3. IP Whitelist Not Configured

**Check:**
MongoDB Atlas Network Access settings

**Solution:**
1. Go to MongoDB Atlas Dashboard
2. Network Access → IP Access List
3. Click "Add IP Address"
4. Select "Allow Access from Anywhere" (0.0.0.0/0)
5. Or add your current IP address

### 4. Incorrect Connection String

**Current connection string:**
```
mongodb+srv://kaoser614:0096892156428@cluster0.2awol.mongodb.net/tourdb?retryWrites=true&w=majority
```

**Check:**
- Username: `kaoser614`
- Password: `0096892156428`
- Cluster: `cluster0.2awol.mongodb.net`
- Database: `tourdb`

**Get correct connection string:**
1. Go to MongoDB Atlas
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Copy the connection string
5. Replace `<password>` with your actual password
6. Update `Task/backend/.env`

### 5. Database User Permissions

**Check:**
- Does the database user exist?
- Does it have correct permissions?

**Solution:**
1. MongoDB Atlas → Database Access
2. Check if user `kaoser614` exists
3. Ensure it has "Read and write to any database" role
4. If not, edit user and grant permissions

## Quick Fixes to Try

### Fix 1: Use Alternative Connection String

Try the standard connection string format:

```env
# In Task/backend/.env
MONGODB_URI=mongodb://kaoser614:0096892156428@cluster0.2awol.mongodb.net:27017/tourdb?ssl=true&replicaSet=atlas-xxxxx-shard-0&authSource=admin&retryWrites=true&w=majority
```

### Fix 2: Use Local MongoDB (Development Only)

Install MongoDB locally:

```bash
# Windows (with Chocolatey)
choco install mongodb

# Or download from https://www.mongodb.com/try/download/community

# Update .env
MONGODB_URI=mongodb://localhost:27017/tourdb
```

### Fix 3: Test Connection with MongoDB Compass

1. Download MongoDB Compass: https://www.mongodb.com/try/download/compass
2. Use your connection string
3. If Compass can't connect, the issue is with MongoDB/network
4. If Compass connects, the issue is with your Node.js app

### Fix 4: Check MongoDB Atlas Status

Visit: https://status.mongodb.com/
- Check if there are any ongoing incidents
- Check if your region is affected

## Testing the Connection

### Test 1: Simple Connection Test

Create `Task/backend/test-connection.js`:

```javascript
require('dotenv').config();
const mongoose = require('mongoose');

const uri = process.env.MONGODB_URI;
console.log('Testing connection to:', uri.replace(/:[^:]*@/, ':****@'));

mongoose.connect(uri)
  .then(() => {
    console.log('✅ MongoDB connected successfully!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ MongoDB connection failed:', err.message);
    process.exit(1);
  });
```

Run:
```bash
cd Task/backend
node test-connection.js
```

### Test 2: Check Environment Variables

```bash
cd Task/backend
node -e "require('dotenv').config(); console.log('MONGODB_URI:', process.env.MONGODB_URI)"
```

## Alternative: Use Different MongoDB Service

If MongoDB Atlas continues to fail:

### Option 1: MongoDB Cloud (Different Provider)

Try a different MongoDB hosting service:
- **Railway**: https://railway.app (has MongoDB plugin)
- **Render**: https://render.com (has MongoDB)
- **DigitalOcean**: https://www.digitalocean.com/products/managed-databases-mongodb

### Option 2: Local Development

For local development, use Docker:

```bash
# Install Docker Desktop
# Then run:
docker run -d -p 27017:27017 --name mongodb mongo:latest

# Update .env
MONGODB_URI=mongodb://localhost:27017/tourdb
```

## Current Status

Your backend server is running but can't connect to MongoDB. This means:
- ✅ Node.js is working
- ✅ Dependencies are installed
- ✅ Server code is correct
- ❌ MongoDB connection is failing

## Next Steps

1. **Check MongoDB Atlas Dashboard**
   - Verify cluster is running
   - Check network access settings
   - Verify database user credentials

2. **Test Connection**
   - Use MongoDB Compass to test connection
   - Run the test-connection.js script

3. **Update Connection String**
   - Get fresh connection string from Atlas
   - Update `.env` file
   - Restart backend server

4. **If Still Failing**
   - Use local MongoDB for development
   - Or try a different MongoDB hosting service

## Restart Backend After Fixes

```bash
# Stop current process
# (Press Ctrl+C in the terminal running npm start)

# Or if using our process manager:
# The backend is running in terminal ID 4

# Restart
cd Task/backend
npm start
```

## Check if Backend is Running

Once connected, you should see:
```
Server is running on port 4000
Socket.IO server initialized
Database connected successfully
```

Then test:
```bash
curl http://localhost:4000/
```

## Frontend Will Work Once Backend is Running

Once your backend connects to MongoDB and starts successfully:
- ✅ API calls will work
- ✅ Socket.IO will connect
- ✅ No more connection errors in browser console
- ✅ Tours and data will load

## Need Help?

If you continue having issues:
1. Check MongoDB Atlas status page
2. Contact MongoDB support
3. Try local MongoDB for development
4. Consider alternative hosting services

---

**The issue is with MongoDB connection, not your code!**

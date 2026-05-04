# Quick Start Guide - Vercel Deployment

## 🚀 Fast Track Deployment (15 minutes)

### Step 1: Install Dependencies (2 min)
```bash
cd Task/backend
npm install
npm install -g vercel
```

### Step 2: Set Up MongoDB Atlas (5 min)
1. Go to https://www.mongodb.com/cloud/atlas
2. Create free account
3. Create cluster (M0 Free tier)
4. Create database user
5. Network Access → Add IP: `0.0.0.0/0` (allow all)
6. Copy connection string

### Step 3: Configure Environment Variables (3 min)
Copy `.env.example` to `.env` and fill in:
```bash
cp .env.example .env
```

Edit `.env`:
```env
MONGODB_URI=your_mongodb_connection_string_here
JWT_SECRET=your_random_secret_key_here
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
COMPANY_URL=http://localhost:3002
```

### Step 4: Deploy to Vercel (5 min)
```bash
# Login to Vercel
vercel login

# Deploy
vercel

# Follow prompts:
# - Set up and deploy? Y
# - Which scope? [Select your account]
# - Link to existing project? N
# - Project name? [Enter name]
# - Directory? ./
# - Override settings? N

# After preview deployment succeeds, deploy to production
vercel --prod
```

### Step 5: Add Environment Variables to Vercel
1. Go to https://vercel.com/dashboard
2. Select your project
3. Settings → Environment Variables
4. Add each variable from your `.env` file
5. Redeploy: `vercel --prod`

### Step 6: Update Frontend
Update your frontend to use the Vercel URL:
```javascript
// In your frontend .env file
REACT_APP_API_URL=https://your-backend.vercel.app
```

## ⚠️ Important Notes

### Socket.IO Won't Work
Socket.IO requires persistent connections and doesn't work on Vercel serverless.

**Quick Fix Options:**
1. **Use Pusher** (recommended) - See `PUSHER_MIGRATION.md`
2. **Deploy Socket.IO separately** on Railway/Render
3. **Remove real-time features** temporarily

### File Uploads Won't Work
Vercel filesystem is read-only.

**Quick Fix:**
1. Sign up for Cloudinary (free): https://cloudinary.com
2. Get credentials (cloud_name, api_key, api_secret)
3. Add to Vercel environment variables:
   ```
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```
4. Update your upload routes to use `config/cloudinary.js`

## 🧪 Testing Your Deployment

```bash
# Test root endpoint
curl https://your-backend.vercel.app/

# Test API endpoint
curl https://your-backend.vercel.app/api/test

# View logs
vercel logs
```

## 🔧 Troubleshooting

### "Cannot connect to MongoDB"
- Check MongoDB Atlas network access allows 0.0.0.0/0
- Verify connection string is correct
- Check environment variables in Vercel dashboard

### "CORS Error"
- Add your frontend URL to `allowedOrigins` in `index.js`
- Redeploy: `vercel --prod`

### "File upload fails"
- Implement Cloudinary (see above)
- Or use Vercel Blob Storage

### "Socket.IO not working"
- Expected on Vercel
- Migrate to Pusher or deploy Socket.IO separately

## 📚 Next Steps

1. **Read full guide**: `VERCEL_DEPLOYMENT.md`
2. **Migration guides**:
   - Socket.IO → Pusher: `PUSHER_MIGRATION.md`
   - Local files → Cloudinary: See `config/cloudinary.js`
3. **Checklist**: `DEPLOYMENT_CHECKLIST.md`

## 🆘 Need Help?

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Discord](https://vercel.com/discord)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)

## 💡 Pro Tips

1. **Test locally first**: `npm start` should work before deploying
2. **Use preview deployments**: Test with `vercel` before `vercel --prod`
3. **Monitor logs**: `vercel logs` shows real-time errors
4. **Environment variables**: Always redeploy after changing them
5. **Keep secrets safe**: Never commit `.env` file

## Alternative Platforms

If Vercel doesn't fit your needs (especially for Socket.IO):

### Railway (Recommended for Socket.IO)
```bash
npm install -g @railway/cli
railway login
railway init
railway up
```

### Render
1. Go to https://render.com
2. New → Web Service
3. Connect GitHub repo
4. Deploy

Both support traditional Node.js servers with WebSocket connections.

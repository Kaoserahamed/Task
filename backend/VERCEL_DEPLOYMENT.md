# Vercel Deployment Guide

## Prerequisites
- Vercel account (sign up at https://vercel.com)
- Vercel CLI installed: `npm i -g vercel`

## Important Notes

### Socket.IO Limitation
⚠️ **Socket.IO does not work natively on Vercel's serverless functions** because:
- Vercel uses serverless functions that are stateless
- Socket.IO requires persistent WebSocket connections
- Each request may hit a different serverless instance

### Solutions for Real-time Features:

#### Option 1: Use Vercel's Pusher Integration (Recommended)
Replace Socket.IO with Pusher Channels:
```bash
npm install pusher pusher-js
```

#### Option 2: Deploy Socket.IO Separately
- Keep Socket.IO on a traditional server (Railway, Render, Heroku)
- Deploy REST API on Vercel
- Configure CORS to allow both origins

#### Option 3: Use Ably or other WebSocket services
- Ably has better serverless support
- Similar API to Socket.IO

## Deployment Steps

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Login to Vercel
```bash
vercel login
```

### 3. Configure Environment Variables
Create a `.env.production` file or add these in Vercel dashboard:

```env
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
PORT=4000
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app
COMPANY_URL=https://your-company.vercel.app
NODE_ENV=production
```

### 4. Deploy to Vercel

#### First Deployment
```bash
cd Task/backend
vercel
```

Follow the prompts:
- Set up and deploy? **Y**
- Which scope? Select your account
- Link to existing project? **N**
- Project name? **your-project-name**
- Directory? **./Task/backend**
- Override settings? **N**

#### Subsequent Deployments
```bash
vercel --prod
```

### 5. Add Environment Variables in Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to Settings → Environment Variables
4. Add all required variables:
   - `MONGODB_URI`
   - `JWT_SECRET`
   - `FRONTEND_URL`
   - `ADMIN_URL`
   - `COMPANY_URL`
   - Any other API keys

### 6. Configure File Uploads

⚠️ **Important**: Vercel's serverless functions have a read-only filesystem except for `/tmp`

#### Option A: Use Cloud Storage (Recommended)
Replace local file storage with:
- **Cloudinary** (images/videos)
- **AWS S3** (any files)
- **Vercel Blob** (Vercel's storage solution)

Example with Cloudinary:
```bash
npm install cloudinary multer-storage-cloudinary
```

#### Option B: Use /tmp directory (temporary, not recommended for production)
Files in `/tmp` are deleted after function execution.

### 7. Update Frontend URLs

Update your frontend applications to use the Vercel backend URL:

**Admin Frontend** (`Task/admin/src/socket.js`):
```javascript
// For REST API
const API_URL = process.env.REACT_APP_API_URL || 'https://your-backend.vercel.app';

// For Socket.IO (if using separate server)
const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'https://your-socket-server.com';
```

### 8. Test Deployment

After deployment, test your endpoints:
```bash
curl https://your-backend.vercel.app/
curl https://your-backend.vercel.app/api/test
```

## File Upload Configuration

### Using Cloudinary (Recommended)

1. Install dependencies:
```bash
npm install cloudinary multer-storage-cloudinary
```

2. Update `middleware/upload.js`:
```javascript
const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'tour-uploads',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif'],
  },
});

const upload = multer({ storage: storage });
module.exports = upload;
```

3. Add Cloudinary credentials to Vercel environment variables

## Monitoring and Logs

View logs in real-time:
```bash
vercel logs your-deployment-url
```

Or check logs in Vercel Dashboard → Your Project → Deployments → View Logs

## Troubleshooting

### Issue: MongoDB Connection Timeout
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)
- Or add Vercel's IP ranges to whitelist

### Issue: CORS Errors
- Update `allowedOrigins` in `index.js` with your Vercel frontend URLs
- Ensure environment variables are set correctly

### Issue: File Upload Fails
- Implement cloud storage (Cloudinary/S3)
- Vercel filesystem is read-only except `/tmp`

### Issue: Socket.IO Not Working
- Socket.IO requires persistent connections
- Deploy Socket.IO server separately or use Pusher/Ably

## Alternative: Deploy to Railway/Render

If you need Socket.IO and persistent connections, consider:
- **Railway**: https://railway.app
- **Render**: https://render.com
- **Heroku**: https://heroku.com

These platforms support traditional Node.js servers with WebSocket connections.

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployments
vercel ls

# View logs
vercel logs

# Remove deployment
vercel rm your-deployment-url

# Link local project to Vercel project
vercel link
```

## Additional Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Node.js Runtime](https://vercel.com/docs/runtimes#official-runtimes/node-js)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Cloudinary Documentation](https://cloudinary.com/documentation)

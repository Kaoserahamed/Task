# Monorepo Deployment Guide

This project is configured as a monorepo with multiple applications that can be deployed together or separately.

## Project Structure

```
Task/
├── admin/                    # Admin Dashboard (React)
├── backend/                  # Backend API (Node.js/Express)
├── frontend/                 # User Frontend (React)
├── tourcompanydashboard/    # Company Dashboard (React)
├── recommendations/          # Recommendation System
└── vercel.json              # Root Vercel configuration
```

## Deployment Options

### Option 1: Deploy Backend Only (Recommended First)

Deploy the backend API separately to Vercel:

```bash
cd Task/backend
vercel --prod
```

**Advantages:**
- Simpler setup
- Independent scaling
- Easier debugging
- Better for microservices architecture

**After deployment:**
- Note the backend URL (e.g., `https://your-backend.vercel.app`)
- Update all frontend apps to use this URL

### Option 2: Deploy Each App Separately

Deploy each application as its own Vercel project:

#### Backend API
```bash
cd Task/backend
vercel --prod
```

#### User Frontend
```bash
cd Task/frontend
vercel --prod
```

#### Admin Dashboard
```bash
cd Task/admin
vercel --prod
```

#### Company Dashboard
```bash
cd Task/tourcompanydashboard
vercel --prod
```

**Advantages:**
- Independent deployments
- Separate domains for each app
- Better control over each service
- Independent environment variables

### Option 3: Monorepo Deployment (Advanced)

Deploy frontend and backend together from the root:

```bash
cd Task
vercel --prod
```

**Configuration:**
- Frontend serves at: `/`
- Backend API serves at: `/api/*`

**Advantages:**
- Single deployment
- Shared domain
- Simplified CORS

**Disadvantages:**
- More complex configuration
- Harder to debug
- All apps deploy together

## Environment Variables Setup

### Backend Environment Variables

Add these in Vercel Dashboard → Project → Settings → Environment Variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_jwt_secret_key

# CORS Origins
FRONTEND_URL=https://your-frontend.vercel.app
ADMIN_URL=https://your-admin.vercel.app
COMPANY_URL=https://your-company.vercel.app

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Real-time (Pusher - if migrated from Socket.IO)
PUSHER_APP_ID=your_app_id
PUSHER_KEY=your_key
PUSHER_SECRET=your_secret
PUSHER_CLUSTER=your_cluster

# Email Service
SENDINBLUE_API_KEY=your_api_key

# Other APIs
WEATHER_API_KEY=your_weather_api_key
```

### Frontend Environment Variables

Create `.env.production` in each frontend app:

**Task/frontend/.env.production:**
```env
REACT_APP_API_URL=https://your-backend.vercel.app
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=your_cluster
REACT_APP_STRIPE_PUBLIC_KEY=your_stripe_key
```

**Task/admin/.env.production:**
```env
REACT_APP_API_URL=https://your-backend.vercel.app
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=your_cluster
```

**Task/tourcompanydashboard/.env.production:**
```env
REACT_APP_API_URL=https://your-backend.vercel.app
REACT_APP_PUSHER_KEY=your_pusher_key
REACT_APP_PUSHER_CLUSTER=your_cluster
```

## Step-by-Step Deployment

### Step 1: Prepare Backend

```bash
cd Task/backend
npm install
```

### Step 2: Deploy Backend

```bash
vercel login
vercel --prod
```

Note the deployment URL (e.g., `https://your-backend-abc123.vercel.app`)

### Step 3: Configure Environment Variables

1. Go to Vercel Dashboard
2. Select backend project
3. Settings → Environment Variables
4. Add all backend environment variables
5. Redeploy: `vercel --prod`

### Step 4: Update Frontend Apps

Update each frontend's `.env` or `.env.production`:

```bash
# In Task/frontend/.env.production
echo "REACT_APP_API_URL=https://your-backend-abc123.vercel.app" > .env.production

# In Task/admin/.env.production
echo "REACT_APP_API_URL=https://your-backend-abc123.vercel.app" > .env.production

# In Task/tourcompanydashboard/.env.production
echo "REACT_APP_API_URL=https://your-backend-abc123.vercel.app" > .env.production
```

### Step 5: Deploy Frontend Apps

```bash
# User Frontend
cd Task/frontend
vercel --prod

# Admin Dashboard
cd Task/admin
vercel --prod

# Company Dashboard
cd Task/tourcompanydashboard
vercel --prod
```

### Step 6: Update CORS in Backend

Update `Task/backend/index.js` with your deployed frontend URLs:

```javascript
const allowedOrigins = [
  'http://localhost:3000',
  'http://localhost:3001',
  'http://localhost:3002',
  'https://your-frontend.vercel.app',
  'https://your-admin.vercel.app',
  'https://your-company.vercel.app',
  process.env.FRONTEND_URL,
  process.env.ADMIN_URL,
  process.env.COMPANY_URL
].filter(Boolean);
```

Redeploy backend:
```bash
cd Task/backend
vercel --prod
```

## Testing Deployments

### Test Backend
```bash
curl https://your-backend.vercel.app/
curl https://your-backend.vercel.app/api/test
```

### Test Frontend
Open in browser:
- User Frontend: `https://your-frontend.vercel.app`
- Admin Dashboard: `https://your-admin.vercel.app`
- Company Dashboard: `https://your-company.vercel.app`

## Troubleshooting

### CORS Errors
- Ensure frontend URLs are in `allowedOrigins` array
- Check environment variables are set correctly
- Redeploy backend after changes

### API Connection Failed
- Verify `REACT_APP_API_URL` is correct in frontend
- Check backend is deployed and running
- Test backend endpoints directly

### Environment Variables Not Working
- Redeploy after adding/changing variables
- Check variable names match exactly (case-sensitive)
- Ensure `.env.production` is not in `.gitignore`

### Build Failures
- Check Node.js version compatibility
- Ensure all dependencies are in `package.json`
- Review build logs in Vercel dashboard

## Monitoring

### View Logs
```bash
# Backend logs
vercel logs https://your-backend.vercel.app

# Frontend logs
vercel logs https://your-frontend.vercel.app
```

### Vercel Dashboard
- Real-time logs
- Deployment history
- Analytics
- Performance metrics

## Custom Domains (Optional)

### Add Custom Domain

1. Go to Vercel Dashboard
2. Select project
3. Settings → Domains
4. Add domain (e.g., `api.yourdomain.com` for backend)
5. Update DNS records as instructed
6. Update frontend `.env` with new domain

### Recommended Domain Structure
- Backend: `api.yourdomain.com`
- User Frontend: `www.yourdomain.com` or `yourdomain.com`
- Admin: `admin.yourdomain.com`
- Company: `company.yourdomain.com`

## CI/CD with GitHub

### Automatic Deployments

1. Connect GitHub repository to Vercel
2. Vercel Dashboard → Import Project
3. Select repository
4. Configure:
   - Root Directory: `Task/backend` (for backend)
   - Root Directory: `Task/frontend` (for frontend)
5. Add environment variables
6. Deploy

### Branch Deployments
- `main` branch → Production
- Other branches → Preview deployments

## Performance Optimization

### Backend
- Enable compression
- Add database indexes
- Implement caching (Redis/Vercel KV)
- Optimize queries

### Frontend
- Code splitting
- Lazy loading
- Image optimization
- CDN for static assets

## Security Checklist

- [ ] Environment variables set (not hardcoded)
- [ ] CORS configured correctly
- [ ] MongoDB network access configured
- [ ] JWT secret is strong and unique
- [ ] API rate limiting enabled
- [ ] Input validation implemented
- [ ] HTTPS only (automatic with Vercel)
- [ ] Dependencies updated

## Useful Commands

```bash
# Deploy to production
vercel --prod

# Deploy to preview
vercel

# View deployments
vercel ls

# View logs
vercel logs <deployment-url>

# Remove deployment
vercel rm <deployment-url>

# Link local project
vercel link

# Pull environment variables
vercel env pull

# Add environment variable
vercel env add
```

## Cost Estimation

### Vercel Free Tier (Hobby)
- ✅ Unlimited deployments
- ✅ 100 GB bandwidth/month
- ✅ Serverless function execution
- ✅ Automatic HTTPS
- ✅ Preview deployments

### Vercel Pro ($20/month)
- Everything in Free
- 1 TB bandwidth
- Advanced analytics
- Team collaboration
- Priority support

## Alternative Platforms

If Vercel doesn't fit your needs:

### Railway (Good for Socket.IO)
- Traditional server support
- WebSocket support
- $5/month starter

### Render
- Free tier available
- Traditional server support
- WebSocket support

### Netlify
- Similar to Vercel
- Good for static sites
- Serverless functions

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Monorepo Guide](https://vercel.com/docs/concepts/monorepos)
- [Vercel Discord](https://vercel.com/discord)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)

## Next Steps

1. ✅ Deploy backend first
2. ✅ Test backend endpoints
3. ✅ Deploy frontend apps
4. ✅ Test end-to-end functionality
5. ✅ Set up custom domains (optional)
6. ✅ Configure monitoring
7. ✅ Set up CI/CD with GitHub

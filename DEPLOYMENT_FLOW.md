# 🔄 Deployment Flow Diagram

## Quick Deployment Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    START DEPLOYMENT                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 1: Prerequisites                                       │
│  ✓ Install Vercel CLI: npm install -g vercel               │
│  ✓ MongoDB Atlas account + connection string                │
│  ✓ Cloudinary account (for file uploads)                   │
│  ✓ Pusher account (for real-time features)                 │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 2: Deploy Backend                                      │
│  $ cd Task/backend                                           │
│  $ vercel login                                              │
│  $ vercel --prod                                             │
│                                                              │
│  Result: https://your-backend-abc123.vercel.app             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 3: Configure Environment Variables                     │
│  Go to: Vercel Dashboard → Project → Settings → Env Vars   │
│                                                              │
│  Add:                                                        │
│  • MONGODB_URI                                              │
│  • JWT_SECRET                                               │
│  • CLOUDINARY_CLOUD_NAME                                    │
│  • CLOUDINARY_API_KEY                                       │
│  • CLOUDINARY_API_SECRET                                    │
│  • PUSHER_APP_ID, PUSHER_KEY, PUSHER_SECRET                │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 4: Redeploy Backend                                    │
│  $ vercel --prod                                             │
│                                                              │
│  (Applies environment variables)                             │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 5: Test Backend                                        │
│  $ curl https://your-backend.vercel.app/                    │
│  $ curl https://your-backend.vercel.app/api/test            │
│                                                              │
│  ✓ Should return success responses                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 6: Update Frontend Configuration                       │
│                                                              │
│  Create .env.production in each frontend:                   │
│  • Task/frontend/.env.production                            │
│  • Task/admin/.env.production                               │
│  • Task/tourcompanydashboard/.env.production                │
│                                                              │
│  Content:                                                    │
│  REACT_APP_API_URL=https://your-backend.vercel.app         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 7: Deploy Frontends                                    │
│                                                              │
│  User Frontend:                                              │
│  $ cd Task/frontend && vercel --prod                        │
│                                                              │
│  Admin Dashboard:                                            │
│  $ cd Task/admin && vercel --prod                           │
│                                                              │
│  Company Dashboard:                                          │
│  $ cd Task/tourcompanydashboard && vercel --prod            │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 8: Update CORS in Backend                              │
│                                                              │
│  Edit Task/backend/index.js:                                │
│  Add your deployed frontend URLs to allowedOrigins          │
│                                                              │
│  $ cd Task/backend && vercel --prod                         │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│  Step 9: Test End-to-End                                     │
│  ✓ Open frontend in browser                                 │
│  ✓ Test authentication                                       │
│  ✓ Test API calls                                            │
│  ✓ Test file uploads                                         │
│  ✓ Test real-time features                                  │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                  DEPLOYMENT COMPLETE! 🎉                     │
└─────────────────────────────────────────────────────────────┘
```

## Deployment Options Comparison

```
┌──────────────────────────────────────────────────────────────┐
│                    DEPLOYMENT OPTIONS                         │
└──────────────────────────────────────────────────────────────┘

Option 1: Separate Deployments (Recommended)
├── Backend → Vercel Project 1
├── Frontend → Vercel Project 2
├── Admin → Vercel Project 3
└── Company → Vercel Project 4

Pros:
✓ Independent scaling
✓ Easier debugging
✓ Separate domains
✓ Better control

Cons:
✗ More projects to manage
✗ Need to configure CORS


Option 2: Monorepo Deployment
└── All apps → Single Vercel Project
    ├── Backend at /api/*
    ├── Frontend at /*
    ├── Admin at /admin/*
    └── Company at /company/*

Pros:
✓ Single deployment
✓ Shared domain
✓ Simplified CORS

Cons:
✗ More complex config
✗ Harder to debug
✗ All deploy together


Option 3: Hybrid Approach
├── Backend → Vercel
├── Frontend Apps → Vercel
└── Socket.IO → Railway/Render

Pros:
✓ Socket.IO works
✓ Best of both worlds
✓ Flexible scaling

Cons:
✗ Multiple platforms
✗ More complex setup
```

## File Upload Flow

```
┌──────────────────────────────────────────────────────────────┐
│                    FILE UPLOAD FLOW                           │
└──────────────────────────────────────────────────────────────┘

Traditional (Won't work on Vercel):
User → Frontend → Backend → Local Filesystem ✗

With Cloudinary (Works on Vercel):
User → Frontend → Backend → Cloudinary → CDN ✓

Flow:
1. User selects file in frontend
2. Frontend sends file to backend API
3. Backend uses multer + cloudinary storage
4. File uploads directly to Cloudinary
5. Cloudinary returns URL
6. Backend saves URL to MongoDB
7. Frontend displays image from Cloudinary CDN
```

## Real-time Communication Flow

```
┌──────────────────────────────────────────────────────────────┐
│              REAL-TIME COMMUNICATION FLOW                     │
└──────────────────────────────────────────────────────────────┘

Socket.IO (Won't work on Vercel):
Client ←→ WebSocket ←→ Server ✗

Pusher (Works on Vercel):
Client ←→ Pusher ←→ Backend API ✓

Flow:
1. Backend triggers event via Pusher API
2. Pusher broadcasts to subscribed clients
3. Clients receive real-time updates

Example:
Backend: pusher.trigger('tours', 'approval-request', data)
Frontend: channel.bind('approval-request', callback)
```

## Environment Variables Flow

```
┌──────────────────────────────────────────────────────────────┐
│              ENVIRONMENT VARIABLES FLOW                       │
└──────────────────────────────────────────────────────────────┘

Development:
.env (local) → process.env → Application

Production (Vercel):
Vercel Dashboard → Environment Variables → Deployment → Application

Setup:
1. Create .env.example (template)
2. Create .env (local, don't commit)
3. Add variables in Vercel Dashboard
4. Redeploy to apply changes
```

## Troubleshooting Decision Tree

```
┌──────────────────────────────────────────────────────────────┐
│                 TROUBLESHOOTING FLOW                          │
└──────────────────────────────────────────────────────────────┘

Deployment Failed?
├─ Build Error?
│  ├─ Check package.json dependencies
│  ├─ Check Node.js version
│  └─ Review build logs
│
├─ MongoDB Connection Failed?
│  ├─ Check connection string
│  ├─ Whitelist IPs (0.0.0.0/0)
│  └─ Verify database user permissions
│
├─ CORS Error?
│  ├─ Add frontend URL to allowedOrigins
│  ├─ Check environment variables
│  └─ Redeploy backend
│
├─ File Upload Failed?
│  ├─ Install Cloudinary
│  ├─ Add Cloudinary credentials
│  └─ Update upload middleware
│
└─ Socket.IO Not Working?
   ├─ Expected on Vercel
   ├─ Migrate to Pusher
   └─ Or deploy Socket.IO separately
```

## Deployment Timeline

```
┌──────────────────────────────────────────────────────────────┐
│                   ESTIMATED TIMELINE                          │
└──────────────────────────────────────────────────────────────┘

Prerequisites Setup:           30-60 minutes
├─ MongoDB Atlas setup:        10 min
├─ Cloudinary setup:           10 min
├─ Pusher setup:               10 min
└─ Vercel CLI install:         5 min

Backend Deployment:            15-30 minutes
├─ Initial deploy:             5 min
├─ Environment variables:      10 min
├─ Testing:                    10 min
└─ Fixes (if needed):          15 min

Frontend Deployments:          30-45 minutes
├─ User frontend:              10 min
├─ Admin dashboard:            10 min
├─ Company dashboard:          10 min
└─ Testing:                    15 min

Total Time:                    1.5 - 2.5 hours

With Experience:               30-45 minutes
```

## Success Checklist

```
┌──────────────────────────────────────────────────────────────┐
│                    SUCCESS CRITERIA                           │
└──────────────────────────────────────────────────────────────┘

Backend:
✓ Deployed to Vercel
✓ Environment variables configured
✓ MongoDB connected
✓ API endpoints responding
✓ Authentication working
✓ File uploads working (Cloudinary)
✓ Real-time features working (Pusher)

Frontend:
✓ All apps deployed
✓ API connection working
✓ Authentication working
✓ CORS configured correctly
✓ File uploads working
✓ Real-time updates working

Testing:
✓ User registration/login
✓ Tour creation/viewing
✓ File uploads
✓ Real-time notifications
✓ Admin dashboard access
✓ Company dashboard access
```

## Quick Reference Commands

```bash
# Deploy backend
cd Task/backend && vercel --prod

# Deploy frontend
cd Task/frontend && vercel --prod

# Deploy admin
cd Task/admin && vercel --prod

# Deploy company
cd Task/tourcompanydashboard && vercel --prod

# View logs
vercel logs <deployment-url>

# List deployments
vercel ls

# Add environment variable
vercel env add

# Pull environment variables
vercel env pull
```

## Support Resources

```
Documentation:
├─ Quick Start:           backend/QUICK_START.md
├─ Full Guide:            backend/VERCEL_DEPLOYMENT.md
├─ Checklist:             backend/DEPLOYMENT_CHECKLIST.md
├─ Pusher Migration:      backend/PUSHER_MIGRATION.md
└─ Monorepo Guide:        MONOREPO_DEPLOYMENT.md

External Resources:
├─ Vercel Docs:           https://vercel.com/docs
├─ MongoDB Atlas:         https://docs.atlas.mongodb.com
├─ Cloudinary:            https://cloudinary.com/documentation
└─ Pusher:                https://pusher.com/docs

Community:
├─ Vercel Discord:        https://vercel.com/discord
├─ Vercel GitHub:         https://github.com/vercel/vercel
└─ Stack Overflow:        Tag: vercel, mongodb, cloudinary
```

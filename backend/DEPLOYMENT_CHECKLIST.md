# Vercel Deployment Checklist

## Pre-Deployment

### 1. Code Preparation
- [x] `vercel.json` configuration created
- [x] `index.js` updated to export app for Vercel
- [x] Package.json scripts updated
- [ ] Remove sensitive data from code (API keys, passwords)
- [ ] Update hardcoded URLs to use environment variables

### 2. Environment Variables
- [ ] Create `.env.production` file locally (don't commit!)
- [ ] List all required environment variables:
  - [ ] `MONGODB_URI`
  - [ ] `JWT_SECRET`
  - [ ] `FRONTEND_URL`
  - [ ] `ADMIN_URL`
  - [ ] `COMPANY_URL`
  - [ ] `CLOUDINARY_CLOUD_NAME` (if using)
  - [ ] `CLOUDINARY_API_KEY` (if using)
  - [ ] `CLOUDINARY_API_SECRET` (if using)
  - [ ] `PUSHER_APP_ID` (if using)
  - [ ] `PUSHER_KEY` (if using)
  - [ ] `PUSHER_SECRET` (if using)
  - [ ] `PUSHER_CLUSTER` (if using)
  - [ ] Other API keys

### 3. Database Configuration
- [ ] MongoDB Atlas account created
- [ ] Database cluster created
- [ ] Network access configured (allow 0.0.0.0/0 for Vercel)
- [ ] Database user created with proper permissions
- [ ] Connection string tested

### 4. File Upload Strategy
Choose one:
- [ ] Option A: Migrate to Cloudinary
- [ ] Option B: Migrate to AWS S3
- [ ] Option C: Use Vercel Blob Storage
- [ ] Update upload middleware accordingly

### 5. Real-time Communication
Choose one:
- [ ] Option A: Migrate to Pusher (recommended for Vercel)
- [ ] Option B: Deploy Socket.IO on separate server (Railway/Render)
- [ ] Option C: Use Ably or other WebSocket service
- [ ] Update frontend socket connections

## Deployment Steps

### 6. Install Vercel CLI
```bash
npm install -g vercel
```

### 7. Login to Vercel
```bash
vercel login
```

### 8. Initial Deployment
```bash
cd Task/backend
vercel
```

### 9. Configure Environment Variables in Vercel
1. Go to Vercel Dashboard
2. Select your project
3. Settings → Environment Variables
4. Add all variables from step 2

### 10. Deploy to Production
```bash
vercel --prod
```

## Post-Deployment

### 11. Testing
- [ ] Test root endpoint: `https://your-app.vercel.app/`
- [ ] Test API endpoint: `https://your-app.vercel.app/api/test`
- [ ] Test authentication endpoints
- [ ] Test file upload (if applicable)
- [ ] Test database operations
- [ ] Test real-time features (if applicable)

### 12. Frontend Configuration
- [ ] Update frontend API URLs to Vercel deployment URL
- [ ] Update CORS origins in backend
- [ ] Deploy frontend applications
- [ ] Test end-to-end functionality

### 13. Monitoring
- [ ] Check Vercel logs for errors
- [ ] Set up error monitoring (Sentry, LogRocket, etc.)
- [ ] Monitor database connections
- [ ] Monitor API response times

### 14. Domain Configuration (Optional)
- [ ] Purchase domain (if needed)
- [ ] Add custom domain in Vercel
- [ ] Configure DNS settings
- [ ] Enable SSL (automatic with Vercel)

## Common Issues & Solutions

### Issue: MongoDB Connection Fails
**Solution:**
- Whitelist all IPs (0.0.0.0/0) in MongoDB Atlas
- Check connection string format
- Verify database user permissions

### Issue: CORS Errors
**Solution:**
- Add Vercel deployment URL to `allowedOrigins`
- Set environment variables correctly
- Check frontend is using correct API URL

### Issue: File Upload Fails
**Solution:**
- Implement cloud storage (Cloudinary/S3)
- Don't rely on local filesystem
- Update upload middleware

### Issue: Socket.IO Not Working
**Solution:**
- Migrate to Pusher or similar service
- Or deploy Socket.IO separately on Railway/Render

### Issue: Environment Variables Not Working
**Solution:**
- Redeploy after adding variables
- Check variable names match exactly
- Ensure no typos in variable names

### Issue: Function Timeout
**Solution:**
- Optimize database queries
- Add indexes to MongoDB collections
- Consider upgrading Vercel plan (10s → 60s timeout)

## Performance Optimization

### 15. Database Optimization
- [ ] Add indexes to frequently queried fields
- [ ] Optimize aggregation pipelines
- [ ] Use lean() for read-only queries
- [ ] Implement pagination

### 16. API Optimization
- [ ] Enable compression
- [ ] Implement caching (Redis/Vercel KV)
- [ ] Optimize image sizes
- [ ] Use CDN for static assets

### 17. Security
- [ ] Enable rate limiting
- [ ] Implement input validation
- [ ] Use helmet.js for security headers
- [ ] Keep dependencies updated
- [ ] Use HTTPS only

## Rollback Plan

If deployment fails:
```bash
# List deployments
vercel ls

# Promote previous deployment
vercel promote <deployment-url>

# Or rollback in Vercel Dashboard
```

## Useful Commands

```bash
# Deploy to preview
vercel

# Deploy to production
vercel --prod

# View logs
vercel logs

# View deployments
vercel ls

# Remove deployment
vercel rm <deployment-url>

# Environment variables
vercel env ls
vercel env add
vercel env rm
```

## Support Resources

- [Vercel Documentation](https://vercel.com/docs)
- [Vercel Community](https://github.com/vercel/vercel/discussions)
- [MongoDB Atlas Support](https://www.mongodb.com/cloud/atlas/support)
- [Pusher Support](https://support.pusher.com/)

## Estimated Timeline

- Code preparation: 2-4 hours
- Environment setup: 1-2 hours
- Initial deployment: 30 minutes
- Testing & debugging: 2-4 hours
- Frontend updates: 1-2 hours
- **Total: 6-12 hours**

## Notes

- Keep `.env` file secure and never commit it
- Test thoroughly in preview environment before production
- Monitor logs closely after first deployment
- Have rollback plan ready
- Document any custom configurations

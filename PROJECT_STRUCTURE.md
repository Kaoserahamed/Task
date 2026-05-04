# Project Structure

## Overview
This is a full-stack tour management application with separate frontend applications for users, admins, and tour companies.

## Directory Structure

```
Task/
├── backend/                      # Node.js/Express Backend API
│   ├── config/                   # Configuration files
│   │   ├── env.js               # Environment configuration
│   │   ├── constants.js         # Application constants
│   │   └── cloudinary.js        # Cloudinary configuration
│   ├── controllers/             # Route controllers
│   ├── middleware/              # Express middleware
│   ├── models/                  # MongoDB models
│   ├── routes/                  # API routes
│   ├── utils/                   # Utility functions
│   ├── uploads/                 # Local file uploads (dev only)
│   ├── .env                     # Environment variables (DO NOT COMMIT)
│   ├── .env.example             # Environment variables template
│   ├── index.js                 # Main entry point
│   ├── socket.js                # Socket.IO configuration
│   ├── package.json             # Dependencies
│   └── vercel.json              # Vercel deployment config
│
├── frontend/                    # User Frontend (React)
│   ├── public/                  # Static files
│   ├── src/
│   │   ├── Components/          # React components
│   │   ├── Context/             # React context providers
│   │   ├── Pages/               # Page components
│   │   ├── config/
│   │   │   └── api.js          # API configuration
│   │   ├── socket.js           # Socket.IO client
│   │   └── App.js              # Main app component
│   ├── .env.production          # Production environment variables
│   ├── package.json             # Dependencies
│   └── vercel.json              # Vercel deployment config (if needed)
│
├── admin/                       # Admin Dashboard (React)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   ├── context/
│   │   └── socket.js
│   ├── .env.production
│   └── package.json
│
├── tourcompanydashboard/        # Company Dashboard (React)
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   └── socket.js
│   ├── .env.production
│   └── package.json
│
└── recommendations/             # Recommendation system

```

## Key Files

### Backend
- **`config/env.js`**: Centralized environment configuration
- **`config/constants.js`**: Application constants (status codes, roles, etc.)
- **`index.js`**: Main server file with Express setup
- **`socket.js`**: Socket.IO configuration for real-time features
- **`.env`**: Environment variables (never commit this!)
- **`.env.example`**: Template for environment variables

### Frontend
- **`src/config/api.js`**: API endpoints and configuration
- **`src/socket.js`**: Socket.IO client configuration
- **`.env.production`**: Production environment variables

## Environment Variables

### Backend (.env)
```env
# Required
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your_secret

# Optional
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
COMPANY_URL=http://localhost:3002
WEATHER_API_KEY=...
SENDINBLUE_API_KEY=...
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

### Frontend (.env.production)
```env
REACT_APP_API_URL=https://your-backend.vercel.app
```

## Deployment URLs

### Production
- **Backend**: https://backend-eight-tan-16.vercel.app
- **Frontend**: https://frontend-blue-sigma-62.vercel.app
- **Admin**: https://admin-zeta-swart-18.vercel.app
- **Company**: https://tourcompanydashboard.vercel.app

## Technology Stack

### Backend
- Node.js
- Express.js
- MongoDB (Mongoose)
- Socket.IO (for real-time features)
- JWT (authentication)
- Multer (file uploads)
- Cloudinary (cloud storage)

### Frontend
- React
- React Router
- Axios
- Socket.IO Client
- Context API (state management)

## Development

### Start Backend
```bash
cd Task/backend
npm install
npm start
```

### Start Frontend
```bash
cd Task/frontend
npm install
npm start
```

### Start Admin
```bash
cd Task/admin
npm install
npm start
```

### Start Company Dashboard
```bash
cd Task/tourcompanydashboard
npm install
npm start
```

## Deployment

### Deploy Backend
```bash
cd Task/backend
vercel --prod
```

### Deploy Frontend
```bash
cd Task/frontend
vercel --prod
```

## Important Notes

1. **Never commit `.env` files** - They contain sensitive information
2. **Socket.IO doesn't work on Vercel** - Consider migrating to Pusher
3. **File uploads need cloud storage** - Use Cloudinary for production
4. **Environment variables** - Always use environment variables, never hardcode

## Documentation

All deployment information is in the main `README.md` file.

## Security

- All sensitive data in environment variables
- JWT for authentication
- CORS configured for specific origins
- Input validation on all endpoints
- MongoDB connection with authentication

## Best Practices Implemented

✅ Environment variables for all configuration
✅ Centralized configuration files
✅ Constants for magic numbers and strings
✅ Proper error handling
✅ CORS configuration
✅ Secure authentication
✅ Clean code structure
✅ Comprehensive documentation

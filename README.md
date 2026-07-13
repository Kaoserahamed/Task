# Tour Management System

A multi-tenant tour booking platform with dedicated interfaces for customers, tour operators, and administrators. Built to handle the complete lifecycle of tour discovery, booking, and management with real-time communication capabilities.

**Live Deployments:**
- Frontend: https://frontend-blue-sigma-62.vercel.app/
- Backend: https://backend-eight-tan-16.vercel.app/

---

## What This Does

This system provides three distinct user experiences:

**For Customers** – Browse tours, check availability, make bookings, save favorites, and chat directly with tour operators. Weather-based recommendations help users plan trips around optimal conditions.

**For Tour Companies** – Manage tour listings, track bookings, communicate with customers, and monitor performance metrics through a dedicated dashboard.

**For Administrators** – Review and approve tour submissions, manage user accounts, oversee company registrations, and access system-wide analytics.

---

## Tech Stack

**Backend**  
Node.js + Express, MongoDB (Mongoose), JWT authentication, Multer + Cloudinary for file handling, Socket.IO for real-time messaging, Sendinblue for transactional emails

**Frontend**  
React, React Router, Axios, Context API for state management, Socket.IO client

**Infrastructure**  
Vercel (hosting), MongoDB Atlas (database), Cloudinary (media storage)

---

## Project Structure

```
Task/
├── backend/                # Express API server
│   ├── config/            # Environment and service configs
│   ├── controllers/       # Business logic handlers
│   ├── middleware/        # Auth, error handling, file uploads
│   ├── models/            # Mongoose schemas
│   ├── routes/            # API route definitions
│   └── utils/             # Helper functions
├── frontend/              # Customer-facing React app
├── admin/                 # Admin dashboard (React)
├── tourcompanydashboard/  # Tour operator dashboard (React)
└── recommendations/       # Recommendation engine scripts
```

---

## Getting Started

### Prerequisites

- Node.js 14+
- MongoDB instance (local or Atlas)
- Cloudinary account (for production file uploads)

### Local Development Setup

**1. Clone and navigate to the project**

```bash
git clone <repository-url>
cd Task
```

**2. Install dependencies for all applications**

```bash
# Backend
cd backend && npm install

# Frontend applications
cd ../frontend && npm install
cd ../admin && npm install
cd ../tourcompanydashboard && npm install
```

**3. Configure environment variables**

Copy the example environment file in the backend:

```bash
cd backend
cp .env.example .env
```

Edit `.env` with your credentials (see [Environment Configuration](#environment-configuration) below).

**4. Start all services**

Open separate terminal windows for each:

```bash
# Terminal 1 - Backend (runs on port 4000)
cd backend && npm start

# Terminal 2 - User Frontend (runs on port 3000)
cd frontend && npm start

# Terminal 3 - Admin Dashboard (runs on port 3001)
cd admin && npm start

# Terminal 4 - Company Dashboard (runs on port 3002)
cd tourcompanydashboard && npm start
```

---

## Environment Configuration

### Backend `.env`

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# CORS Origins
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
COMPANY_URL=http://localhost:3002

# External Services
WEATHER_API_KEY=your_weather_api_key
SENDINBLUE_API_KEY=your_sendinblue_api_key

# Cloudinary (required for production)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend `.env.production`

Each React app needs its own production environment file:

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

---

## Production Deployment

### Quick Start

This project uses a **free-tier deployment strategy**:
- **Backend**: Render (supports Socket.IO with persistent connections)
- **Frontends**: Vercel (static hosting with CDN)
- **Database**: MongoDB Atlas (512MB free cluster)
- **Storage**: Cloudinary (25GB free tier)

### Deployment Steps

**1. Prerequisites**
- GitHub account with this repository
- Render account (sign up at https://render.com)
- Vercel account (sign up at https://vercel.com)
- MongoDB Atlas account (sign up at https://mongodb.com/cloud/atlas)
- Cloudinary account (sign up at https://cloudinary.com)

**2. Deploy Backend to Render**
```bash
# Push your code to GitHub first
git push origin main

# Then in Render dashboard:
# - Create new Web Service
# - Connect GitHub repository
# - Root Directory: backend
# - Build Command: npm install
# - Start Command: node index.js
# - Add all environment variables (see DEPLOYMENT_GUIDE.md)
```

**3. Deploy Frontends to Vercel**
```bash
# In Vercel dashboard, create 3 separate projects:

# Project 1: Frontend
# - Root Directory: frontend
# - Build Command: npm run build
# - Output Directory: build

# Project 2: Admin
# - Root Directory: admin
# - Build Command: npm run build
# - Output Directory: build

# Project 3: Company Dashboard
# - Root Directory: tourcompanydashboard
# - Build Command: npm run build
# - Output Directory: build
```

**4. Configure Environment Variables**

Each deployment needs specific environment variables. See the comprehensive [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for:
- Complete environment variable list
- MongoDB Atlas setup instructions
- Cloudinary configuration
- CORS configuration
- Cold-start optimization
- Troubleshooting common issues

### Continuous Deployment

Both Render and Vercel automatically deploy when you push to GitHub:
```bash
git add .
git commit -m "Your changes"
git push origin main
# Deployments trigger automatically
```

---

## Architecture Notes

### Critical Production Considerations

**Socket.IO Deployment Strategy**  
Socket.IO requires persistent WebSocket connections, which are not supported on serverless platforms like Vercel. The backend **must** be deployed to a platform with persistent processes (Render, Railway, or traditional VPS). This is why our deployment strategy uses Render for the backend and Vercel only for static frontend builds.

**File Upload Requirements**  
Production environments often have read-only filesystems. All file uploads (tour images, user avatars, etc.) are configured to use Cloudinary cloud storage. Ensure `CLOUDINARY_*` environment variables are properly set before deploying.

**CORS Configuration**  
The backend validates requests against the `FRONTEND_URL`, `ADMIN_URL`, and `COMPANY_URL` environment variables. These must be updated with your actual production frontend URLs after deployment. The backend will need to be redeployed after updating these values.

**Cold Start Handling**  
Free-tier hosting (Render) spins down after 15 minutes of inactivity. The first request after spin-down may take 30-60 seconds. See [DEPLOYMENT_GUIDE.md](./DEPLOYMENT_GUIDE.md) for cold-start optimization strategies including keep-alive services and graceful loading states.

---

## API Reference

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/user/auth/register` | Register new user account |
| POST | `/user/auth/login` | Authenticate and receive JWT |
| POST | `/user/auth/reset` | Request password reset email |
| POST | `/user/auth/reset-password` | Complete password reset |

### Tours

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tours/approved` | List all approved tours |
| GET | `/api/tours/:id` | Get single tour details |
| POST | `/api/tours` | Create new tour (company only) |
| PUT | `/api/tours/:id` | Update tour (company only) |
| DELETE | `/api/tours/:id` | Delete tour (company only) |
| PATCH | `/api/tours/:id/increment-view` | Track tour page view |
| PATCH | `/api/tours/:id/book-seats` | Reserve seats for booking |

### Reviews

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/reviews` | Get all reviews |
| GET | `/reviews/tour/:id` | Get reviews for specific tour |
| POST | `/reviews` | Submit new review (authenticated) |

### Bookings

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/bookings` | Get user's bookings |
| POST | `/api/bookings/add` | Create new booking |

---

## Security

- JWT-based authentication with configurable expiration
- Bcrypt password hashing (10 rounds)
- CORS whitelist for frontend origins
- Input validation on all endpoints
- Environment variable isolation
- MongoDB connection with authentication enabled

---

## Contributing

We welcome contributions. Please follow these steps:

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/your-feature-name`)
3. Commit your changes with clear messages
4. Push to your fork and submit a pull request
5. Ensure all existing functionality remains intact

---

## License

ISC License

---

## Acknowledgments

Built with MongoDB Atlas, Vercel, and Cloudinary. Thanks to all contributors and testers who helped refine this platform.

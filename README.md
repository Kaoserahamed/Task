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




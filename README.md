# Tour Management System

A full-stack tour management application with separate interfaces for users, administrators, and tour companies.

## 🚀 Live Deployment

- **User Frontend**: https://frontend-blue-sigma-62.vercel.app
- **Admin Dashboard**: https://admin-zeta-swart-18.vercel.app
- **Company Dashboard**: https://tourcompanydashboard.vercel.app
- **Backend API**: https://backend-eight-tan-16.vercel.app

## 📋 Table of Contents

- [Features](#features)
- [Technology Stack](#technology-stack)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [API Documentation](#api-documentation)

## ✨ Features

### User Features
- Browse and search tours
- View tour details and reviews
- Book tours and manage bookings
- Wishlist functionality
- Real-time chat with tour companies
- Weather-based recommendations

### Admin Features
- Approve/reject tour submissions
- Manage users and companies
- View analytics and reports
- Monitor bookings and reviews

### Company Features
- Create and manage tours
- View booking statistics
- Chat with customers
- Manage tour availability

## 🛠 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB (Mongoose)
- **Authentication**: JWT
- **File Upload**: Multer + Cloudinary
- **Real-time**: Socket.IO
- **Email**: Sendinblue/Brevo

### Frontend
- **Framework**: React
- **Routing**: React Router
- **HTTP Client**: Axios
- **State Management**: Context API
- **Real-time**: Socket.IO Client

### Deployment
- **Platform**: Vercel
- **Database Hosting**: MongoDB Atlas
- **File Storage**: Cloudinary

## 📁 Project Structure

```
Task/
├── backend/                 # Backend API
│   ├── config/             # Configuration files
│   ├── controllers/        # Route controllers
│   ├── middleware/         # Express middleware
│   ├── models/             # MongoDB models
│   ├── routes/             # API routes
│   └── utils/              # Utility functions
├── frontend/               # User frontend
├── admin/                  # Admin dashboard
├── tourcompanydashboard/   # Company dashboard
└── recommendations/        # Recommendation system
```

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB
- npm or yarn

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd Task
```

2. **Install backend dependencies**
```bash
cd backend
npm install
```

3. **Install frontend dependencies**
```bash
cd ../frontend
npm install

cd ../admin
npm install

cd ../tourcompanydashboard
npm install
```

4. **Set up environment variables**

Create `.env` file in the backend directory:
```bash
cd ../backend
cp .env.example .env
```

Edit `.env` with your configuration (see [Environment Variables](#environment-variables))

5. **Start development servers**

Backend:
```bash
cd backend
npm start
```

Frontend:
```bash
cd frontend
npm start
```

Admin:
```bash
cd admin
npm start
```

Company Dashboard:
```bash
cd tourcompanydashboard
npm start
```

## 🔐 Environment Variables

### Backend (.env)

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database

# Authentication
JWT_SECRET=your_jwt_secret_key
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
COMPANY_URL=http://localhost:3002

# External APIs
WEATHER_API_KEY=your_weather_api_key
SENDINBLUE_API_KEY=your_sendinblue_api_key

# File Upload (Cloudinary)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

### Frontend (.env.production)

```env
REACT_APP_API_URL=https://your-backend-url.vercel.app
```

## 🚢 Deployment

### Deploy to Vercel

1. **Install Vercel CLI**
```bash
npm install -g vercel
```

2. **Login to Vercel**
```bash
vercel login
```

3. **Deploy Backend**
```bash
cd backend
vercel --prod
```

4. **Add environment variables in Vercel Dashboard**
   - Go to your project settings
   - Add all environment variables from `.env`

5. **Deploy Frontends**
```bash
cd frontend
vercel --prod

cd ../admin
vercel --prod

cd ../tourcompanydashboard
vercel --prod
```

### Important Notes

- **Socket.IO**: Doesn't work on Vercel serverless. Consider migrating to Pusher for real-time features.
- **File Uploads**: Use Cloudinary for production (local filesystem is read-only on Vercel)
- **Environment Variables**: Always set in Vercel dashboard after deployment

## 📚 API Documentation

### Authentication Endpoints

```
POST /user/auth/register    - Register new user
POST /user/auth/login       - Login user
POST /user/auth/reset       - Request password reset
POST /user/auth/reset-password - Reset password
```

### Tour Endpoints

```
GET    /api/tours/approved           - Get all approved tours
GET    /api/tours/:id                - Get tour by ID
POST   /api/tours                    - Create new tour
PUT    /api/tours/:id                - Update tour
DELETE /api/tours/:id                - Delete tour
PATCH  /api/tours/:id/increment-view - Increment view count
PATCH  /api/tours/:id/book-seats     - Book tour seats
```

### Review Endpoints

```
GET  /reviews              - Get all reviews
GET  /reviews/tour/:id     - Get reviews for specific tour
POST /reviews              - Create new review
```

### Booking Endpoints

```
GET  /api/bookings         - Get user bookings
POST /api/bookings/add     - Create new booking
```

## 🔒 Security

- JWT-based authentication
- Password hashing with bcrypt
- CORS configuration
- Input validation
- Environment variable protection
- MongoDB connection with authentication

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the ISC License.

## 📧 Contact

For any queries or support, please contact the development team.

## 🙏 Acknowledgments

- MongoDB Atlas for database hosting
- Vercel for deployment platform
- Cloudinary for file storage
- All contributors and testers

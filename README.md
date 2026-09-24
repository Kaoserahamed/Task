# Tour Management System

A comprehensive multi-tenant tour booking and management platform enabling customers to discover and book tours, tour operators to manage listings and bookings, and administrators to oversee the entire system. Features real-time communication, AI-powered recommendations, and weather-based suggestions.

## Documentation

| Where                                        | What it covers                                               |
| -------------------------------------------- | ------------------------------------------------------------ |
| [docs/README.md](docs/README.md)             | Index of every document in this repository                   |
| [docs/development.md](docs/development.md)   | Local setup, one-command installs, day-to-day workflow       |
| [docs/testing.md](docs/testing.md)           | Unit vs integration suites, coverage gates, how to add tests |
| [docs/architecture.md](docs/architecture.md) | Layered backend, the four apps, data flow and boundaries     |
| [docs/security.md](docs/security.md)         | Auth model, secrets, CORS, rate limiting, seeding policy     |
| [docs/ci-cd.md](docs/ci-cd.md)               | Pipeline gates, artifacts, and how to reproduce CI locally   |
| [docs/operations.md](docs/operations.md)     | Health probes, logs, container operations, runbook           |
| [docs/api.md](docs/api.md)                   | REST surface, error envelope and status codes                |
| [docs/adr/](docs/adr/)                       | Architecture decision records                                |
| [CONTRIBUTING.md](CONTRIBUTING.md)           | Commit conventions, review workflow, quality gates           |
| [SECURITY.md](SECURITY.md)                   | How to report a vulnerability                                |
| [CHANGELOG.md](CHANGELOG.md)                 | Notable changes per release                                  |

**One command to install everything:** `npm run setup` (from the repository root).
**One command to prove the repository is healthy:** `npm run verify`.

## Live Demo

### Production URLs

- **Frontend (Customer)**: https://frontend-kaoser614-7344s-projects.vercel.app
- **Admin Dashboard**: https://admin-zeta-swart-18.vercel.app
- **Company Dashboard**: https://tourcompany-zeta.vercel.app
- **Backend API**: https://backend-kaoser614-7344s-projects.vercel.app

### Demo Accounts

Test the system with these pre-configured accounts. Seed them locally with
`node backend/scripts/seedDemoAccounts.js` after setting `DEMO_*_PASSWORD`
values in `backend/.env` (see `backend/.env.example`):

**Customer Account**

- Email: `user@demo.com`
- Password: value of `DEMO_USER_PASSWORD`

**Admin Account**

- Email: `admin@demo.com`
- Password: value of `DEMO_ADMIN_PASSWORD`

**Company Account**

- Email: `company@demo.com`
- Password: value of `DEMO_COMPANY_PASSWORD`

## Screenshots

<img width="1917" height="867" alt="Screenshot 2026-09-08 100815" src="https://github.com/user-attachments/assets/ac3e23c4-fbf5-4475-b0a7-9f3c1341e43a" />

## Key Features

**For Customers**

- Browse tours with filtering and search capabilities
- Make bookings with real-time availability checking
- Save favorite tours to wishlist
- Real-time chat with tour operators
- Write and view tour reviews and ratings
- Explore hotels and restaurants at destinations
- Weather-based tour recommendations
- Account management and booking history

**For Tour Operators/Companies**

- Create and manage tour packages with detailed information
- Real-time booking management dashboard
- Communicate with customers through chat
- Monitor tour performance and analytics
- Upload tour images and media
- License and registration management

**For Administrators**

- Approve/reject tour submissions from companies
- Manage user accounts and registrations
- Monitor system-wide analytics and reports
- Support chat with users and companies
- Destination search and management
- View all bookings across the platform

## Tech Stack

**Backend**

- Node.js + Express.js
- MongoDB with Mongoose ODM
- JWT authentication
- Socket.IO for real-time messaging
- Multer + Cloudinary for image uploads
- Pusher for real-time updates
- Sendinblue for email notifications

**Frontend Applications**

- React 19 with React Router v7
- A single fetch-based API layer per app (`src/api/`), see
  [docs/frontend.md](docs/frontend.md)
- Context API for state management
- Socket.IO client for real-time features
- Lucide React for UI icons
- Stripe integration for payments

**Infrastructure**

- Vercel for hosting (backend and frontend)
- MongoDB Atlas for database
- Cloudinary for media storage and CDN

## Architecture

The system consists of four independent React applications served by a single Node.js/Express backend:

1. **Customer Frontend** (port 3000) - Tour discovery, booking, and communication
2. **Admin Dashboard** (port 3001) - System administration and oversight
3. **Company Dashboard** (port 3002) - Tour operator management interface
4. **Backend API** (port 4000) - RESTful API serving all frontends

All frontends connect to the backend API through the `src/api/` layer described
in [docs/frontend.md](docs/frontend.md), plus Socket.IO for real-time features.

## Project Structure

```
Task/
├── backend/                    # Express API server
│   ├── config/                # Configuration files (env, Cloudinary, upload)
│   ├── controllers/           # Business logic (tours, bookings, chat, weather, etc.)
│   ├── middleware/            # Auth, error handling, file upload
│   ├── models/                # MongoDB schemas (User, Tour, Booking, Chat, etc.)
│   ├── routes/                # API route definitions
│   ├── utils/                 # Helpers (tourRecommender, socketHelper)
│   ├── data/                  # CSV data for recommendations
│   └── index.js              # Server entry point
│
├── frontend/                   # Customer-facing React app
│   └── src/
│       ├── Pages/            # Page components
│       ├── Components/        # Reusable components
│       ├── Context/          # Auth and tour state management
│       └── App.js            # Main app component
│
├── admin/                      # Admin dashboard React app
│   └── src/
│       ├── components/       # Dashboard components
│       ├── context/          # Auth context
│       └── App.js           # Admin app component
│
├── tourcompanydashboard/       # Company operator React app
│   └── src/
│       ├── Components/       # Tour management components
│       ├── Context/          # Auth and tour context
│       └── App.js           # Company app component
│
├── recommendations/            # ML recommendation engine
│   ├── recommend.ipynb        # Jupyter notebook for analysis
│   └── tour_association_rules.csv  # Association rules data
│
└── deploy.sh/deploy.ps1       # Deployment automation scripts
```

## Installation & Setup

### Prerequisites

- Node.js 20+ and npm (see `.nvmrc`)
- MongoDB (local or MongoDB Atlas account)
- Docker (optional — for the compose stack and the integration suite)
- Cloudinary account (free tier available)
- Sendinblue account (for email notifications)
- OpenWeatherMap API key (for weather features)

### Dev container (zero-install)

Open the repository in a dev container (VS Code _Dev Containers: Reopen in
Container_, or a Codespace): it installs Node 20, Docker, the workspace
dependencies and the editor extensions for you. See
[docs/development.md](docs/development.md#dev-container-zero-install-onboarding).

### Docker (one-command startup)

The fastest way to run the backend API and MongoDB is Docker Compose:

```bash
# Start MongoDB + backend API (http://localhost:4000)
docker compose up -d

# Stop everything
docker compose down

# Reset the database volume as well
docker compose down -v
```

The compose file starts:

- **mongo** — MongoDB 7 with a persistent data volume (`mongo_data`) and a health check the backend waits on
- **backend** — the Express API, pre-wired to `mongodb://mongo:27017/tourmate`

The image installs locked production dependencies, runs as the unprivileged
`node` user (never root) and declares a `HEALTHCHECK` against `/health/live`, so
a database outage does not restart a healthy container. Details and the exact
guarantees: [docs/operations.md](docs/operations.md#the-api-image).

Optional secrets (Cloudinary, Pusher, email, demo passwords) can be provided by uncommenting the `env_file` line in `docker-compose.yml` or by passing environment variables.

### Local Development Setup

1. **Clone and navigate to project**

```bash
git clone <repository-url>
cd Task
```

2. **Install dependencies for all applications**

```bash
# Backend
cd backend && npm install && cd ..

# Frontend applications
cd frontend && npm install && cd ..
cd admin && npm install && cd ..
cd tourcompanydashboard && npm install && cd ..
```

3. **Configure environment variables**

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` with your credentials (see [Environment Configuration](#environment-variables) below).

4. **Start all services in separate terminals**

```bash
# Terminal 1: Backend API (port 4000)
cd backend && npm start

# Terminal 2: Customer Frontend (port 3000)
cd frontend && npm start

# Terminal 3: Admin Dashboard (port 3001)
cd admin && npm start

# Terminal 4: Company Dashboard (port 3002)
cd tourcompanydashboard && npm start
```

### Validation

Run the environment validation before deployment:

```bash
cd backend && npm run validate-env
```

## Environment Variables

Configure `backend/.env` with the following variables:

```env
# Database
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/database-name

# Authentication
JWT_SECRET=your-secure-jwt-secret-key
JWT_EXPIRES_IN=7d

# Server
PORT=4000
NODE_ENV=development

# Cloudinary (for image uploads)
CLOUDINARY_CLOUD_NAME=your-cloud-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret

# Email Notifications
SENDINBLUE_API_KEY=your-sendinblue-api-key

# Weather API
WEATHER_API_KEY=your-openweathermap-api-key

# URLs (for deployments)
FRONTEND_URL=http://localhost:3000
ADMIN_URL=http://localhost:3001
COMPANY_URL=http://localhost:3002
```

## How the System Works

### Authentication Flow

1. Users create account with email and password
2. Backend validates credentials and issues JWT token
3. Frontend stores token in localStorage
4. Protected routes validate token via middleware
5. Password reset via email link with secure tokens

### Tour Booking Flow

1. Customers browse available tours filtered by category, price, duration
2. Customer selects tour and books with personal/payment details
3. System creates booking record and notifies tour operator
4. Operator confirms or cancels booking via dashboard
5. Customer receives confirmation and booking updates via email

### Real-time Communication

1. Customer and operator initiate chat conversation
2. Messages transmitted via Socket.IO for instant delivery
3. System maintains chat history in MongoDB
4. Notifications sent for new messages and booking updates

### Tour Recommendations

1. System analyzes booking transaction patterns
2. Association rule mining identifies destination relationships
3. When customer selects destination, engine recommends related tours
4. Weather API provides seasonal tour recommendations

### Image Management

1. Tour operators upload images via form
2. Multer middleware processes uploads to Cloudinary
3. Cloudinary returns optimized image URLs
4. Frontend displays images with CDN acceleration

## API Documentation

### Main API Endpoints

**Authentication**

- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/reset-password` - Reset password
- `POST /api/auth/new-password` - Set new password

**Tours**

- `GET /api/tours` - Get all tours with filters
- `GET /api/tours/:id` - Get tour details
- `POST /api/tours` - Create new tour (company)
- `PUT /api/tours/:id` - Update tour (company)
- `DELETE /api/tours/:id` - Delete tour (company)

**Bookings**

- `POST /api/bookings` - Create booking
- `GET /api/bookings` - Get user bookings
- `GET /api/bookings/:id` - Get booking details
- `PUT /api/bookings/:id/status` - Update booking status

**Chat**

- `GET /api/chat/conversations` - Get user conversations
- `POST /api/chat/send` - Send message
- `GET /api/chat/:conversationId/messages` - Get conversation history

**Reviews**

- `POST /api/reviews` - Submit tour review
- `GET /api/reviews/:tourId` - Get tour reviews

**Weather**

- `GET /api/weather/:destination` - Get weather for destination

**Wishlist**

- `POST /api/wishlist` - Add tour to wishlist
- `GET /api/wishlist` - Get user wishlist
- `DELETE /api/wishlist/:tourId` - Remove from wishlist

## Database Design

### Core Models

**User**

```
- name, email, password (hashed)
- avatar URL
- phone number
- password reset token
- created timestamp
```

**Tour**

```
- name, description
- duration (days/nights)
- package categories
- destinations
- start/end dates
- pricing (base + customizations)
- meals (breakfast, lunch, dinner)
- transportation details
- inclusions/exclusions
- weather conditions
- company reference
- booking limit
```

**Booking**

```
- user/email reference
- tour reference
- booking date
- passenger details
- total cost
- payment status
- booking status (pending/confirmed/cancelled)
- special requests
```

**Chat**

- participants (user, company, admin)
- message history with timestamps
- chat type (admin-company, admin-user, company-user)
- unread message count
- last message reference

**Company**

- company name and details
- license information
- tours owned
- verification status
- contact information

**Review**

- rating (1-5 stars)
- review text
- user reference
- tour reference
- helpful votes

## AI/ML Methodology & Results

### Approach

Uses **Association Rule Mining** to identify patterns in tour booking behaviors:

1. **Data Collection**: Aggregates historical booking transactions
2. **Rule Generation**: Identifies tours frequently booked together
3. **Metrics**:
   - Support: Frequency of tour combination
   - Confidence: Likelihood of booking B given A
   - Lift: Strength of association vs random chance

### Implementation

- Data stored in `tour_association_rules.csv` and transaction files
- `tourRecommender.js` loads rules and matches user selections
- Real-time recommendation engine suggests related tours
- Weather API provides seasonal adjustments

### Results

- Increased cross-tour bookings through recommendations
- Personalized suggestion engine based on user preferences
- Contextual recommendations (e.g., beach tours during summer)

## Security & Authentication

### Security Measures

1. **Password Security**
   - Passwords hashed with bcryptjs
   - Salting applied during registration
   - Password reset via secure email tokens

2. **API Authentication**
   - JWT tokens with expirable sessions
   - Tokens stored in secure localStorage
   - Token validation middleware on all protected routes

3. **Authorization**
   - Role-based access control (RBAC):
     - Customer: Access own bookings, reviews, wishlists
     - Company: Manage own tours and bookings
     - Admin: Full system access
   - Route guards on frontend and backend

4. **File Upload Security**
   - Multer middleware validates file types and sizes
   - Cloudinary handles secure storage and URL generation
   - Image optimizations applied by CDN

5. **Data Protection**
   - MongoDB connection via secure URI
   - Environment variables for sensitive credentials
   - CORS whitelisting for frontend domains
   - Error messages sanitized in production

6. **Real-time Security**
   - Socket.IO events validated with authentication
   - User permissions checked before data transmission

## Deployment

### Vercel Deployment

Deploy using provided scripts:

```bash
# Deploy all services
./deploy.sh all

# Or deploy individually
./deploy.sh backend
./deploy.sh frontend
./deploy.sh admin
./deploy.sh company
```

Windows users can use:

```powershell
.\deploy.ps1
```

### Environment Setup on Vercel

1. Set all environment variables in Vercel project settings
2. Ensure MongoDB URI is accessible from Vercel servers
3. Configure Cloudinary credentials in Vercel environment

## Future Improvements

- **Payment Integration**: Stripe/Razorpay for secure payments
- **Mobile Application**: React Native app for iOS/Android
- **Advanced Analytics**: Dashboard with revenue, booking trends
- **Multi-language Support**: Internationalization (i18n) implementation
- **Video Tours**: Virtual tour previews of destinations
- **Travel Insurance**: Integration with insurance providers
- **Group Discounts**: Dynamic pricing for group bookings
- **Itinerary Builder**: Custom multi-destination tour creation
- **Social Features**: Social sharing and tour reviews
- **Notification System**: Push notifications and reminders

## Development

Everything is driven from the repository root; each package also works on its own.

```bash
npm run setup              # install every package exactly as CI does (npm ci)
npm run verify             # lint + format + typecheck + repo guard + all test suites
npm run test:backend       # backend unit tests (hermetic: no database, no Docker)
npm run test:web           # the three React suites
npm run test:coverage      # coverage everywhere, plus the backend coverage gate
npm run test:backend:integration   # backend against a real MongoDB (needs one, see docs/testing.md)
npm run stack:up           # docker compose: MongoDB + API
```

Useful per-package commands:

```bash
npm --prefix backend run dev        # API with nodemon
npm --prefix frontend start         # customer app on :3000
npm --prefix admin start            # admin dashboard on :3001
npm --prefix tourcompanydashboard start   # company dashboard on :3002
npm --prefix backend run validate-env     # check the backend environment
```

### Testing

The backend suite is split in two, on purpose:

- **`backend/tests/unit`** — hermetic. No database, no network, no Docker; the
  repository layer is stubbed. This is what `npm test` and every push run.
- **`backend/tests/integration`** — the same HTTP surface against a real MongoDB
  (`mongodb-memory-server` locally, a `mongo:7` service container in CI).

See [docs/testing.md](docs/testing.md) for the full guide, and
[docs/architecture.md](docs/architecture.md) for how the backend is layered.

## Troubleshooting

**Port Already in Use**

```bash
# Find and kill process on port 4000
lsof -i :4000
kill -9 <PID>
```

**MongoDB Connection Issues**

- Verify MongoDB URI in `.env`
- Check IP whitelisting in MongoDB Atlas
- Ensure credentials are correct

**Cloudinary Upload Failures**

- Verify Cloudinary credentials
- Check file size limits
- Ensure CORS is enabled

## Author

Kaoser, Turza, Siyam, Abir

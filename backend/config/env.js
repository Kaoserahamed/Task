/**
 * Environment Configuration
 * Centralized configuration for all environment variables
 */

require('dotenv').config();

const config = {
  // Server Configuration
  port: process.env.PORT || 4000,
  nodeEnv: process.env.NODE_ENV || 'development',
  isProduction: process.env.NODE_ENV === 'production',
  isTest: process.env.NODE_ENV === 'test',
  // `VERCEL=1` is injected by the platform; IS_VERCEL is the explicit flag for
  // other hosts, kept because the deployment guides reference it.
  isVercel: process.env.VERCEL === '1' || process.env.IS_VERCEL === 'true',

  // HTTP layer
  http: {
    // Multipart image uploads are capped separately in config/upload.js.
    jsonLimit: process.env.JSON_BODY_LIMIT || '1mb',
  },

  // Seeding creates demo accounts with known passwords: opt-in, never default.
  seed: {
    enabled: process.env.SEED_ENABLED === 'true',
  },

  // Migrations rewrite data, so they too are an explicit operator action: the
  // runner refuses to touch a production database without this flag.
  migrations: {
    enabled: process.env.MIGRATIONS_ENABLED === 'true',
  },

  // Database Configuration
  mongodb: {
    uri: process.env.MONGODB_URI,
  },

  // Authentication
  jwt: {
    secret: process.env.JWT_SECRET,
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  },

  // CORS Configuration
  cors: {
    origins: [
      'http://localhost:3000',
      'http://localhost:3001',
      'http://localhost:3002',
      'http://localhost:3003',
      'http://localhost:3004',
      process.env.FRONTEND_URL,
      process.env.ADMIN_URL,
      process.env.COMPANY_URL,
    ].filter(Boolean),
  },

  // External APIs
  apis: {
    weather: process.env.WEATHER_API_KEY,
    sendinblue: process.env.SENDINBLUE_API_KEY,
  },

  // Transactional email. The sender used to be a hard-coded personal address
  // inside the route file, which meant a deployment silently sent "Task" mail
  // from somebody's inbox.
  mail: {
    fromName: process.env.MAIL_FROM_NAME || 'Task',
    fromEmail: process.env.MAIL_FROM_EMAIL || 'no-reply@example.com',
  },

  // File Upload (Cloudinary)
  cloudinary: {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    apiSecret: process.env.CLOUDINARY_API_SECRET,
  },

  // Real-time (Pusher)
  pusher: {
    appId: process.env.PUSHER_APP_ID,
    key: process.env.PUSHER_KEY,
    secret: process.env.PUSHER_SECRET,
    cluster: process.env.PUSHER_CLUSTER,
  },
};

// Validate required environment variables up front: a server that boots without
// a database URI or a JWT secret fails at the first request, which is far
// harder to diagnose than refusing to start.
const requiredEnvVars = ['MONGODB_URI', 'JWT_SECRET'];

const missingEnvVars = requiredEnvVars.filter((envVar) => !process.env[envVar]);

if (missingEnvVars.length > 0 && config.nodeEnv !== 'test') {
  // The structured logger requires this module, so bootstrapping reports
  // through stderr directly.
  console.error('Missing required environment variables:');
  missingEnvVars.forEach((envVar) => console.error(`  - ${envVar}`));
  process.exit(1);
}

// Tests assert on this instead of terminating the process.
config.validation = { missing: missingEnvVars };

module.exports = config;

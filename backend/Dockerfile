# Backend API Dockerfile
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Install dependencies first (better layer caching)
COPY package.json package-lock.json* ./
RUN npm ci --omit=dev || npm install --omit=dev

# Copy application source
COPY . .

# Create uploads directory for local file storage
RUN mkdir -p uploads

# Expose the API port
EXPOSE 4000

# Start the server
CMD ["node", "index.js"]
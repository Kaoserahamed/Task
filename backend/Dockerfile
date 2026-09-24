# syntax=docker/dockerfile:1.7
# Production API image: dependency/build preparation is isolated from the
# minimal runtime layer that runs the Express process.

FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

FROM node:20-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=4000

COPY --from=build /app/node_modules ./node_modules
COPY package.json package-lock.json ./
COPY . .

# The image remains useful without a mounted volume, while ECS can mount an
# EFS/S3-backed path later. Only the unprivileged node user owns runtime data.
RUN mkdir -p uploads public/uploads && chown -R node:node /app
USER node

EXPOSE 4000

# Liveness must not depend on MongoDB. ECS/ALB readiness uses /health/ready.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/health/live').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]


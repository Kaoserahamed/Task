# Backend API image — the Express server in backend/.
FROM node:20-alpine

WORKDIR /app

# Dependencies first, so editing the source does not reinstall them. `npm ci`
# needs the committed lockfile and fails loudly when it has drifted from
# package.json, which is what a deploy wants; the image ships production
# dependencies only.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# Application source. Tests, coverage output, .env files and docs are excluded
# by .dockerignore.
COPY . .

# The uploads directory is part of the image so a plain `docker run` serves it;
# deployments mount a volume over the path. The base image already ships the
# unprivileged `node` user, and the process runs as it — never as root.
RUN mkdir -p uploads && chown -R node:node /app
USER node

ENV NODE_ENV=production
EXPOSE 4000

# Liveness only: /health/live never touches MongoDB, so a database outage cannot
# make the orchestrator kill a container that is still serving. Readiness is
# probed separately against /health/ready, which answers 503 when Mongo is down.
HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:' + (process.env.PORT || 4000) + '/health/live').then((res) => process.exit(res.ok ? 0 : 1)).catch(() => process.exit(1))"

CMD ["node", "index.js"]

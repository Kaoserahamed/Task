# Admin dashboard image - the React app in admin/.
#
# Two stages: the first compiles the production bundle, the second ships only
# the static output behind nginx. The dev server, the test runner and the
# devDependencies never reach the runtime image.

# ---- build: compile the production bundle -----------------------------------
FROM node:20-alpine AS build
WORKDIR /app

# The API URL is baked into the bundle at build time (CRA inlines
# REACT_APP_* variables), so it is a build argument rather than a runtime
# environment variable. The browser - not this container - talks to the API,
# which is why the compose value is http://localhost:4000.
ARG REACT_APP_API_URL=http://localhost:4000
ENV REACT_APP_API_URL=$REACT_APP_API_URL

# Dependencies first, so editing source does not reinstall them.
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# `npm run build` already sets CI=false: a warning in the bundle is not worth
# failing a deploy over, but a real error still fails the image build.
RUN npm run build

# ---- runtime: static files behind nginx --------------------------------------
FROM nginx:1.27-alpine AS runtime

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/build /usr/share/nginx/html

EXPOSE 80

# Liveness: the static bundle is always servable, so a failing health check
# here means the container is genuinely broken, not that the API is down.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD wget -qO- http://127.0.0.1/ >/dev/null 2>&1 || exit 1

CMD ["nginx", "-g", "daemon off;"]
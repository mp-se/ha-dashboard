# Base image pinned by digest (node:24-alpine). Refresh with:
#   docker pull node:24-alpine && docker image inspect node:24-alpine --format '{{index .RepoDigests 0}}'
ARG NODE_IMAGE=node:24-alpine@sha256:116b800c3754b440ee0aa3ed2f20f5bf3d99a554bfd9adeea09ea8017f6e85f5

# Stage 1: Build frontend
FROM ${NODE_IMAGE} AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .

# Clear VITE_API_URL so relative /api paths are used in Docker
ENV VITE_API_URL=

RUN npm run build

# Stage 2: Runtime with Nginx + Node.js, running as the unprivileged "node" user
FROM ${NODE_IMAGE}

ENV NODE_ENV=production

RUN apk add --no-cache nginx

WORKDIR /app

COPY --from=builder /build/dist /usr/share/nginx/html

COPY docker/app-server.js ./
COPY package*.json ./
RUN npm ci --omit=dev && npm cache clean --force

COPY docker/nginx.conf /etc/nginx/nginx.conf
COPY docker/security-headers.conf /etc/nginx/security-headers.conf

# The data directory (configuration, local data, images, backups, sessions) lives
# outside nginx's web root and is only reachable through the API. Nothing from your
# local ./data is baked into the image: it is mounted at runtime.
RUN mkdir -p /app/data/backups /app/data/images && chown -R node:node /app

COPY --chown=node:node docker/start.sh ./
RUN chmod +x start.sh

USER node

# Unprivileged ports: map them to 80/443 on the host if needed (-p 80:8080 -p 443:8443)
EXPOSE 8080 8443

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD wget -q -O /dev/null http://127.0.0.1:3000/api/health || exit 1

CMD ["sh", "start.sh"]

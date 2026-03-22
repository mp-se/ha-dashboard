# Stage 1: Build frontend
FROM node:20-alpine AS builder

WORKDIR /build
COPY package*.json ./
RUN npm ci

COPY . .

# Clear VITE_API_URL so relative /api paths are used in Docker
ENV VITE_API_URL=

RUN npm run build

# Stage 2: Runtime with Nginx + Node.js
FROM node:20-alpine

# Install nginx
RUN apk add --no-cache nginx

# Create app directory
WORKDIR /app

# Copy built frontend from builder
COPY --from=builder /build/dist /usr/share/nginx/html

# Copy Node.js backend files
COPY docker/app-server.js ./
COPY package*.json ./

RUN npm ci --omit=dev

# Copy nginx configuration
COPY docker/nginx.conf /etc/nginx/nginx.conf

# Create data directories with proper permissions
RUN mkdir -p /usr/share/nginx/html/data/backups && \
    chmod -R 755 /usr/share/nginx/html/data

# Expose ports
EXPOSE 80 443

# Start both Nginx and Node.js server
CMD ["sh", "-c", "nginx -g 'daemon off;' & node app-server.js"]
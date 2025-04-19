# Stage 1: Build React frontend
FROM node:23-alpine AS frontend-build

WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Stage 2: Build backend
FROM node:23-alpine AS backend-build

WORKDIR /app/backend
COPY backend/package*.json ./
RUN npm install
COPY backend/ ./

# Stage 3: Final image
FROM node:23-alpine

WORKDIR /app

# Copy backend files
COPY --from=backend-build /app/backend ./

# Copy frontend build to backend's public directory
COPY --from=frontend-build /app/frontend/build ./public

# Copy .env.example and override STATIC_FILES_PATH
COPY backend/.env.example .env
ENV PORT=8080
ENV FRONTEND_DIR=public

EXPOSE 8080

CMD ["node", "server.js"]

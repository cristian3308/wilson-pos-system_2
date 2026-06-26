FROM node:18-alpine AS base

FROM base AS deps
RUN apk add --no-cache libc6-compat python3 make g++
WORKDIR /app
COPY package.json package-lock.json* ./
COPY backend/package.json backend/
COPY frontend/package.json frontend/
RUN npm ci --only=production

FROM base AS builder-backend
WORKDIR /app
COPY backend/package.json backend/package-lock.json* ./backend/
RUN cd backend && npm ci
COPY backend/ ./backend/
RUN cd backend && npm run build

FROM base AS builder-frontend
WORKDIR /app
COPY frontend/package.json frontend/package-lock.json* ./frontend/
RUN cd frontend && npm ci
COPY frontend/ ./frontend/
ENV NEXT_TELEMETRY_DISABLED 1
RUN cd frontend && npm run build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 appuser

COPY --from=deps /app/node_modules ./node_modules
COPY --from=builder-backend /app/backend/dist ./backend/dist
COPY --from=builder-backend /app/backend/package.json ./backend/
COPY --from=builder-frontend /app/frontend/.next ./frontend/.next
COPY --from=builder-frontend /app/frontend/public ./frontend/public
COPY --from=builder-frontend /app/frontend/package.json ./frontend/

EXPOSE 5000

ENV PORT 5000

CMD ["node", "backend/dist/server.js"]

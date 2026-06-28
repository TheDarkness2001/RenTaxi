# Build from repo root (when Railway Root Directory is empty or ".")
FROM node:20-bookworm-slim AS builder

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY backend/package.json backend/package-lock.json ./
COPY backend/nest-cli.json backend/tsconfig.json ./
COPY backend/apps ./apps
COPY backend/libs ./libs

RUN npm ci
RUN npm run build:prod

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY backend/scripts/start-railway.sh ./scripts/start-railway.sh

RUN chmod +x ./scripts/start-railway.sh

ENV AUTH_SERVICE_PORT=3001
ENV IDENTITY_SERVICE_PORT=3002
ENV RIDE_SERVICE_PORT=3003
ENV PAYMENT_SERVICE_PORT=3004
ENV LOCATION_SERVICE_PORT=3005
ENV NOTIFICATION_SERVICE_PORT=3006

EXPOSE 3000

CMD ["sh", "scripts/start-railway.sh"]

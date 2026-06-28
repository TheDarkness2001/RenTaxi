# Production image for Railway (all microservices in one container)
FROM node:20-bookworm-slim AS builder

WORKDIR /app

# Native deps for bcrypt
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 make g++ \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
COPY nest-cli.json tsconfig.json ./
COPY apps ./apps
COPY libs ./libs

RUN npm ci
RUN npm run build:prod

FROM node:20-bookworm-slim AS runner

WORKDIR /app
ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package.json ./
COPY scripts/start-railway.sh ./scripts/start-railway.sh

RUN chmod +x ./scripts/start-railway.sh

ENV AUTH_SERVICE_PORT=3001
ENV IDENTITY_SERVICE_PORT=3002
ENV RIDE_SERVICE_PORT=3003
ENV PAYMENT_SERVICE_PORT=3004
ENV LOCATION_SERVICE_PORT=3005
ENV NOTIFICATION_SERVICE_PORT=3006

EXPOSE 3000

CMD ["sh", "scripts/start-railway.sh"]

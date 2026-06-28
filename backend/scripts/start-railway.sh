#!/bin/sh
set -e

echo "Starting Taxi UZ backend (all services)..."

node dist/apps/auth-service/apps/auth-service/src/main.js &
node dist/apps/identity-service/apps/identity-service/src/main.js &
node dist/apps/ride-service/apps/ride-service/src/main.js &
node dist/apps/payment-service/apps/payment-service/src/main.js &
node dist/apps/location-service/apps/location-service/src/main.js &
node dist/apps/notification-service/apps/notification-service/src/main.js &

sleep 3
echo "Starting API Gateway on port ${PORT:-3000}..."
exec node dist/apps/api-gateway/apps/api-gateway/src/main.js

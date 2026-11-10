#!/bin/bash
# ==============================================================================
# Karthik-BikeGo - Zero-Downtime EC2 Deployment Script
# Target: AWS EC2 (ap-south-1)
# ==============================================================================

set -e

APP_DIR="/var/www/bikego"
BACKEND_DIR="${APP_DIR}/backend"
HEALTH_CHECK_URL="http://localhost:5000/health"
MAX_HEALTH_ATTEMPTS=10

echo "🚀 [Deploy] Starting deployment on $(hostname)..."
cd "${APP_DIR}"

# 1. Fetch latest changes
echo "📥 [Deploy] Pulling latest changes from Git repository..."
PREV_COMMIT=$(git rev-parse HEAD)
git fetch origin main
git reset --hard origin/main
CURRENT_COMMIT=$(git rev-parse HEAD)
echo "Updated from ${PREV_COMMIT:0:7} to ${CURRENT_COMMIT:0:7}"

# 2. Install production dependencies
echo "📦 [Deploy] Installing backend dependencies..."
cd "${BACKEND_DIR}"
npm install --production --prefer-offline

# 3. Reload PM2 with zero downtime
echo "🔄 [Deploy] Reloading backend processes in PM2 cluster..."
pm2 reload ecosystem.config.cjs --update-env

# 4. Verify health check
echo "🩺 [Deploy] Verifying backend health..."
ATTEMPT=1
HEALTHY=0

while [ $ATTEMPT -le $MAX_HEALTH_ATTEMPTS ]; do
  HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_CHECK_URL}" || true)
  if [ "$HTTP_STATUS" -eq 200 ]; then
    echo "✅ [Deploy] Health check passed (HTTP 200) on attempt ${ATTEMPT}."
    HEALTHY=1
    break
  fi
  echo "⏳ [Deploy] Attempt ${ATTEMPT}/${MAX_HEALTH_ATTEMPTS}: Received HTTP ${HTTP_STATUS}. Retrying in 2 seconds..."
  sleep 2
  ATTEMPT=$((ATTEMPT + 1))
done

if [ $HEALTHY -eq 0 ]; then
  echo "❌ [Deploy] Health check failed after ${MAX_HEALTH_ATTEMPTS} attempts! Initiating emergency rollback..."
  git reset --hard "${PREV_COMMIT}"
  npm install --production
  pm2 reload ecosystem.config.cjs --update-env
  echo "⚠️ [Deploy] Rolled back to previous stable commit ${PREV_COMMIT:0:7}."
  exit 1
fi

echo "🎉 [Deploy] Deployment successful! Commit: ${CURRENT_COMMIT:0:7}"

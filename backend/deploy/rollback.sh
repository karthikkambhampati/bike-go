#!/bin/bash
# ==============================================================================
# Karthik-BikeGo - EC2 Rollback Script
# Usage: ./rollback.sh [TARGET_COMMIT_HASH]
# ==============================================================================

set -e

APP_DIR="/var/www/bikego"
BACKEND_DIR="${APP_DIR}/backend"
HEALTH_CHECK_URL="http://localhost:5000/health"

cd "${APP_DIR}"

CURRENT_COMMIT=$(git rev-parse HEAD)

if [ -n "$1" ]; then
  TARGET_COMMIT="$1"
  echo "⏪ [Rollback] Rolling back to specified commit: ${TARGET_COMMIT}..."
else
  TARGET_COMMIT="HEAD~1"
  echo "⏪ [Rollback] Rolling back to previous commit (HEAD~1)..."
fi

# 1. Reset Git repository
git reset --hard "${TARGET_COMMIT}"
ROLLED_COMMIT=$(git rev-parse HEAD)
echo "Rolled back from ${CURRENT_COMMIT:0:7} to ${ROLLED_COMMIT:0:7}"

# 2. Re-install dependencies
cd "${BACKEND_DIR}"
echo "📦 [Rollback] Restoring dependencies..."
npm install --production

# 3. Reload PM2 processes
echo "🔄 [Rollback] Reloading PM2 processes..."
pm2 reload ecosystem.config.cjs --update-env

# 4. Verify health check
echo "🩺 [Rollback] Verifying health check..."
sleep 2
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" "${HEALTH_CHECK_URL}" || true)

if [ "$HTTP_STATUS" -eq 200 ]; then
  echo "✅ [Rollback] Health check verified (HTTP 200). Service restored on ${ROLLED_COMMIT:0:7}."
else
  echo "⚠️ [Rollback] Warning: Health check returned HTTP ${HTTP_STATUS}. Please inspect PM2 logs: pm2 logs bikego-backend"
  exit 1
fi

#!/bin/bash
# ==============================================================================
# Karthik-BikeGo - AWS EC2 Provisioning Script
# Target OS: Ubuntu 22.04 / 24.04 LTS
# Target Region: Asia Pacific (Mumbai) ap-south-1
# ==============================================================================

set -e

echo "🚀 [1/6] Updating system packages..."
sudo apt-get update -y && sudo apt-get upgrade -y
sudo apt-get install -y curl git build-essential nginx

echo "📦 [2/6] Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
echo "Node version: $(node -v)"
echo "NPM version: $(npm -v)"

echo "⚙️ [3/6] Installing PM2 process manager..."
sudo npm install -g pm2

echo "🛡️ [4/6] Configuring UFW Firewall..."
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw allow 5000/tcp comment 'Direct Node Port if needed'
# Uncomment below if UFW is not yet enabled:
# sudo ufw --force enable

echo "📁 [5/6] Creating deployment directory structure..."
sudo mkdir -p /var/www/bikego
sudo chown -R $USER:$USER /var/www/bikego

echo "✅ [6/6] EC2 Initialization complete!"
echo "Next Steps:"
echo "1. Clone your repo or copy files into /var/www/bikego"
echo "2. Create /var/www/bikego/backend/.env from .env.example"
echo "3. Run 'cd /var/www/bikego/backend && npm install --production'"
echo "4. Seed the database: 'npm run seed'"
echo "5. Start backend with PM2: 'pm2 start deploy/ecosystem.config.cjs && pm2 save && pm2 startup'"
echo "6. Copy deploy/nginx.conf to /etc/nginx/sites-available/bikego and enable it"

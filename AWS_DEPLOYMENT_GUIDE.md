# 🚀 Karthik-BikeGo: Complete AWS Deployment & Operations Manual

**Cloud Region:** Asia Pacific (Mumbai) — `ap-south-1`  
**Frontend Platform:** AWS Amplify  
**Backend Platform:** AWS EC2 (Ubuntu 22.04 / 24.04 LTS)  
**Database:** MongoDB Atlas (AWS Mumbai Region)

---

## Table of Contents
1. [Architecture Overview](#1-architecture-overview)
2. [MongoDB Atlas Setup Guide (ap-south-1)](#2-mongodb-atlas-setup-guide-ap-south-1)
3. [AWS EC2 Backend Deployment Guide](#3-aws-ec2-backend-deployment-guide)
4. [AWS Amplify Frontend Deployment Guide](#4-aws-amplify-frontend-deployment-guide)
5. [Connecting Frontend and Backend](#5-connecting-frontend-and-backend)
6. [Health Check Testing & Verification](#6-health-check-testing--verification)
7. [Zero-Downtime Deployment & Rollback Runbook](#7-zero-downtime-deployment--rollback-runbook)
8. [Troubleshooting Common Issues](#8-troubleshooting-common-issues)

---

## 1. Architecture Overview

```text
 ┌────────────────────────────────────────────────────────────────────────┐
 │                        USER BROWSER / MOBILE                           │
 └───────────────────┬────────────────────────────────┬───────────────────┘
                     │                                │
                     │ Static Assets                  │ Dynamic API Requests
                     ▼                                ▼
 ┌───────────────────────────────────────┐ ┌──────────────────────────────┐
 │          AWS Amplify CDN              │ │     AWS EC2 (ap-south-1)     │
 │  - React 19 + Vite SPA                │ │  - Nginx Reverse Proxy (:80) │
 │  - Global Edge Distribution           │ │  - Node.js 20 Express (:5000)│
 │  - Automatic HTTPS / SSL              │ │  - PM2 Cluster (2+ workers)  │
 └───────────────────────────────────────┘ └──────────────┬───────────────┘
                                                          │
                                                          ▼
                                           ┌──────────────────────────────┐
                                           │    MongoDB Atlas Cluster     │
                                           │    - AWS Mumbai ap-south-1   │
                                           │    - M0 Free or Dedicated    │
                                           └──────────────────────────────┘
```

---

## 2. MongoDB Atlas Setup Guide (ap-south-1)

### Step 2.1: Create Free Cluster in AWS Mumbai
1. Open [cloud.mongodb.com](https://cloud.mongodb.com) and log in.
2. Click **Create** to create a new database deployment.
3. Choose **M0 (Free Tier)**.
4. **Cloud Provider & Region**:
   - Provider: **AWS**
   - Region: **Asia Pacific (Mumbai) `ap-south-1`**
5. **Cluster Name**: Set to `bikego-cluster`.
6. Click **Create Deployment**.

### Step 2.2: Configure Database User Credentials
1. In the Atlas left navigation, go to **Security** ➔ **Database Access**.
2. Click **Add New Database User**.
3. **Authentication Method**: Password.
4. **Username**: `bikego_user` (or your chosen username).
5. **Password**: Click **Autogenerate Secure Password** and save it securely in a password manager.
6. **Database User Privileges**: Select `Read and write to any database`.
7. Click **Add User**.

### Step 2.3: Configure Network Access (IP Whitelist)
1. In the Atlas left navigation, go to **Security** ➔ **Network Access**.
2. Click **Add IP Address**.
3. **Initial Setup**: Click **Allow Access from Anywhere** (`0.0.0.0/0`) for testing.
4. **Production Security**: Once your EC2 instance is running with an Elastic IP, add only that Elastic IP (`<YOUR-EC2-ELASTIC-IP>/32`) and delete `0.0.0.0/0`.
5. Click **Confirm**.

### Step 2.4: Obtain Connection URI
1. Go to **Deployments** ➔ **Database**.
2. Click **Connect** on `bikego-cluster`.
3. Choose **Drivers** ➔ Driver: **Node.js** ➔ Version: **5.5 or later**.
4. Copy the connection string. It will look like this:
   ```env
   mongodb+srv://bikego_user:<password>@bikego-cluster.xxxxxx.mongodb.net/bikego?retryWrites=true&w=majority
   ```
5. Replace `<password>` with your actual database user password.

---

## 3. AWS EC2 Backend Deployment Guide

### Step 3.1: Launch EC2 Instance via AWS Console
1. Log in to [AWS Management Console](https://console.aws.amazon.com).
2. Set region selector (top-right) to **Asia Pacific (Mumbai) `ap-south-1`**.
3. Navigate to **EC2** ➔ **Instances** ➔ **Launch Instances**.
4. **Name**: `bikego-backend-prod`.
5. **Application and OS Images (AMI)**: **Ubuntu Server 22.04 LTS** or **24.04 LTS** (64-bit x86).
6. **Instance Type**: `t2.micro` (free tier) or `t3.small` (recommended for production).
7. **Key Pair**: Choose an existing key pair or **Create new key pair** (e.g. `bikego-key.pem`).
8. **Network Settings (Security Group)**:
   - Check **Allow SSH traffic from**: `My IP` (Port 22).
   - Check **Allow HTTP traffic from the internet** (Port 80).
   - Check **Allow HTTPS traffic from the internet** (Port 443).
   - Click **Add security group rule** ➔ Custom TCP ➔ Port `5000` ➔ Source: `Anywhere-IPv4` (optional, for direct port testing).
9. **Storage**: 20 GiB gp3 SSD.
10. Click **Launch Instance**.

### Step 3.2: Allocate and Associate an Elastic IP (Static IP)
1. In EC2 Console ➔ Left menu ➔ **Network & Security** ➔ **Elastic IPs**.
2. Click **Allocate Elastic IP address** ➔ **Allocate**.
3. Select the allocated IP ➔ **Actions** ➔ **Associate Elastic IP address**.
4. Choose your running instance (`bikego-backend-prod`) and click **Associate**.
5. Note this static IP: `<YOUR-EC2-IP>`.

### Step 3.3: Connect to EC2 via SSH
From your local terminal:
```bash
chmod 400 bikego-key.pem
ssh -i "bikego-key.pem" ubuntu@<YOUR-EC2-IP>
```

### Step 3.4: Automated Server Provisioning
Run the automated initialization script:
```bash
# Update and install Node 20 LTS, Nginx, Git, PM2
sudo apt update -y && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git build-essential
sudo npm install -g pm2

# Verify installed versions
node -v   # Expected: v20.x
npm -v    # Expected: v10.x
pm2 -v    # Expected: v5.x
```

### Step 3.5: Clone Project & Install Backend Dependencies
```bash
# Create application root directory
sudo mkdir -p /var/www/bikego
sudo chown -R ubuntu:ubuntu /var/www/bikego

# Clone repository
git clone <YOUR-GITHUB-REPOSITORY-URL> /var/www/bikego
cd /var/www/bikego/backend

# Install production dependencies
npm install --production
```

### Step 3.6: Configure Production Environment Variables
```bash
cp .env.example .env
nano .env
```
Fill in your actual production values:
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=production
MONGODB_URI=mongodb+srv://bikego_user:<YOUR_ATLAS_PASSWORD>@bikego-cluster.xxxxxx.mongodb.net/bikego?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_jwt_key_generate_with_openssl
CORS_ORIGIN=https://master.<amplify-app-id>.amplifyapp.com
```
> **Tip:** Generate a secure random JWT secret in terminal:
> ```bash
> openssl rand -hex 32
> ```

### Step 3.7: Seed Initial Bikes Catalog
```bash
npm run seed
# Output: [Seed] Successfully seeded 4 bikes.
```

### Step 3.8: Start Backend with PM2 Cluster
```bash
# Start backend in cluster mode across all available CPU cores
pm2 start ecosystem.config.cjs

# Verify status
pm2 status

# Save PM2 state to automatically restart on instance reboots
pm2 save
pm2 startup
# (Copy and execute the 'sudo env PATH...' command generated by PM2)
```

### Step 3.9: Configure Nginx Reverse Proxy
```bash
# Copy provided Nginx configuration
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bikego

# Enable site and remove default
sudo ln -s /etc/nginx/sites-available/bikego /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx syntax and restart
sudo nginx -t
sudo systemctl restart nginx
```

---

## 4. AWS Amplify Frontend Deployment Guide

### Step 4.1: Connect Repository to AWS Amplify
1. Open the [AWS Amplify Console](https://console.aws.amazon.com/amplify) in **ap-south-1** (Mumbai).
2. Click **Host web app**.
3. Select your repository provider (GitHub, GitLab, Bitbucket, or CodeCommit) and authenticate.
4. Select repository: `Karthik-BikeGo` ➔ Branch: `main`.

### Step 4.2: Build Settings (`amplify.yml`)
Amplify will detect Vite automatically and utilize the repository's [`frontend/amplify.yml`](file:///Users/karthik/Downloads/bike-go-main/frontend/amplify.yml):
```yaml
version: 1
frontend:
  phases:
    preBuild:
      commands:
        - npm ci
    build:
      commands:
        - npm run build
  artifacts:
    baseDirectory: dist
    files:
      - '**/*'
  cache:
    paths:
      - node_modules/**/*
```

### Step 4.3: Set Environment Variables in Amplify
1. In Amplify Console, navigate to **App settings** ➔ **Environment variables**.
2. Click **Manage variables** ➔ **Add variable**:
   - **Key**: `VITE_API_URL`
   - **Value**: `http://<YOUR-EC2-IP>` (or `https://api.yourdomain.com` if using SSL)
3. Click **Save**.

### Step 4.4: Add SPA Rewrite / Redirect Rule
To allow browser page refreshes on subroutes (`/login`, `/signup`, `/verify-otp`, `/dashboard`) without 404 errors:
1. Navigate to **App settings** ➔ **Rewrites and redirects**.
2. Click **Edit** and ensure the following rule is present:
   - **Source address**: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - **Target address**: `/index.html`
   - **Type**: `200 (Rewrite)`
3. Click **Save**.

### Step 4.5: Deploy
Click **Save and deploy**. Amplify will build, test, and distribute your frontend across AWS edge locations. Your URL will be:
`https://master.<unique-id>.amplifyapp.com`

---

## 5. Connecting Frontend and Backend

Once your Amplify app URL is generated:
1. **SSH into your EC2 instance**:
   ```bash
   ssh -i "bikego-key.pem" ubuntu@<YOUR-EC2-IP>
   ```
2. **Update `CORS_ORIGIN` in `backend/.env`**:
   ```bash
   cd /var/www/bikego/backend
   nano .env
   ```
   Set `CORS_ORIGIN` to match your Amplify domain:
   ```env
   CORS_ORIGIN=https://master.d123456789.amplifyapp.com
   ```
3. **Reload PM2 cluster zero-downtime**:
   ```bash
   pm2 reload ecosystem.config.cjs --update-env
   ```
4. **Test end-to-end**:
   Open `https://master.d123456789.amplifyapp.com` in your browser. Register an account, log in, view the bikes catalog, and place a booking.

---

## 6. Health Check Testing & Verification

Run these verification commands from your local machine:

### 1. Test Root Backend Health Check
```bash
curl -i http://<YOUR-EC2-IP>/health
```
**Expected Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "uptime": 142.5,
  "timestamp": "2026-11-10T10:00:00.000Z",
  "environment": "production"
}
```

### 2. Test API Health Check
```bash
curl -i http://<YOUR-EC2-IP>/api/health
```
**Expected Response (HTTP 200 OK):**
```json
{
  "status": "ok",
  "message": "BikeGo Backend Server is running smoothly!",
  "timestamps": "2026-11-10T10:00:00.000Z"
}
```

### 3. Test CORS Preflight from Amplify
```bash
curl -i -X OPTIONS http://<YOUR-EC2-IP>/api/auth/login \
  -H "Origin: https://master.<app-id>.amplifyapp.com" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type,Authorization"
```
**Expected Response:** HTTP 204 or 200 with `Access-Control-Allow-Origin: https://master.<app-id>.amplifyapp.com`.

### 4. Test Protected Endpoint Security
```bash
curl -i http://<YOUR-EC2-IP>/api/bikes
```
**Expected Response (HTTP 401 Unauthorized):**
```json
{"message":"Not authorized, no token provided"}
```

---

## 7. Zero-Downtime Deployment & Rollback Runbook

### Routine Zero-Downtime Deployment (EC2)
Whenever you push new code to your Git repository:
```bash
ssh -i "bikego-key.pem" ubuntu@<YOUR-EC2-IP>
cd /var/www/bikego/backend
./deploy/deploy.sh
```
This automated script:
1. Pulls the latest commits.
2. Installs production dependencies.
3. Reloads the PM2 cluster with zero downtime (`pm2 reload`).
4. Runs automated health checks against `http://localhost:5000/health`.
5. Automatically rolls back if the health check fails!

### Rollback Runbook (EC2)
If a release causes issues in production, immediately roll back to the previous stable release:

#### Option A: Automated Rollback Script
```bash
cd /var/www/bikego/backend
# Roll back to the immediately preceding commit:
./deploy/rollback.sh

# Or roll back to a specific known good commit hash:
./deploy/rollback.sh a1b2c3d
```

#### Option B: Manual Rollback
```bash
cd /var/www/bikego
git reset --hard <PREVIOUS-GOOD-COMMIT-HASH>
cd backend
npm install --production
pm2 reload ecosystem.config.cjs --update-env
```

### Rollback Runbook (AWS Amplify Frontend)
If a bad frontend build was deployed to AWS Amplify:
1. Open the **AWS Amplify Console**.
2. Click on your app (`Karthik-BikeGo`) ➔ **Build history**.
3. Find the previous successful build.
4. Click the three dots menu (⋮) on that build ➔ **Redeploy this version**.
5. Amplify rolls back the global CDN distribution within 60 seconds.

---

## 8. Troubleshooting Common Issues

| Symptom | Cause | Solution |
| :--- | :--- | :--- |
| `ECONNREFUSED` on database | MongoDB Atlas IP whitelist blocking EC2 | Go to Atlas ➔ **Network Access** ➔ Add your EC2 Elastic IP (`/32`). |
| `CORS Error` in browser | `CORS_ORIGIN` in backend `.env` does not match Amplify URL | Ensure `CORS_ORIGIN` in `/var/www/bikego/backend/.env` matches `https://master.xxxx.amplifyapp.com` exactly (no trailing slash), then run `pm2 reload ecosystem.config.cjs --update-env`. |
| 404 on page refresh on Amplify | Missing SPA rewrite rule | Add the 200 rewrite rule in Amplify Console ➔ **Rewrites and redirects** pointing to `/index.html`. |
| PM2 cluster not starting | Invalid `.env` or syntax error | Run `pm2 logs bikego-backend --lines 50` to inspect error output. |
| Port 80 not responding | Nginx inactive or firewall blocking | Run `sudo systemctl status nginx` and verify AWS Security Group allows inbound HTTP port 80. |

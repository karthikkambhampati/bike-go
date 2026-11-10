# 🖥️ AWS EC2 Backend Deployment Guide: Karthik-BikeGo

**Target Server:** AWS EC2 (Ubuntu 22.04 LTS or 24.04 LTS)  
**AWS Region:** Asia Pacific (Mumbai) — `ap-south-1`  
**Runtime:** Node.js 20 LTS  
**Process Manager:** PM2 (Cluster Mode)  
**Reverse Proxy:** Nginx  
**Database:** MongoDB Atlas (AWS Mumbai)

---

## 📑 Table of Contents
1. [Backend Pre-Deployment Verification](#1-backend-pre-deployment-verification)
2. [EC2 Instance & Security Group Prerequisites](#2-ec2-instance--security-group-prerequisites)
3. [Updating MongoDB Atlas Network Access](#3-updating-mongodb-atlas-network-access)
4. [Step-by-Step Server Setup on EC2](#4-step-by-step-server-setup-on-ec2)
5. [Configuring Production Environment Variables](#5-configuring-production-environment-variables)
6. [PM2 Process Management & Auto-Start](#6-pm2-process-management--auto-start)
7. [Nginx Reverse Proxy Configuration](#7-nginx-reverse-proxy-configuration)
8. [Connecting Backend to AWS Amplify (CORS Setup)](#8-connecting-backend-to-aws-amplify-cors-setup)
9. [Health-Check Verification Commands](#9-health-check-verification-commands)
10. [Daily Operations: Start, Stop, Restart & Logs](#10-daily-operations-start-stop-restart--logs)
11. [Summary of Exact Commands to Execute on EC2](#11-summary-of-exact-commands-to-execute-on-ec2)

---

## 1. Backend Pre-Deployment Verification

All core backend configurations have been pre-verified for production:

- **Production Start Command:** `npm start` (which executes `node src/index.js`).
- **Node.js Compatibility:** Tested and verified on **Node.js 20.x LTS** (compatible with Node 18+).
- **Host & Port Configuration:** Explicitly configured in `src/index.js` to bind to `0.0.0.0` (all network interfaces) on port `5000` (or `process.env.PORT`).
- **Database Connection:** Pre-tested against MongoDB Atlas in `ap-south-1` with `serverSelectionTimeoutMS: 5000`.
- **Environment Loading:** Uses `dotenv.config()` with smart path resolution for production daemon execution.
- **Process Manager:** `ecosystem.config.cjs` configured for PM2 clustering across all vCPUs with auto-restart on memory limit (`500M`).

---

## 2. EC2 Instance & Security Group Prerequisites

### Recommended Instance
- **AMI:** Ubuntu Server 22.04 LTS (HVM), SSD Volume Type (Free tier eligible).
- **Instance Type:** `t2.micro` (Free tier eligible) or `t3.small`.
- **Elastic IP:** Allocate an **Elastic IP** in EC2 console and associate it with this instance so your server IP never changes.

### Required Inbound Security Group Rules
In the AWS EC2 Console ➔ **Security Groups** ➔ Edit inbound rules:

| Type | Protocol | Port Range | Source | Reason |
| :--- | :---: | :---: | :--- | :--- |
| **SSH** | TCP | `22` | **My IP** (`x.x.x.x/32`) | Secure terminal access (Never open to 0.0.0.0/0) |
| **HTTP** | TCP | `80` | **Anywhere-IPv4** (`0.0.0.0/0`) | Public web & API traffic via Nginx |
| **HTTPS** | TCP | `443` | **Anywhere-IPv4** (`0.0.0.0/0`) | Secure SSL API traffic |

---

## 3. Updating MongoDB Atlas Network Access

To allow your EC2 server to communicate with your MongoDB Atlas cluster:

1. Copy your EC2 instance's **Elastic IP** (e.g. `13.232.145.20`).
2. Log in to [cloud.mongodb.com](https://cloud.mongodb.com).
3. In the left navigation, click **Security** ➔ **Network Access**.
4. Click **Add IP Address**:
   - **Access List Entry:** `<YOUR-EC2-ELASTIC-IP>/32` (e.g., `13.232.145.20/32`).
   - **Comment:** `AWS EC2 Production Server`.
5. Click **Confirm**.
6. *(Optional)* Remove any temporary `0.0.0.0/0` rule so only your EC2 backend can access your database.

---

## 4. Step-by-Step Server Setup on EC2

### Step 4.1: Connect to EC2 via SSH
From your local terminal, navigate to the directory holding your `bikego-key.pem` key:

```bash
# Secure the key file permissions
chmod 400 bikego-key.pem

# SSH into the EC2 instance
ssh -i "bikego-key.pem" ubuntu@<YOUR-EC2-ELASTIC-IP>
```

---

### Step 4.2: Update System & Install Node.js 20 LTS + Nginx + PM2
Once inside the EC2 terminal, run these commands:

```bash
# 1. Update Ubuntu system packages
sudo apt update -y && sudo apt upgrade -y

# 2. Add NodeSource Node.js 20 LTS repository
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# 3. Install Node.js, Nginx, Git, and build tools
sudo apt install -y nodejs nginx git build-essential

# 4. Install PM2 globally
sudo npm install -g pm2

# 5. Confirm installed versions
node -v   # Should show: v20.x.x
npm -v    # Should show: v10.x.x
pm2 -v    # Should show: v5.x.x
```

---

### Step 4.3: Clone the Application & Install Dependencies
```bash
# 1. Create a clean web directory
sudo mkdir -p /var/www/bikego
sudo chown -R ubuntu:ubuntu /var/www/bikego

# 2. Clone your GitHub repository
git clone https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git /var/www/bikego

# 3. Navigate to backend and install production packages
cd /var/www/bikego/backend
npm install --production
```

---

## 5. Configuring Production Environment Variables

Create the production `.env` file on the server:

```bash
nano .env
```

Paste your production configuration:

```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=production

# Paste your existing MongoDB Atlas connection string from local backend/.env:
MONGODB_URI=<REUSE_YOUR_EXISTING_MONGODB_URI>

# Paste your existing JWT secret from local backend/.env (or a new random key):
JWT_SECRET=<REUSE_YOUR_EXISTING_JWT_SECRET>

# Frontend Amplify domain (for initial setup use * or your Amplify domain if already created):
CORS_ORIGIN=*
```

> **How to save in nano:** Press `Ctrl + O`, press `Enter`, then press `Ctrl + X` to exit.

---

## 6. PM2 Process Management & Auto-Start

### Step 6.1: Seed Initial Bike Inventory
```bash
npm run seed
# Output: [Seed] Successfully seeded 4 bikes.
```

### Step 6.2: Start Backend with PM2 Cluster Mode
```bash
# Start backend using our pre-configured ecosystem config
pm2 start ecosystem.config.cjs

# Check cluster status
pm2 status
```

### Step 6.3: Configure Auto-Start on Server Reboot
```bash
# Save current running process list
pm2 save

# Generate and configure systemd startup hook
pm2 startup
# PM2 will output a command starting with: sudo env PATH...
# Copy and execute that exact command in your terminal.
```

---

## 7. Nginx Reverse Proxy Configuration

Nginx receives incoming requests on standard port 80 and passes them internally to your Node.js app on port 5000:

```bash
# 1. Copy our pre-configured Nginx site definition
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bikego

# 2. Enable site by creating symlink
sudo ln -s /etc/nginx/sites-available/bikego /etc/nginx/sites-enabled/

# 3. Remove default Nginx welcome page
sudo rm -f /etc/nginx/sites-enabled/default

# 4. Test Nginx syntax
sudo nginx -t
# Output must state: syntax is ok / test is successful

# 5. Restart Nginx
sudo systemctl restart nginx
```

---

## 8. Connecting Backend to AWS Amplify (CORS Setup)

Once your frontend is deployed on AWS Amplify and has its public domain (e.g. `https://master.d123456.amplifyapp.com`):

1. Edit your EC2 `.env` file:
   ```bash
   cd /var/www/bikego/backend
   nano .env
   ```
2. Update `CORS_ORIGIN`:
   ```env
   CORS_ORIGIN=https://master.d123456.amplifyapp.com
   ```
3. Save and reload PM2 with zero downtime:
   ```bash
   pm2 reload ecosystem.config.cjs --update-env
   ```

---

## 9. Health-Check Verification Commands

Verify your deployment from your local machine:

### 1. Test Root Server Health Check
```bash
curl -i http://<YOUR-EC2-ELASTIC-IP>/health
```
**Expected Output (HTTP 200 OK):**
```json
{
  "status": "ok",
  "uptime": 128.4,
  "timestamp": "2026-11-10T10:40:00.000Z",
  "environment": "production"
}
```

### 2. Test API Health Check
```bash
curl -i http://<YOUR-EC2-ELASTIC-IP>/api/health
```
**Expected Output (HTTP 200 OK):**
```json
{
  "status": "ok",
  "message": "BikeGo Backend Server is running smoothly!",
  "timestamps": "2026-11-10T10:40:00.000Z"
}
```

### 3. Test Security Middleware (Unauthorized Request)
```bash
curl -i http://<YOUR-EC2-ELASTIC-IP>/api/bikes
# Expected: HTTP 401 Unauthorized {"message":"Not authorized, no token provided"}
```

---

## 10. Daily Operations: Start, Stop, Restart & Logs

| Action | Terminal Command | Explanation |
| :--- | :--- | :--- |
| **View Live Logs** | `pm2 logs bikego-backend` | Stream live application logs & OTP codes |
| **Check Process Status** | `pm2 status` | Check uptime, CPU, and RAM usage of each worker |
| **Restart Backend (Zero Downtime)** | `pm2 reload ecosystem.config.cjs --update-env` | Reloads cluster workers sequentially without downtime |
| **Restart Nginx** | `sudo systemctl restart nginx` | Restarts the Nginx reverse proxy |
| **View Server Metrics** | `pm2 monit` | Terminal dashboard showing live CPU and memory |
| **Deploy New Git Code** | `./deploy/deploy.sh` | Automated pull, package install, reload, and health-check |
| **Emergency Rollback** | `./deploy/rollback.sh` | Automatically rolls back to the previous commit |

---

## 11. Summary of Exact Commands to Execute on EC2

Here is the clean sequence of terminal commands to paste after connecting to your EC2 Ubuntu instance:

```bash
# ------------------------------------------------------------------------------
# STEP 1: Provision Server (Node 20, Nginx, PM2, Git)
# ------------------------------------------------------------------------------
sudo apt update -y && sudo apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs nginx git build-essential
sudo npm install -g pm2

# ------------------------------------------------------------------------------
# STEP 2: Clone Code & Install Production Dependencies
# ------------------------------------------------------------------------------
sudo mkdir -p /var/www/bikego
sudo chown -R ubuntu:ubuntu /var/www/bikego
git clone https://github.com/<YOUR-GITHUB-USERNAME>/<YOUR-REPO-NAME>.git /var/www/bikego
cd /var/www/bikego/backend
npm install --production

# ------------------------------------------------------------------------------
# STEP 3: Create Production .env
# ------------------------------------------------------------------------------
cat << 'EOF' > .env
PORT=5000
HOST=0.0.0.0
NODE_ENV=production
MONGODB_URI=<PASTE_YOUR_EXISTING_MONGODB_URI>
JWT_SECRET=<PASTE_YOUR_EXISTING_JWT_SECRET>
CORS_ORIGIN=*
EOF

# ------------------------------------------------------------------------------
# STEP 4: Seed Bikes & Start PM2 Cluster
# ------------------------------------------------------------------------------
npm run seed
pm2 start ecosystem.config.cjs
pm2 save
pm2 startup

# ------------------------------------------------------------------------------
# STEP 5: Enable Nginx Reverse Proxy
# ------------------------------------------------------------------------------
sudo cp deploy/nginx.conf /etc/nginx/sites-available/bikego
sudo ln -s /etc/nginx/sites-available/bikego /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t && sudo systemctl restart nginx

# ------------------------------------------------------------------------------
# STEP 6: Verify Backend Health
# ------------------------------------------------------------------------------
curl http://localhost/health
```

Your backend is now fully prepared for AWS EC2 deployment!

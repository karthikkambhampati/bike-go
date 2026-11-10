# 🚲 Karthik-BikeGo

A full-stack, concurrency-safe bike rental platform engineered for AWS cloud deployment. Built with a **React 19 (Vite 8)** frontend, an **Express 5 / Node.js** backend, and **MongoDB Atlas**, featuring Optimistic Concurrency Control (OCC) to eliminate double-booking race conditions and rate-limited authentication.

---

## 🌟 Key Features

1. **Concurrency-Safe Booking Engine**:
   - Uses atomic check-and-set queries (`Bike.findOneAndUpdate`) with version tracking.
   - Prevents race conditions when multiple users attempt to reserve the same bike simultaneously.
   - Returns predictable `409 Conflict` status handled gracefully by frontend toast notifications.
2. **Automated Inventory Release**:
   - Expired rentals are automatically marked `'completed'`, releasing bikes back to `'available'` status.
3. **Session Security & Abuse Prevention**:
   - Bcrypt-hashed credentials and short-lived OTP registration verification.
   - 7-day signed JWT session authentication checked on protected routes.
   - Rate limiting via `express-rate-limit` protecting authentication routes against brute-force attacks.
4. **Cloud Production Ready**:
   - **Frontend**: AWS Amplify with global CDN distribution and SPA rewrite rules.
   - **Backend**: AWS EC2 in Asia Pacific (Mumbai) `ap-south-1` with Nginx reverse proxy, PM2 cluster mode, and automated rollback scripts.
   - **Database**: MongoDB Atlas replica set in AWS Mumbai.

---

## 🏗️ Architecture Overview

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

## 🛠️ Tech Stack

- **Frontend**: React 19, Vite 8, React Router DOM 7, Tailwind CSS 4, Lucide React icons.
- **Backend**: Node.js 20 LTS (ES Modules), Express 5, Mongoose 9, JWT (`jsonwebtoken`), `bcryptjs`, `express-rate-limit`, `cors`, `dotenv`.
- **Database**: MongoDB Atlas (AWS Mumbai `ap-south-1`).
- **DevOps & Cloud**: AWS Amplify, AWS EC2, PM2, Nginx, Systemd, GitHub Actions-ready.

---

## 📁 Project Structure

```text
bike-go/
├── amplify.yml                     # Root build specification for AWS Amplify
├── package.json                    # Monorepo orchestration scripts
├── AWS_DEPLOYMENT_GUIDE.md         # Comprehensive AWS step-by-step operations manual
├── frontend/
│   ├── amplify.yml                 # Frontend-specific AWS Amplify build settings
│   ├── vite.config.js              # Production Vite configuration
│   ├── .env.example                # Frontend environment template
│   ├── .env.development            # Local development environment configuration
│   └── src/
│       ├── config/api.js           # Centralized API endpoints configuration
│       ├── context/AuthContext.jsx # Authentication state & session persistence
│       └── pages/                  # Bikes, Login, Signup, VerifyOtp
└── backend/
    ├── ecosystem.config.cjs        # PM2 cluster configuration
    ├── .env.example                # Backend environment template
    ├── deploy/                     # Production scripts & server configuration
    │   ├── setup-ec2.sh            # Automated EC2 server initialization
    │   ├── deploy.sh               # Zero-downtime deployment script with health checks
    │   ├── rollback.sh             # Emergency rollback script
    │   ├── nginx.conf              # Nginx reverse proxy configuration
    │   └── bikego.service          # Systemd service unit definition
    ├── scripts/
    │   ├── seed.js                 # Database inventory seeder
    │   ├── test-endpoints.js       # In-process API & security verification suite
    │   └── test-concurrency.js     # Parallel booking race condition simulation
    └── src/
        ├── index.js                # Express server entry point & middleware stack
        ├── config/db.js            # MongoDB Atlas connection manager
        ├── controllers/            # auth, bike, and booking controllers
        ├── middleware/             # JWT auth middleware & rate limiters
        ├── models/                 # User, Bike, Booking, and Otp Mongoose schemas
        └── routes/                 # Express API routes
```

---

## 🌐 API Endpoints

| Method | Endpoint | Auth | Description |
| :--- | :--- | :--- | :--- |
| `GET` | `/health` | No | Root health check for AWS EC2, ALB, and uptime pingers |
| `GET` | `/api/health` | No | API health check reporting server timestamp |
| `POST` | `/api/auth/register` | No (Rate Limited) | Register user account with email, phone, and password |
| `POST` | `/api/auth/verify-otp` | No (Rate Limited) | Verify 6-digit OTP and issue JWT |
| `POST` | `/api/auth/resend-otp` | No (Rate Limited) | Issue and resend a new OTP code |
| `POST` | `/api/auth/login` | No (Rate Limited) | Authenticate username/password and issue JWT |
| `GET` | `/api/bikes` | Yes (Bearer) | List all bikes with real-time dynamic availability |
| `POST` | `/api/bookings` | Yes (Bearer) | Reserve a bike slot with atomic OCC lock |
| `GET` | `/api/bookings` | Yes (Bearer) | Retrieve logged-in user's active and past rentals |
| `PUT` | `/api/bookings/:id/cancel` | Yes (Bearer) | Cancel an active rental and restore bike to available |

---

## 💻 Local Development Quickstart

### Prerequisites
- [Node.js](https://nodejs.org/) v18+ or v20 LTS
- Local MongoDB or a free [MongoDB Atlas](https://www.mongodb.com/) cluster URI

### 1. Install Dependencies
From the repository root:
```bash
npm run install:all
```

### 2. Configure Environment Variables
Copy the templates:
```bash
# Backend configuration
cp backend/.env.example backend/.env

# Frontend configuration (already pre-configured for localhost in .env.development)
cp frontend/.env.example frontend/.env
```

Edit `backend/.env` with your MongoDB URI and a random secret:
```env
PORT=5000
HOST=0.0.0.0
NODE_ENV=development
MONGODB_URI=mongodb://localhost:27017/bikego
JWT_SECRET=local_development_secret_key_12345
CORS_ORIGIN=http://localhost:5173
```

### 3. Seed Initial Inventory
```bash
npm run seed
```

### 4. Run the Application
Open two terminal windows:
```bash
# Terminal 1: Backend API (port 5000)
npm run dev:backend

# Terminal 2: Frontend Vite App (port 5173)
npm run dev:frontend
```
Open [http://localhost:5173](http://localhost:5173) in your browser.

### 5. Run Verification Tests
```bash
# Test API endpoints and security middleware
npm run test:api

# Test booking concurrency engine (simulating simultaneous requests)
npm run test:concurrency
```

---

## ☁️ AWS Cloud Deployment Summary

For full beginner-friendly walkthroughs, consult [`AWS_DEPLOYMENT_GUIDE.md`](./AWS_DEPLOYMENT_GUIDE.md).

### 1. MongoDB Atlas (`ap-south-1` Mumbai)
1. Create a free M0 cluster in AWS Mumbai (`ap-south-1`).
2. Add a database user (`bikego_user`) and password.
3. Whitelist your EC2 IP address under **Network Access**.
4. Copy the connection URI into your backend `.env`.

### 2. AWS EC2 Backend (`ap-south-1`)
1. Launch an Ubuntu 22.04 LTS instance with ports 22, 80, and 443 open.
2. Allocate an **Elastic IP** and associate it with the instance.
3. SSH into the instance and run the automated setup:
   ```bash
   git clone <YOUR-REPO-URL> /var/www/bikego
   cd /var/www/bikego/backend
   chmod +x deploy/setup-ec2.sh deploy/deploy.sh deploy/rollback.sh
   ./deploy/setup-ec2.sh
   ```
4. Configure `/var/www/bikego/backend/.env` with your Atlas URI, JWT secret, and Amplify domain.
5. Seed database and launch PM2 cluster:
   ```bash
   npm run seed
   pm2 start ecosystem.config.cjs
   pm2 save && pm2 startup
   ```
6. Link Nginx reverse proxy:
   ```bash
   sudo cp deploy/nginx.conf /etc/nginx/sites-available/bikego
   sudo ln -s /etc/nginx/sites-available/bikego /etc/nginx/sites-enabled/
   sudo rm -f /etc/nginx/sites-enabled/default
   sudo nginx -t && sudo systemctl restart nginx
   ```

### 3. AWS Amplify Frontend
1. In the **AWS Amplify Console** (`ap-south-1`), select **Host web app** and link your Git repository.
2. In **App settings ➔ Environment variables**, set:
   - `VITE_API_URL` = `http://<YOUR-EC2-IP>` (or `https://api.yourdomain.com`).
3. In **App settings ➔ Rewrites and redirects**, add the SPA rewrite rule:
   - Source: `</^[^.]+$|\.(?!(css|gif|ico|jpg|js|png|txt|svg|woff|woff2|ttf|map|json)$)([^.]+$)/>`
   - Target: `/index.html`
   - Type: `200 (Rewrite)`
4. Deploy the application.

---

## 🔄 Operations & Rollback Runbook

### Routine Zero-Downtime Deployment
Deploy new commits cleanly on EC2 with automated health verification:
```bash
ssh -i "your-key.pem" ubuntu@<YOUR-EC2-IP>
cd /var/www/bikego/backend
./deploy/deploy.sh
```

### Emergency Rollback (EC2)
Instantly revert to the previous stable release:
```bash
# Rollback to immediately preceding commit:
./deploy/rollback.sh

# Or rollback to a specific commit hash:
./deploy/rollback.sh <COMMIT_HASH>
```

### Emergency Rollback (AWS Amplify)
1. Go to AWS Amplify Console ➔ **Build history**.
2. Click the three dots (⋮) on the previous working build ➔ **Redeploy this version**.
3. Amplify rolls back CDN assets globally within 60 seconds.

---

## 🔒 Security Best Practices
- Never commit `.env` files (verified in `.gitignore`).
- Protect JWT secret using a cryptographically random 256-bit key (`openssl rand -hex 32`).
- Restrict `CORS_ORIGIN` to your explicit Amplify domain in production.
- Keep MongoDB Atlas network access restricted to your EC2 Elastic IP.
- Rate limit authentication routes to mitigate credential stuffing.
# bikego

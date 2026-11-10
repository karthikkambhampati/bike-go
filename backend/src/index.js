import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import connectDB from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import bikeRoutes from './routes/bikeRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

// Resolve environment variables (checks current working directory first, then backend folder)
const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config();
if (!process.env.MONGODB_URI) {
  dotenv.config({ path: path.resolve(__dirname, '../.env') });
}

const app = express();
const PORT = parseInt(process.env.PORT, 10) || 5000;
const HOST = process.env.HOST || '0.0.0.0';

// ========================================================
// 1. CORS Configuration for AWS Deployment
// ========================================================
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:5173', 'http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (such as mobile apps, curl, or server-to-server health checks)
    if (!origin) return callback(null, true);

    // If wildcard or match in allowed origins list
    if (
      allowedOrigins.includes('*') ||
      allowedOrigins.includes(origin) ||
      process.env.NODE_ENV !== 'production'
    ) {
      return callback(null, true);
    }

    return callback(new Error(`Origin ${origin} is not allowed by CORS`));
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
};

app.use(cors(corsOptions));
app.use(express.json());

// Trust first proxy when running behind AWS ALB / Nginx reverse proxy
app.set('trust proxy', 1);

// ========================================================
// 2. Health Check Endpoints
// ========================================================
// Root health check for AWS EC2, ALB, and Docker pingers
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    uptime: process.uptime(),
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
  });
});

// Preserved existing API health check endpoint
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'BikeGo Backend Server is running smoothly!',
    timestamps: new Date().toISOString(),
  });
});

// ========================================================
// 3. Mount API Routes
// ========================================================
app.use('/api/auth', authRoutes);
app.use('/api/bikes', bikeRoutes);
app.use('/api/bookings', bookingRoutes);

// ========================================================
// 4. 404 Route Handler
// ========================================================
app.use((req, res) => {
  res.status(404).json({
    message: `Endpoint ${req.method} ${req.originalUrl} not found`,
  });
});

// ========================================================
// 5. Centralized Error Handling Middleware
// ========================================================
app.use((err, req, res, next) => { // eslint-disable-line no-unused-vars
  console.error('[Error Handler]', err);

  const statusCode = err.statusCode || err.status || 500;
  res.status(statusCode).json({
    message: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });
});

// ========================================================
// 6. Server Initialization
// ========================================================
const startServer = async () => {
  try {
    // Ensure DB connection is established before accepting incoming traffic
    await connectDB();

    app.listen(PORT, HOST, () => {
      console.log(`[Server] Karthik-BikeGo Backend running on http://${HOST}:${PORT}`);
      console.log(`[Server] Health check available at http://${HOST}:${PORT}/health`);
      console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    });
  } catch (err) {
    console.error('[Server] Failed to initialize server:', err.message);
    process.exit(1);
  }
};

// Only start server when executed directly as main script
const isDirectRun = process.argv[1] && fileURLToPath(import.meta.url) === path.resolve(process.argv[1]);
if (isDirectRun) {
  startServer();
}

export { app, startServer };
export default app;

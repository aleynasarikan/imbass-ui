import 'dotenv/config';
import http from 'http';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import authRoutes from './routes/authRoutes';
import profileRoutes from './routes/profileRoutes';
import onboardingRoutes from './routes/onboardingRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import dataRoutes from './routes/dataRoutes';
import negotiationRoutes from './routes/negotiationRoutes';
import creatorRoutes from './routes/creatorRoutes';
import meRoutes from './routes/meRoutes';
import agencyRoutes from './routes/agencyRoutes';
import campaignRoutes from './routes/campaignRoutes';
import applicationRoutes from './routes/applicationRoutes';
import milestoneRoutes from './routes/milestoneRoutes';
import agencyLeaderboardRoutes from './routes/agencyLeaderboardRoutes';

import { errorHandler } from './middleware/error';
import { initSocket } from './socket';

import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5002;

// ── Sprint 5: Rate Limiting ──────────────────────────────────────────────────
// General API rate limiter: max 300 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, 
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many requests from this IP, please try again after 15 minutes' },
});

// Stricter limiter for Auth endpoints: max 20 requests per 15 minutes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { message: 'Too many auth requests from this IP, please try again later' },
});

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001',
  'http://localhost:5173',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

// Middleware
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
}));
app.use(express.json());
app.use(cookieParser());

// Debug logger
app.use((req, res, next) => {
  console.log(`[DEBUG] Incoming request: ${req.method} ${req.url}`);
  next();
});

// Root / Health Check
app.get('/', (req, res) => {
  res.json({ message: 'IMBASS API is running', version: '1.0.0' });
});

// API Routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api', apiLimiter); // Apply general limiter to all other /api routes
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/me', meRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api/campaigns', campaignRoutes);
app.use('/api/applications', applicationRoutes);
app.use('/api/milestones', milestoneRoutes);
app.use('/api/agencies', agencyLeaderboardRoutes);
app.use('/api', dataRoutes);

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized Error Handler
app.use(errorHandler);

// ── HTTP server + Socket.IO ──────────────────────────────────────────────────
const httpServer = http.createServer(app);
initSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  console.log(`Socket.IO ready on ws://localhost:${PORT}`);
});

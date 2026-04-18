import 'dotenv/config';
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

import { errorHandler } from './middleware/error';

const app = express();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5002;

const allowedOrigins = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
  'http://localhost:3001', // Backup ports if 3000 is occupied
  'http://localhost:5173', // Default for Vite
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

// Middleware
app.use(cors({
  origin: (origin: string | undefined, callback: (err: Error | null, allow?: boolean) => void) => {
    // allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true // Allow receiving cookies
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
app.use('/api/auth', authRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/onboarding', onboardingRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/negotiations', negotiationRoutes);
app.use('/api/creators', creatorRoutes);
app.use('/api/me', meRoutes);
app.use('/api/agency', agencyRoutes);
app.use('/api', dataRoutes); // /api/influencers, /api/campaigns

// 404 Handler
app.use((req, res, next) => {
  res.status(404).json({ message: 'Route not found' });
});

// Centralized Error Handler
app.use(errorHandler);

// Start Server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

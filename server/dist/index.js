"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const profileRoutes_1 = __importDefault(require("./routes/profileRoutes"));
const onboardingRoutes_1 = __importDefault(require("./routes/onboardingRoutes"));
const analyticsRoutes_1 = __importDefault(require("./routes/analyticsRoutes"));
const dataRoutes_1 = __importDefault(require("./routes/dataRoutes"));
const negotiationRoutes_1 = __importDefault(require("./routes/negotiationRoutes"));
const creatorRoutes_1 = __importDefault(require("./routes/creatorRoutes"));
const meRoutes_1 = __importDefault(require("./routes/meRoutes"));
const agencyRoutes_1 = __importDefault(require("./routes/agencyRoutes"));
const error_1 = require("./middleware/error");
const app = (0, express_1.default)();
const PORT = process.env.PORT || process.env.SERVER_PORT || 5002;
const allowedOrigins = [
    'http://localhost:3000',
    'http://127.0.0.1:3000',
    'http://localhost:3001',
    'http://localhost:5173',
    process.env.FRONTEND_URL
].filter(Boolean);
// Middleware
app.use((0, cors_1.default)({
    origin: (origin, callback) => {
        // allow requests with no origin (like mobile apps or curl requests)
        if (!origin)
            return callback(null, true);
        if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV === 'development') {
            callback(null, true);
        }
        else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true // Allow receiving cookies
}));
app.use(express_1.default.json());
app.use((0, cookie_parser_1.default)());
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
app.use('/api/auth', authRoutes_1.default);
app.use('/api/profile', profileRoutes_1.default);
app.use('/api/onboarding', onboardingRoutes_1.default);
app.use('/api/analytics', analyticsRoutes_1.default);
app.use('/api/negotiations', negotiationRoutes_1.default);
app.use('/api/creators', creatorRoutes_1.default);
app.use('/api/me', meRoutes_1.default);
app.use('/api/agency', agencyRoutes_1.default);
app.use('/api', dataRoutes_1.default); // /api/influencers, /api/campaigns
// 404 Handler
app.use((req, res, next) => {
    res.status(404).json({ message: 'Route not found' });
});
// Centralized Error Handler
app.use(error_1.errorHandler);
// Start Server
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});

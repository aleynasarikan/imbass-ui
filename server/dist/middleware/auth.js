"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.requireAuth = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const requireAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // "Bearer <TOKEN>"
    if (!token) {
        return res.status(401).json({ message: 'Access Denied: No Token Provided' });
    }
    jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Access Denied: Invalid Token' });
        }
        req.user = decoded;
        next();
    });
};
exports.requireAuth = requireAuth;
const requireRole = (roleName) => {
    return (req, res, next) => {
        if (!req.user || req.user.role !== roleName) {
            return res.status(403).json({ message: `Access Denied: Requires ${roleName} role` });
        }
        next();
    };
};
exports.requireRole = requireRole;

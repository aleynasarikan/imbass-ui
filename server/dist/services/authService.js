"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logoutUser = exports.refreshUserToken = exports.registerUser = exports.loginUser = exports.generateRefreshToken = exports.generateAccessToken = void 0;
const bcrypt_1 = __importDefault(require("bcrypt"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../db");
const generateAccessToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id, email: user.email, role: user.role }, process.env.JWT_SECRET, { expiresIn: (process.env.JWT_EXPIRATION || '15m') });
};
exports.generateAccessToken = generateAccessToken;
const generateRefreshToken = (user) => {
    return jsonwebtoken_1.default.sign({ id: user.id }, process.env.REFRESH_TOKEN_SECRET, { expiresIn: (process.env.REFRESH_TOKEN_EXPIRATION || '7d') });
};
exports.generateRefreshToken = generateRefreshToken;
const loginUser = async (email, password) => {
    const result = await (0, db_1.query)('SELECT * FROM users WHERE email = $1', [email]);
    const user = result.rows[0];
    if (!user) {
        throw { statusCode: 401, message: 'User not found' };
    }
    const validPassword = await bcrypt_1.default.compare(password, user.password_hash);
    if (!validPassword) {
        throw { statusCode: 401, message: 'Invalid password' };
    }
    const accessToken = (0, exports.generateAccessToken)(user);
    const refreshToken = (0, exports.generateRefreshToken)(user);
    // Save refresh token to DB
    await (0, db_1.query)('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);
    return {
        accessToken,
        refreshToken,
        user: { id: user.id, email: user.email, role: user.role, isOnboarding: user.is_onboarding }
    };
};
exports.loginUser = loginUser;
const registerUser = async (email, password, role) => {
    const client = await (0, db_1.getClient)();
    try {
        await client.query('BEGIN');
        const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
        if (existingUser.rows.length > 0) {
            await client.query('ROLLBACK');
            throw { statusCode: 409, message: 'Email already exists' };
        }
        const saltRounds = 10;
        const hashedPassword = await bcrypt_1.default.hash(password, saltRounds);
        const userResult = await client.query('INSERT INTO users (email, password_hash, role, is_onboarding) VALUES ($1, $2, $3, true) RETURNING id', [email, hashedPassword, role]);
        const userId = userResult.rows[0].id;
        await client.query('INSERT INTO profiles (user_id, full_name, contact_email) VALUES ($1, $2, $3)', [userId, email.split('@')[0], email]);
        const newUser = { id: userId, email, role };
        const accessToken = (0, exports.generateAccessToken)(newUser);
        const refreshToken = (0, exports.generateRefreshToken)(newUser);
        await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, userId]);
        await client.query('COMMIT');
        return {
            accessToken,
            refreshToken,
            user: { id: userId, email, role, isOnboarding: true }
        };
    }
    catch (error) {
        await client.query('ROLLBACK');
        throw error;
    }
    finally {
        client.release();
    }
};
exports.registerUser = registerUser;
const refreshUserToken = async (token) => {
    const result = await (0, db_1.query)('SELECT * FROM users WHERE refresh_token = $1', [token]);
    const user = result.rows[0];
    if (!user) {
        throw { statusCode: 403, message: 'Invalid refresh token' };
    }
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, process.env.REFRESH_TOKEN_SECRET, (err, decoded) => {
            if (err || decoded.id !== user.id) {
                return reject({ statusCode: 403, message: 'Token verification failed' });
            }
            resolve((0, exports.generateAccessToken)(user));
        });
    });
};
exports.refreshUserToken = refreshUserToken;
const logoutUser = async (token) => {
    await (0, db_1.query)('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [token]);
};
exports.logoutUser = logoutUser;

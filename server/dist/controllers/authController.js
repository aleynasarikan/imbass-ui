"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logout = exports.refresh = exports.register = exports.login = void 0;
const authService_1 = require("../services/authService");
const catchAsync_1 = require("../utils/catchAsync");
const setRefreshCookie = (res, token) => {
    res.cookie('refresh_token', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
    });
};
exports.login = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password } = req.body;
    const { accessToken, refreshToken, user } = await (0, authService_1.loginUser)(email, password);
    setRefreshCookie(res, refreshToken);
    res.json({ accessToken, user });
});
exports.register = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const { email, password, role } = req.body;
    const { accessToken, refreshToken, user } = await (0, authService_1.registerUser)(email, password, role);
    setRefreshCookie(res, refreshToken);
    res.status(201).json({ accessToken, user });
});
exports.refresh = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (!refreshToken) {
        return res.status(401).json({ message: 'No refresh token provided' });
    }
    const accessToken = await (0, authService_1.refreshUserToken)(refreshToken);
    res.json({ accessToken });
});
exports.logout = (0, catchAsync_1.catchAsync)(async (req, res) => {
    const refreshToken = req.cookies.refresh_token;
    if (refreshToken) {
        await (0, authService_1.logoutUser)(refreshToken);
    }
    res.clearCookie('refresh_token');
    res.status(200).json({ message: 'Logged out successfully' });
});

import { Request, Response } from 'express';
import { loginUser, registerUser, refreshUserToken, logoutUser } from '../services/authService';
import { catchAsync } from '../utils/catchAsync';

const setRefreshCookie = (res: Response, token: string) => {
  res.cookie('refresh_token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 Days
  });
};

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { accessToken, refreshToken, user } = await loginUser(email, password);

  setRefreshCookie(res, refreshToken);

  res.json({ accessToken, user });
});

export const register = catchAsync(async (req: Request, res: Response) => {
  const { email, password, role } = req.body;
  const { accessToken, refreshToken, user } = await registerUser(email, password, role);

  setRefreshCookie(res, refreshToken);

  res.status(201).json({ accessToken, user });
});

export const refresh = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  if (!refreshToken) {
    return res.status(401).json({ message: 'No refresh token provided' });
  }

  const accessToken = await refreshUserToken(refreshToken);
  res.json({ accessToken });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refresh_token;
  if (refreshToken) {
    await logoutUser(refreshToken);
  }

  res.clearCookie('refresh_token');
  res.status(200).json({ message: 'Logged out successfully' });
});

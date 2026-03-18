import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { query, getClient } from '../db';
import { User, AuthResponse } from '../types';

export const generateAccessToken = (user: { id: string; email: string; role: string }): string => {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET as string,
    { expiresIn: (process.env.JWT_EXPIRATION || '15m') as any }
  );
};

export const generateRefreshToken = (user: { id: string }): string => {
  return jwt.sign(
    { id: user.id },
    process.env.REFRESH_TOKEN_SECRET as string,
    { expiresIn: (process.env.REFRESH_TOKEN_EXPIRATION || '7d') as any }
  );
};

export const loginUser = async (email: string, password: string):Promise<{ accessToken: string; refreshToken: string; user: AuthResponse['user'] }> => {
  const result = await query('SELECT * FROM users WHERE email = $1', [email]);
  const user = result.rows[0] as User;

  if (!user) {
    throw { statusCode: 401, message: 'User not found' };
  }

  const validPassword = await bcrypt.compare(password, user.password_hash);
  if (!validPassword) {
    throw { statusCode: 401, message: 'Invalid password' };
  }

  const accessToken = generateAccessToken(user);
  const refreshToken = generateRefreshToken(user);

  // Save refresh token to DB
  await query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, user.id]);

  return {
    accessToken,
    refreshToken,
    user: { id: user.id, email: user.email, role: user.role, isOnboarding: user.is_onboarding }
  };
};

export const registerUser = async (email: string, password: string, role: string):Promise<{ accessToken: string; refreshToken: string; user: AuthResponse['user'] }> => {
  const client = await getClient();
  try {
    await client.query('BEGIN');

    const existingUser = await client.query('SELECT id FROM users WHERE email = $1', [email]);
    if (existingUser.rows.length > 0) {
      await client.query('ROLLBACK');
      throw { statusCode: 409, message: 'Email already exists' };
    }

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const userResult = await client.query(
      'INSERT INTO users (email, password_hash, role, is_onboarding) VALUES ($1, $2, $3, true) RETURNING id',
      [email, hashedPassword, role]
    );
    const userId = userResult.rows[0].id;

    await client.query(
      'INSERT INTO profiles (user_id, full_name, contact_email) VALUES ($1, $2, $3)',
      [userId, email.split('@')[0], email]
    );

    const newUser = { id: userId, email, role };
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    await client.query('UPDATE users SET refresh_token = $1 WHERE id = $2', [refreshToken, userId]);

    await client.query('COMMIT');

    return {
      accessToken,
      refreshToken,
      user: { id: userId, email, role, isOnboarding: true }
    };
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
};

export const refreshUserToken = async (token: string): Promise<string> => {
  const result = await query('SELECT * FROM users WHERE refresh_token = $1', [token]);
  const user = result.rows[0] as User;

  if (!user) {
    throw { statusCode: 403, message: 'Invalid refresh token' };
  }

  return new Promise((resolve, reject) => {
    jwt.verify(token, process.env.REFRESH_TOKEN_SECRET as string, (err, decoded) => {
      if (err || (decoded as any).id !== user.id) {
        return reject({ statusCode: 403, message: 'Token verification failed' });
      }

      resolve(generateAccessToken(user));
    });
  });
};

export const logoutUser = async (token: string): Promise<void> => {
  await query('UPDATE users SET refresh_token = NULL WHERE refresh_token = $1', [token]);
};

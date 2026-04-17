import { Request } from 'express';

/**
 * Platform roles:
 * - INFLUENCER: creator (individual)
 * - AGENCY: manages roster of creators (CRM user)
 * - BRAND: sponsor reaching creators directly (future: marketplace buyer)
 * - PRODUCER: legacy — kept for backwards compatibility
 */
export type UserRole = 'INFLUENCER' | 'AGENCY' | 'BRAND' | 'PRODUCER';

export const USER_ROLES: ReadonlyArray<UserRole> = ['INFLUENCER', 'AGENCY', 'BRAND', 'PRODUCER'];

export interface User {
  id: string; // UUID
  email: string;
  password_hash: string;
  role: UserRole;
  is_onboarding: boolean;
  refresh_token: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface Profile {
  id: string; // UUID
  user_id: string;
  full_name: string;
  bio: string | null;
  location: string | null;
  contact_email: string;
  company_name: string | null;
  logo_url: string | null;
  created_at: Date;
  updated_at: Date;
}

export interface JwtPayload {
  id: string;
  email?: string;
  role?: UserRole;
}

/**
 * Express request after `requireAuth` middleware has run.
 * `user` is guaranteed non-null when handlers are mounted behind `requireAuth`.
 * Use this type in route handlers instead of bare `Request` + `@ts-ignore`.
 */
export interface AuthRequest extends Request {
  user: JwtPayload;
}

/** Request where `user` may be undefined (pre-auth or optional-auth routes). */
export interface AuthenticatedRequest extends Request {
  user?: JwtPayload;
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export interface AuthResponse {
  accessToken: string;
  user?: {
    id: string;
    email: string;
    role: string;
    isOnboarding: boolean;
  };
}

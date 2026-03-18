import { Request } from 'express';

export interface User {
  id: string; // UUID
  email: string;
  password_hash: string;
  role: 'INFLUENCER' | 'AGENCY';
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
  role?: string;
}

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

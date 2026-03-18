import { z } from 'zod';

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(6, 'Password must be at least 6 characters'),
    role: z.enum(['INFLUENCER', 'AGENCY']),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Invalid email address'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const profileUpdateSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    bio: z.string().nullable().optional(),
    location: z.string().nullable().optional(),
    email: z.string().email('Invalid email address'),
    platforms: z.object({
      youtube: z.boolean().optional(),
      instagram: z.boolean().optional(),
      tiktok: z.boolean().optional(),
    }).optional(),
  }),
});

export const influencerOnboardingSchema = z.object({
  body: z.object({
    username: z.string().min(1, 'Username is required'),
    socialAccounts: z.array(z.object({
      platform: z.enum(['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'youtube', 'instagram', 'tiktok']),
      username: z.string().min(1, 'Platform username is required'),
      profileUrl: z.string().url('Invalid URL').optional().or(z.literal('')),
    })).optional(),
  }),
});

export const agencyOnboardingSchema = z.object({
  body: z.object({
    companyName: z.string().min(1, 'Company name is required'),
    logoUrl: z.string().url('Invalid Logo URL').optional().or(z.literal('')),
  }),
});

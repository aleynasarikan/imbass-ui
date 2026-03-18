"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.agencyOnboardingSchema = exports.influencerOnboardingSchema = exports.profileUpdateSchema = exports.loginSchema = exports.registerSchema = void 0;
const zod_1 = require("zod");
exports.registerSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(6, 'Password must be at least 6 characters'),
        role: zod_1.z.enum(['INFLUENCER', 'AGENCY'], {
            error: 'Invalid role. Must be INFLUENCER or AGENCY.'
        }),
    }),
});
exports.loginSchema = zod_1.z.object({
    body: zod_1.z.object({
        email: zod_1.z.string().email('Invalid email address'),
        password: zod_1.z.string().min(1, 'Password is required'),
    }),
});
exports.profileUpdateSchema = zod_1.z.object({
    body: zod_1.z.object({
        name: zod_1.z.string().min(1, 'Name is required'),
        bio: zod_1.z.string().nullable().optional(),
        location: zod_1.z.string().nullable().optional(),
        email: zod_1.z.string().email('Invalid email address'),
        platforms: zod_1.z.object({
            youtube: zod_1.z.boolean().optional(),
            instagram: zod_1.z.boolean().optional(),
            tiktok: zod_1.z.boolean().optional(),
        }).optional(),
    }),
});
exports.influencerOnboardingSchema = zod_1.z.object({
    body: zod_1.z.object({
        username: zod_1.z.string().min(1, 'Username is required'),
        socialAccounts: zod_1.z.array(zod_1.z.object({
            platform: zod_1.z.enum(['YOUTUBE', 'INSTAGRAM', 'TIKTOK', 'youtube', 'instagram', 'tiktok']),
            username: zod_1.z.string().min(1, 'Platform username is required'),
            profileUrl: zod_1.z.string().url('Invalid URL').optional().or(zod_1.z.literal('')),
        })).optional(),
    }),
});
exports.agencyOnboardingSchema = zod_1.z.object({
    body: zod_1.z.object({
        companyName: zod_1.z.string().min(1, 'Company name is required'),
        logoUrl: zod_1.z.string().url('Invalid Logo URL').optional().or(zod_1.z.literal('')),
    }),
});

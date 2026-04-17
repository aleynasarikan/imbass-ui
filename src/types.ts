export type UserRole = 'INFLUENCER' | 'AGENCY' | 'BRAND' | 'PRODUCER';

export interface User {
    id: string;
    email: string;
    /**
     * Platform roles:
     * - INFLUENCER: a creator (individual)
     * - AGENCY: manages a roster of creators (CRM user)
     * - BRAND: a sponsor reaching out directly to creators (marketplace buyer)
     * - PRODUCER: legacy — kept for backwards compatibility with older records
     */
    role: UserRole;
    isOnboarding: boolean;
}

export interface Profile {
    id: string;
    userId: string;
    fullName: string;
    bio?: string;
    location?: string;
    contactEmail: string;
    avatarUrl?: string;
    companyName?: string;
    logoUrl?: string;
    platforms?: Platform[];
}

export interface Platform {
    id: string;
    profileId: string;
    platformName: 'YOUTUBE' | 'INSTAGRAM' | 'TIKTOK';
    username: string;
    followerCount: number;
    profileLink?: string;
}

export interface Campaign {
    id: string;
    creatorId: string;
    title: string;
    description?: string;
    budgetCents: number;
    currency: string;
    status: 'DRAFT' | 'ACTIVE' | 'SETTLED' | 'CANCELLED';
    createdAt: string;
}

export interface AuthContextType {
    user: User | null;
    login: (email: string, password: unknown) => Promise<User>;
    logout: () => Promise<void>;
    register: (data: any) => Promise<User>;
    completeOnboarding: () => void;
    loading: boolean;
}

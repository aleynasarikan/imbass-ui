export interface User {
    id: string;
    email: string;
    role: 'INFLUENCER' | 'AGENCY' | 'PRODUCER';
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

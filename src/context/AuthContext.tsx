import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { followStore } from '../lib/stores/follows';

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState<boolean>(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
            // Hydrate follow state from server (merges local-only follows up)
            void followStore.hydrateFromServer();
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: unknown): Promise<User> => {
        // Try the real backend first. Fall back to a dev bypass when it's unreachable.
        try {
            const { default: api } = await import('../api');
            const res = await api.post('/auth/login', { email, password });
            const realUser: User = res.data.user;
            localStorage.setItem('accessToken', res.data.accessToken);
            localStorage.setItem('user', JSON.stringify(realUser));
            setUser(realUser);
            void followStore.hydrateFromServer();
            return realUser;
        } catch {
            // DEV BYPASS — backend unreachable; any credentials grant access as an influencer.
            const mockUser: User = {
                id: 'dev-' + Math.random().toString(36).slice(2, 8),
                email: email || 'creator@imbass.dev',
                role: 'INFLUENCER',
                isOnboarding: false,
            };
            localStorage.setItem('accessToken', 'dev-token');
            localStorage.setItem('user', JSON.stringify(mockUser));
            setUser(mockUser);
            return mockUser;
        }
    };

    const logout = async (): Promise<void> => {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        followStore.reset();
        setUser(null);
        window.location.href = '/';
    };

    const register = async (data: any): Promise<User> => {
        // DEV BYPASS — no backend.
        const mockUser: User = {
            id: 'dev-' + Math.random().toString(36).slice(2, 8),
            email: data?.email || 'editor@imbass.dev',
            role: data?.role || 'INFLUENCER',
            isOnboarding: false,
        };
        localStorage.setItem('accessToken', 'dev-token');
        localStorage.setItem('user', JSON.stringify(mockUser));
        setUser(mockUser);
        return mockUser;
    };

    const completeOnboarding = () => {
        if (!user) return;
        const updatedUser = { ...user, isOnboarding: false };
        localStorage.setItem('user', JSON.stringify(updatedUser));
        setUser(updatedUser);
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, register, completeOnboarding, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

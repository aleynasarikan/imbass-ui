import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import api from '../api';
import { User, AuthContextType } from '../types';

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
        }
        setLoading(false);
    }, []);

    const login = async (email: string, password: unknown): Promise<User> => {
        try {
            const response = await api.post('/auth/login', { email, password });
            const { accessToken, user: userData } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (error) {
            console.error("Login failed", error);
            throw error;
        }
    };

    const logout = async (): Promise<void> => {
        try {
            await api.post('/auth/logout');
        } catch (err) {
            console.error("Error logging out", err);
        } finally {
            localStorage.removeItem('accessToken');
            localStorage.removeItem('user');
            setUser(null);
            window.location.href = '/';
        }
    };

    const register = async (data: any): Promise<User> => {
        try {
            const response = await api.post('/auth/register', data);
            const { accessToken, user: userData } = response.data;

            localStorage.setItem('accessToken', accessToken);
            localStorage.setItem('user', JSON.stringify(userData));
            setUser(userData);
            return userData;
        } catch (err) {
            console.error("Registration failed", err);
            throw err;
        }
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

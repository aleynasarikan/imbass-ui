import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check if user is logged in on mount
        const storedUser = localStorage.getItem('user');
        const token = localStorage.getItem('accessToken');

        if (storedUser && token) {
            setUser(JSON.parse(storedUser));
        }
        setLoading(false);
    }, []);

    const login = async (email, password) => {
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

    const logout = async () => {
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

    const register = async ({ email, password, role }) => {
        try {
            const response = await api.post('/auth/register', { email, password, role });
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

export const useAuth = () => useContext(AuthContext);

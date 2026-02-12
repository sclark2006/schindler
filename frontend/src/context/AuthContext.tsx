import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

interface User {
    username: string;
    sub: number;
}

interface AuthContextType {
    user: User | null;
    token: string | null;
    login: (username: string, token: string) => void;
    logout: () => void;
    isAuthenticated: boolean;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [token, setToken] = useState<string | null>(localStorage.getItem('token'));

    useEffect(() => {
        if (token) {
            // Decenter token roughly or just assume valid for now
            // In a real app we'd decode the JWT to get the user info
            // For this prototype, we'll just set a dummy user if we have a token
            setUser({ username: 'admin', sub: 1 });
            localStorage.setItem('token', token);

            // Set default headers
            axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
        } else {
            setUser(null);
            localStorage.removeItem('token');
            delete axios.defaults.headers.common['Authorization'];
        }
    }, [token]);

    const login = (username: string, newToken: string) => {
        setToken(newToken);
        setUser({ username, sub: 1 });
    };

    const logout = () => {
        setToken(null);
        setUser(null);
    };

    return (
        <AuthContext.Provider value={{ user, token, login, logout, isAuthenticated: !!token }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

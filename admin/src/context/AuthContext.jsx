// src/context/AuthContext.js
import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const token = localStorage.getItem('admin-token');
        console.log("Current user's token: ", token);
        if (token) {
            try {
                const userData = JSON.parse(atob(token.split('.')[1])); // Decode the token to get user data
                setUser(userData);
                console.log(`Yes, logged in: ${userData}`);
            } catch (error) {
                console.error('Failed to decode token:', error);
                localStorage.removeItem('admin-token'); // Clear invalid token
            }
        }
        setLoading(false); // <-- Set loading to false after check
    }, []);

    const login = (data) => {
        const token = data.token;
        if (token) {
            localStorage.setItem('admin-token', token);
            try {
                const userData = JSON.parse(atob(token.split('.')[1]));
                setUser(userData);
                console.log(`Saved user data: ${userData}`);
            } catch (error) {
                setUser(null);
                localStorage.removeItem('admin-token');
            }
        }
    };

    const logout = () => {
        setUser(null);
        localStorage.removeItem('admin-token'); // Remove token from localStorage
    };

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    return useContext(AuthContext);
};

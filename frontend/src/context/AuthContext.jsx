import React, { createContext, useContext, useState, useEffect } from 'react';
import { getCurrentUser } from '../services/api';

/**
 * AuthContext
 * Central state management for user authentication, JWT persistence, and session lifecycle.
 *
 * Security Architecture & Strategy:
 * - JWT token is maintained in memory during runtime and persisted to localStorage ('quizconnect_token').
 * - Plaintext user credentials (passwords) are NEVER stored in browser storage.
 * - On app initialization/page reload, the persisted token is verified against GET /api/auth/me.
 * - If invalid or expired, the session is purged immediately.
 */
const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const savedToken = localStorage.getItem('quizconnect_token');
      const savedUserStr = localStorage.getItem('quizconnect_user');

      if (savedToken) {
        setToken(savedToken);
        if (savedUserStr) {
          try {
            setUser(JSON.parse(savedUserStr));
          } catch {
            // Ignore parse error
          }
        }

        // Verify token validity with backend
        try {
          const verifiedUser = await getCurrentUser();
          setUser(verifiedUser);
          localStorage.setItem('quizconnect_user', JSON.stringify(verifiedUser));
        } catch (error) {
          // Token is expired or invalid
          console.warn('Session verification failed, clearing credentials:', error.message);
          localStorage.removeItem('quizconnect_token');
          localStorage.removeItem('quizconnect_user');
          setToken(null);
          setUser(null);
        }
      }

      setLoading(false);
    };

    initializeAuth();
  }, []);

  /**
   * Log in user, persist JWT and user metadata, update context state.
   */
  const login = (accessToken, userData) => {
    localStorage.setItem('quizconnect_token', accessToken);
    localStorage.setItem('quizconnect_user', JSON.stringify(userData));
    setToken(accessToken);
    setUser(userData);
  };

  /**
   * Log out user, purge storage, reset context state.
   */
  const logout = () => {
    localStorage.removeItem('quizconnect_token');
    localStorage.removeItem('quizconnect_user');
    setToken(null);
    setUser(null);
  };

  /**
   * Refresh user profile from backend.
   */
  const refreshUser = async () => {
    try {
      const userData = await getCurrentUser();
      setUser(userData);
      localStorage.setItem('quizconnect_user', JSON.stringify(userData));
      return userData;
    } catch {
      logout();
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        isTeacher: user?.role === 'teacher',
        isStudent: user?.role === 'student',
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
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

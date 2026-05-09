'use client';

import { createContext, useState, useEffect, useContext } from 'react';
import { authService } from '../services/api';

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
      if (token) {
        try {
          const response = await authService.getMe();
          setCurrentUser(response.data.user);
        } catch (error) {
          if (typeof window !== 'undefined') {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
          }
        }
      }
      setLoading(false);
    };
    initAuth();
  }, []);

  const login = async (credentials) => {
    const response = await authService.login(credentials);
    const { token, user } = response.data;
    localStorage.setItem('token', token);
    localStorage.setItem('user', JSON.stringify(user));
    setCurrentUser(user);
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
  };

  const isSuperAdmin = currentUser?.role === 'super-admin';
  const isAdmin = currentUser?.role === 'admin' || isSuperAdmin;
  const isEmployee = currentUser?.role === 'employee';
  const isUser = currentUser?.role === 'user';
  
  // HR is defined as anyone in the HR department or an admin
  const isHR = currentUser?.department?.toUpperCase() === 'HR' || 
               currentUser?.department === 'General Management/Administration' || 
               isAdmin;

  // Dashboard access is for admins OR HR with explicit permission
  const hasDashboardAccess = isAdmin || (isHR && currentUser?.permissions?.canAccessDashboard);

  const value = {
    currentUser,
    login,
    logout,
    loading,
    isAdmin,
    isSuperAdmin,
    isHR,
    isEmployee,
    isUser,
    hasDashboardAccess
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

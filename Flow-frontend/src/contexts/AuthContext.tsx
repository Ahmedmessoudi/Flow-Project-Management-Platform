import React, { createContext, useContext, useState, ReactNode } from 'react';
import { api } from '@/lib/api';

export type UserRole = 'SUPER_ADMIN' | 'ORG_ADMIN' | 'PROJECT_MANAGER' | 'TEAM_MEMBER' | 'CLIENT';

interface User {
  id?: number;
  username?: string;
  email: string;
  name?: string;
  roles?: UserRole[];
  // backward-compatible single role accessor used in some components
  role?: UserRole;
}

interface AuthContextType {
  user: User | null;
  // returns an object with success flag and optional message from server
  login: (usernameOrEmail: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => void;
  hasAccess: (allowedRoles: UserRole[]) => boolean;
  getAuthHeader: () => { Authorization: string } | {};
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8080';

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('currentUser');
    return stored ? JSON.parse(stored) : null;
  });

  const login = async (usernameOrEmail: string, password: string): Promise<{ success: boolean; message?: string }> => {
    try {
      const data = await api.post('/api/auth/signin', { username: usernameOrEmail, password });
      // JwtResponse: { token, id, username, email, roles }
      const token = data.token;
      const roles: UserRole[] = Array.isArray(data.roles) ? data.roles : [];
      const currentUser: User = {
        id: data.id,
        username: data.username,
        email: data.email,
        roles,
        role: roles.length > 0 ? roles[0] : undefined,
        name: data.username ?? data.email
      };

      localStorage.setItem('jwtToken', token);
      localStorage.setItem('currentUser', JSON.stringify(currentUser));
      setUser(currentUser);
      return { success: true };
    } catch (err: any) {
      const message = err?.message ?? 'Login failed';
      console.error('Login error', message);
      return { success: false, message };
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('currentUser');
    localStorage.removeItem('jwtToken');
  };

  const hasAccess = (allowedRoles: UserRole[]): boolean => {
    if (!user || !user.roles) return false;
    return user.roles.some(r => allowedRoles.includes(r));
  };

  const getAuthHeader = () => {
    const token = localStorage.getItem('jwtToken');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, hasAccess, getAuthHeader }}>
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

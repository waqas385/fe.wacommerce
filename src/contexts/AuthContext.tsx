import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User } from '@/services/auth';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = () => {
      const token = api.getToken();
      if (!token) {
        setLoading(false);
        return;
      }

      /**
       * Since we removed getCurrentUser(),
       * the simplest approach is to store user in localStorage
       * when logging in and restore it here.
       */
      const storedUser = localStorage.getItem('auth_user');

      if (storedUser) {
        const parsedUser = JSON.parse(storedUser);
        setUser(parsedUser);
      } else {
        // Token exists but no user stored → clear token
        api.setToken(null);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    try {
      const data = await authService.signup(email, password, fullName, phoneNumber);

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { error: null };
      }

      return { error: new Error('Signup failed') };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const data = await authService.signin(email, password);

      if (data?.user) {
        setUser(data.user);
        localStorage.setItem('auth_user', JSON.stringify(data.user));
        return { error: null };
      }

      return { error: new Error('Login failed') };
    } catch (err: any) {
      return { error: err };
    }
  };

  const signOut = async () => {
    await authService.logout();
    localStorage.removeItem('auth_user');
    setUser(null);
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider value={{ user, loading, isAdmin, signUp, signIn, signOut }}>
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
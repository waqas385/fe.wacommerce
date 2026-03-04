import React, { createContext, useContext, useEffect, useState } from 'react';
import { authService, User, ApiError } from '@/services/auth';
import { api } from '@/services/api';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  isAdmin: boolean;
  signUp: (email: string, password: string, fullName: string, phoneNumber: string) => Promise<{ error: ApiError | null }>;
  signIn: (email: string, password: string) => Promise<{ error: ApiError | null }>;
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

      const storedUser = localStorage.getItem('auth_user');

      if (storedUser) {
        try {
          const parsedUser = JSON.parse(storedUser);
          setUser(parsedUser);
        } catch (e) {
          // Invalid stored user data
          localStorage.removeItem('auth_user');
          api.setToken(null);
        }
      } else {
        // Token exists but no user stored → clear token
        api.setToken(null);
      }

      setLoading(false);
    };

    initAuth();
  }, []);

  const signUp = async (email: string, password: string, fullName: string, phoneNumber: string) => {
    const { data, error } = await authService.signup(email, password, fullName, phoneNumber);

    if (error) {
      return { error };
    }

    if (data?.user) {
      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return { error: null };
    }

    return { error: { message: 'Signup failed: No user data received' } };
  };

  const signIn = async (email: string, password: string) => {
    const { data, error } = await authService.signin(email, password);

    if (error) {
      return { error };
    }

    if (data?.user) {
      setUser(data.user);
      localStorage.setItem('auth_user', JSON.stringify(data.user));
      return { error: null };
    }

    return { error: { message: 'Login failed: No user data received' } };
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
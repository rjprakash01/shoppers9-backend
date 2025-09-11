import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { User } from '../services/auth';
import { authService } from '../services/auth';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (phone: string, otp: string) => Promise<void>;
  logout: () => void;
  updateUser: (userData: Partial<User>) => Promise<void>;
  setUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in
    const initializeAuth = async () => {
      try {
        if (authService.isAuthenticated()) {
          // Try to get user from localStorage first
          const storedUser = authService.getCurrentUser();
          if (storedUser) {
            setUser(storedUser);
            // Validate token with server in background
            try {
              const freshUser = await authService.fetchCurrentUser();
              setUser(freshUser);
            } catch (error) {
              // If validation fails, keep the stored user but don't redirect
              
            }
          } else {
            // No stored user, try to fetch from server
            const user = await authService.fetchCurrentUser();
            setUser(user);
          }
        }
      } catch (error) {
        // Token is invalid, clear auth data silently
        localStorage.removeItem('authToken');
        localStorage.removeItem('user');
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = async (phone: string, otp: string) => {
    const { user: loggedInUser } = await authService.verifyOTP(phone, otp);
    setUser(loggedInUser);
  };

  const logout = () => {
    authService.logout();
    setUser(null);
  };

  const updateUser = async (userData: Partial<User>) => {
    const updatedUser = await authService.updateProfile(userData);
    setUser(updatedUser);
  };

  const setUserData = (userData: User) => {
    setUser(userData);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && authService.isAuthenticated(),
    isLoading,
    login,
    logout,
    updateUser,
    setUser: setUserData,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
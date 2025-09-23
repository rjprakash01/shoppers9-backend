/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { authService } from '../services/authService';

interface User {
  id: string;
  name: string;
  phone: string;
  email?: string;
  role: string;
  avatar?: string | null;
  firstName?: string;
  lastName?: string;
  primaryRole?: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (loginField: string, password: string, loginType?: 'email' | 'phone') => Promise<void>;
  logout: () => void;
  isLoading: boolean;
  hasModuleAccess?: (module: string) => boolean;
  hasRole: (role: string) => boolean;
  isSuperAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Export hook separately to fix Fast Refresh compatibility
function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export { useAuth };

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log('🔄 AuthContext: Initializing, checking localStorage...');
    // Check for existing token on app load
    const storedToken = localStorage.getItem('adminToken');
    const storedUser = localStorage.getItem('adminUser');
    console.log('🔄 AuthContext: Found stored token:', !!storedToken, 'user:', !!storedUser);
    
    if (storedToken && storedUser) {
      try {
        const userData = JSON.parse(storedUser);
        console.log('🔄 AuthContext: Parsed stored user data:', userData);
        // Map backend user data to frontend User interface
        const mappedUser = {
          id: userData.id,
          name: `${userData.firstName} ${userData.lastName}`,
          phone: userData.phone,
          email: userData.email,
          role: userData.primaryRole,
          primaryRole: userData.primaryRole,
          firstName: userData.firstName,
          lastName: userData.lastName,
          avatar: null
        };
        console.log('🔄 AuthContext: Mapped user for state:', mappedUser);
        setToken(storedToken);
        setUser(mappedUser);
        console.log('🔄 AuthContext: User state restored from localStorage');
      } catch (error) {
        console.log('🔄 AuthContext: Error parsing stored user data:', error);
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
    } else {
      // Clean up inconsistent localStorage state
      if (storedToken || storedUser) {
        console.log('🔄 AuthContext: Inconsistent localStorage state detected, cleaning up...');
        localStorage.removeItem('adminToken');
        localStorage.removeItem('adminUser');
      }
      console.log('🔄 AuthContext: No stored authentication data found');
    }
    
    console.log('🔄 AuthContext: Initialization complete, setting isLoading to false');
    setIsLoading(false);
  }, []);

  const login = async (loginField: string, password: string, loginType: 'email' | 'phone' = 'email') => {
    try {
      console.log('🔐 AuthContext: Starting login process...');
      const result = await authService.login(loginField, password, loginType);
      console.log('🔐 AuthContext: Login result:', result);
      
      if (result.success) {
        console.log('🔐 AuthContext: Login successful, processing user data...');
        // Use a small delay to ensure localStorage is updated
        await new Promise(resolve => setTimeout(resolve, 100));
        
        // Get the token and user data from localStorage
        const token = localStorage.getItem('adminToken');
        const userStr = localStorage.getItem('adminUser');
        console.log('🔐 AuthContext: Retrieved from localStorage - token:', !!token, 'user:', !!userStr);
        
        if (token && userStr) {
          const userData = JSON.parse(userStr);
          console.log('🔐 AuthContext: Parsed user data:', userData);
          // Map backend user data to frontend User interface
          const mappedUser = {
            id: userData.id,
            name: `${userData.firstName} ${userData.lastName}`,
            phone: userData.phone,
            email: userData.email,
            role: userData.primaryRole,
            primaryRole: userData.primaryRole,
            firstName: userData.firstName,
            lastName: userData.lastName,
            avatar: null
          };
          console.log('🔐 AuthContext: Mapped user:', mappedUser);
          setToken(token);
          setUser(mappedUser);
          console.log('🔐 AuthContext: User state updated successfully!');
        } else {
          // Fallback: use data from result if available
          if (result.user) {
            const mappedUser = {
              id: result.user.id,
              name: `${result.user.firstName} ${result.user.lastName}`,
              phone: result.user.phone,
              email: result.user.email,
              role: result.user.primaryRole,
              primaryRole: result.user.primaryRole,
              firstName: result.user.firstName,
              lastName: result.user.lastName,
              avatar: null
            };
            setUser(mappedUser);
            // Try to get token from localStorage one more time
            const fallbackToken = localStorage.getItem('adminToken');
            if (fallbackToken) {
              setToken(fallbackToken);
            }
          } else {
            throw new Error('Authentication data not properly stored');
          }
        }
      } else {
        throw new Error(result.message || 'Login failed');
      }
    } catch (error) {
      
      throw error;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
  };

  // hasPermission function removed - use usePermissions hook for module access checking

  const hasRole = (role: string): boolean => {
    return user?.role === role || user?.primaryRole === role;
  };

  const isSuperAdmin = (): boolean => {
    return hasRole('super_admin');
  };

  const value = {
    user,
    token,
    login,
    logout,
    isLoading,
    hasRole,
    isSuperAdmin,
    // hasPermission removed - use usePermissions hook instead
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
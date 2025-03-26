import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';

interface User {
  id: number;
  displayName: string;
  email: string;
  profilePicture?: string;
  role: string;
  isAdmin: boolean;
}

interface AuthState {
  isAuthenticated: boolean;
  isLoading: boolean;
  user: User | null;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthState | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [, setLocation] = useLocation();
  
  const { data, isLoading } = useQuery<{ authenticated: boolean; user?: User }>({ 
    queryKey: ['/api/auth/current-user'],
    retry: false,
    refetchOnWindowFocus: true,
    refetchInterval: 5 * 60 * 1000, // Refetch every 5 minutes to keep session alive
  });
  
  const isAuthenticated = !!data?.authenticated;
  const user = isAuthenticated && data?.user ? data.user : null;
  
  // Redirect to login page if not authenticated
  useEffect(() => {
    if (!isLoading && !isAuthenticated && window.location.pathname !== '/login') {
      setLocation('/login');
    }
  }, [isLoading, isAuthenticated, setLocation]);
  
  const logout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
      queryClient.invalidateQueries({ queryKey: ['/api/auth/current-user'] });
      setLocation('/login');
    } catch (error) {
      console.error('Failed to logout:', error);
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        isAuthenticated,
        isLoading,
        user,
        logout
      }}
    >
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

// For use in other files to access the query client
import { queryClient } from '@/lib/queryClient';

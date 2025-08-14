
'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useTheme } from 'next-themes';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (userData: User) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = React.createContext<AuthContextType | undefined>(undefined);

const LOGGED_IN_USER_KEY = 'fenix_logged_in_user';

function getInitialUser(): User | null {
  if (typeof window === 'undefined') {
    return null;
  }
  try {
    const item = window.sessionStorage.getItem(LOGGED_IN_USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting logged in user from sessionStorage:', error);
    return null;
  }
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<User | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);
  const router = useRouter();
  const pathname = usePathname();
  const { setTheme } = useTheme();

  React.useEffect(() => {
    const storedUser = getInitialUser();
    if (storedUser) {
      setUser(storedUser);
      if (storedUser.theme) {
        setTheme(storedUser.theme);
      }
    }
    setIsLoading(false);
  }, [setTheme]);

  React.useEffect(() => {
    if (!isLoading && !user && pathname !== '/') {
      router.replace('/');
    }
  }, [user, isLoading, pathname, router]);


  const login = (userData: User) => {
    try {
      const userToSave = { ...userData };
      delete userToSave.password; // Never store the password
      window.sessionStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(userToSave));
      setUser(userToSave);
      if (userToSave.theme) {
        setTheme(userToSave.theme);
      }
      window.dispatchEvent(new StorageEvent('storage', { key: LOGGED_IN_USER_KEY }));
    } catch (error) {
      console.error('Error saving logged in user to sessionStorage:', error);
    }
  };

  const logout = () => {
    window.sessionStorage.removeItem(LOGGED_IN_USER_KEY);
    setUser(null);
    window.dispatchEvent(new StorageEvent('storage', { key: LOGGED_IN_USER_KEY }));
    router.replace('/');
  };

  const value = { user, login, logout, isLoading };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

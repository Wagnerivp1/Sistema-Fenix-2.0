
'use client';

import * as React from 'react';
import type { User } from '@/types';
// No need to import getUsers, we will read directly from localStorage

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export function useCurrentUser(): AuthState {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
  });

  React.useEffect(() => {
    const fetchUser = () => {
      if (typeof window === 'undefined') {
        setAuthState({ user: null, isLoading: false });
        return;
      }
      
      const loggedInUserObject = localStorage.getItem('loggedInUserObject');
      if (loggedInUserObject) {
        try {
          const currentUser = JSON.parse(loggedInUserObject);
          setAuthState({ user: currentUser, isLoading: false });
        } catch (error) {
          console.error("Failed to parse user data from localStorage:", error);
          setAuthState({ user: null, isLoading: false });
        }
      } else {
        setAuthState({ user: null, isLoading: false });
      }
    };

    fetchUser();

    // The 'storage' event is generic and fires for any localStorage change
    // from other tabs, ensuring session consistency.
    const handleStorageChange = () => fetchUser();

    window.addEventListener('storage', handleStorageChange);
    return () => {
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  return authState;
}

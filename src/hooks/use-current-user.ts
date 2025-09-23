
'use client';

import * as React from 'react';
import type { User } from '@/types';
import { getLoggedInUser } from '@/lib/storage';

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
    const fetchUser = async () => {
      try {
        const currentUser = await getLoggedInUser();
        setAuthState({ user: currentUser, isLoading: false });
      } catch (error) {
        console.error("Failed to fetch logged in user:", error);
        setAuthState({ user: null, isLoading: false });
      }
    };

    fetchUser();
    
    const handleFocus = () => fetchUser();
    const handleStorageChange = (event: StorageEvent) => {
        if (event.key === 'session') {
            fetchUser();
        }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorageChange);
    };
    
  }, []);

  return authState;
}

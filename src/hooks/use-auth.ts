
'use client';

import * as React from 'react';
import type { User } from '@/types';
import { getUsers } from '@/lib/storage';

interface AuthState {
  user: User | null;
  isLoading: boolean;
}

export function useAuth(): AuthState {
  const [authState, setAuthState] = React.useState<AuthState>({
    user: null,
    isLoading: true,
  });

  React.useEffect(() => {
    const fetchUser = async () => {
      if (typeof window === 'undefined') {
        setAuthState({ user: null, isLoading: false });
        return;
      }
      
      const loggedInUserLogin = localStorage.getItem('loggedInUser');
      if (loggedInUserLogin) {
        try {
          const allUsers = await getUsers();
          const currentUser = allUsers.find(u => u.login === loggedInUserLogin) || null;
          setAuthState({ user: currentUser, isLoading: false });
        } catch (error) {
          console.error("Failed to fetch user data:", error);
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


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
    
    // Although we are not using localStorage anymore, other tabs might not
    // be aware of a login/logout. A more robust solution might use
    // BroadcastChannel or websockets, but for this app's scope, we can
    // re-validate periodically or on window focus.
    const handleFocus = () => fetchUser();
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('focus', handleFocus);
    };
    
  }, []);

  return authState;
}

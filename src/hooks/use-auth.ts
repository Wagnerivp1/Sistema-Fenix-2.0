
'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import type { User } from '@/types';

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

export function useAuth() {
    const [user, setUser] = React.useState<User | null>(getInitialUser);
    const router = useRouter();

    React.useEffect(() => {
        const handleStorageChange = (event: StorageEvent) => {
            if (event.key === LOGGED_IN_USER_KEY) {
                setUser(getInitialUser());
            }
        };

        window.addEventListener('storage', handleStorageChange);
        return () => {
            window.removeEventListener('storage', handleStorageChange);
        };
    }, []);

    const login = (userData: User) => {
        try {
            const userToSave = { ...userData };
            delete userToSave.password; // Never store the password
            window.sessionStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(userToSave));
            setUser(userToSave);
            // Dispatch a custom event to notify other tabs/windows
            window.dispatchEvent(new StorageEvent('storage', { key: LOGGED_IN_USER_KEY }));
        } catch (error) {
            console.error('Error saving logged in user to sessionStorage:', error);
        }
    };

    const logout = () => {
        window.sessionStorage.removeItem(LOGGED_IN_USER_KEY);
        setUser(null);
        // Dispatch a custom event to notify other tabs/windows
        window.dispatchEvent(new StorageEvent('storage', { key: LOGGED_IN_USER_KEY }));
        router.push('/');
    };

    return { user, login, logout };
}

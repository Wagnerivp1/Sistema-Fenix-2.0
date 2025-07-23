

'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo } from '@/types';

// Central API endpoint for all data operations
const API_BASE_URL = '/api/data';

// --- Helper Functions for API communication ---

async function fetchData<T>(dataType: string): Promise<T> {
  if (typeof window === 'undefined') {
    // This is a sensible default for server-side rendering or build steps.
    const fallback = (dataType === 'companyInfo' ? {} : []) as T;
    return fallback;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/${dataType}`, { cache: 'no-store' });
    if (!response.ok) {
      console.error(`Error fetching ${dataType}:`, response.statusText);
      // Return a default value based on expected type
      return (dataType === 'companyInfo' ? {} : []) as T;
    }
    return await response.json();
  } catch (error) {
    console.error(`Error fetching ${dataType}:`, error);
    return (dataType === 'companyInfo' ? {} : []) as T;
  }
}


async function saveData<T>(dataType: string, data: T): Promise<void> {
    if (typeof window === 'undefined') {
        return;
    }
    try {
        await fetch(`${API_BASE_URL}/${dataType}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
        });
    } catch (error) {
        console.error(`Error saving ${dataType}:`, error);
    }
}


// This key is for sessionStorage
const LOGGED_IN_USER_KEY = 'assistec_logged_in_user';

// --- Data Functions ---

export const getCustomers = async (): Promise<Customer[]> => fetchData<Customer[]>('customers');
export const saveCustomers = async (customers: Customer[]): Promise<void> => saveData('customers', customers);

export const getServiceOrders = async (): Promise<ServiceOrder[]> => fetchData<ServiceOrder[]>('serviceOrders');
export const saveServiceOrders = async (orders: ServiceOrder[]): Promise<void> => saveData('serviceOrders', orders);

export const getStock = async (): Promise<StockItem[]> => fetchData<StockItem[]>('stock');
export const saveStock = async (stock: StockItem[]): Promise<void> => saveData('stock', stock);

export const getSales = async (): Promise<Sale[]> => fetchData<Sale[]>('sales');
export const saveSales = async (sales: Sale[]): Promise<void> => saveData('sales', sales);

export const getFinancialTransactions = async (): Promise<FinancialTransaction[]> => fetchData<FinancialTransaction[]>('financialTransactions');
export const saveFinancialTransactions = async (transactions: FinancialTransaction[]): Promise<void> => saveData('financialTransactions', transactions);

export const getUsers = async (): Promise<User[]> => fetchData<User[]>('users');
export const saveUsers = async (users: User[]): Promise<void> => saveData('users', users);

export const getCompanyInfo = async (): Promise<CompanyInfo> => fetchData<CompanyInfo>('companyInfo');
export const saveCompanyInfo = async (info: CompanyInfo): Promise<void> => {
    await saveData('companyInfo', info);
    // Dispatch a custom event to notify components (like Logo) of the change
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('companyInfoChanged'));
    }
};


// --- SessionStorage Specific Functions ---

// Logged In User functions (remains in sessionStorage)
export const saveLoggedInUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  try {
    const userToSave = { ...user };
    // Do not store password in sessionStorage
    delete userToSave.password;
    window.sessionStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(userToSave));
  } catch (error) {
    console.error('Error saving logged in user:', error);
  }
}

export const getLoggedInUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.sessionStorage.getItem(LOGGED_IN_USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting logged in user:', error);
    return null;
  }
}

// Settings functions (remains in localStorage for per-user preference)
const SETTINGS_KEY = 'app_settings';
export const getSettings = (): { defaultWarrantyDays: number } => {
    if (typeof window === 'undefined') {
        return { defaultWarrantyDays: 90 };
    }
    try {
        const item = window.localStorage.getItem(SETTINGS_KEY);
        // Ensure you return a default object if nothing is found
        return item ? JSON.parse(item) : { defaultWarrantyDays: 90 };
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return { defaultWarrantyDays: 90 };
    }
};


export const saveSettings = (settings: { defaultWarrantyDays: number }) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
};

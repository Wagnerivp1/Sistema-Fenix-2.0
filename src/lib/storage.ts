

'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote } from '@/types';

// Helper function to determine the base URL for the API
const getBaseUrl = () => {
  // If an ngrok URL is provided in environment variables, use it.
  // This is useful for when the frontend is hosted on Firebase but needs to talk to a local backend.
  if (process.env.NEXT_PUBLIC_NGROK_URL) {
    return process.env.NEXT_PUBLIC_NGROK_URL;
  }
  
  // In a browser environment, use the current window's origin.
  if (typeof window !== 'undefined') {
    return window.location.origin;
  }
  
  // On the server-side (e.g., during build), default to localhost.
  return `http://localhost:${process.env.PORT || 3000}`;
};

// Generic function to fetch data from the API
async function fetchData<T>(dataType: string, defaultValue: T[] | T | null = []): Promise<any> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/data/${dataType}`, { cache: 'no-store' });
    if (!res.ok) {
      console.error(`Failed to fetch ${dataType}: ${res.statusText}`);
      if (!Array.isArray(defaultValue)) return defaultValue;
      return [];
    }
    return await res.json();
  } catch (error) {
    console.error(`Error fetching ${dataType}:`, error);
    return defaultValue;
  }
}

// Generic function to save data via the API
async function saveData<T>(dataType: string, data: T[] | T): Promise<void> {
  try {
    const res = await fetch(`${getBaseUrl()}/api/data/${dataType}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      throw new Error(`Failed to save ${dataType}`);
    }
  } catch (error) {
    console.error(`Error saving ${dataType}:`, error);
    throw error;
  }
}


// --- Data Functions ---

export const getCustomers = (): Promise<Customer[]> => fetchData<Customer>('customers', []);
export const saveCustomers = (customers: Customer[]): Promise<void> => saveData('customers', customers);

export const getServiceOrders = (): Promise<ServiceOrder[]> => fetchData<ServiceOrder>('serviceOrders', []);
export const saveServiceOrders = (orders: ServiceOrder[]): Promise<void> => saveData('serviceOrders', orders);

export const getStock = (): Promise<StockItem[]> => fetchData<StockItem>('stock', []);
export const saveStock = (stock: StockItem[]): Promise<void> => saveData('stock', stock);

export const getSales = (): Promise<Sale[]> => fetchData<Sale>('sales', []);
export const saveSales = (sales: Sale[]): Promise<void> => saveData('sales', sales);

export const getFinancialTransactions = (): Promise<FinancialTransaction[]> => fetchData<FinancialTransaction>('financialTransactions', []);
export const saveFinancialTransactions = (transactions: FinancialTransaction[]): Promise<void> => saveData('financialTransactions', transactions);

export const getUsers = (): Promise<User[]> => fetchData<User>('users', []);
export const saveUsers = (users: User[]): Promise<void> => saveData('users', users);

export const getAppointments = (): Promise<Appointment[]> => fetchData<Appointment>('appointments', []);
export const saveAppointments = (appointments: Appointment[]): Promise<void> => saveData('appointments', appointments);

export const getQuotes = (): Promise<Quote[]> => fetchData<Quote>('quotes', []);
export const saveQuotes = (quotes: Quote[]): Promise<void> => saveData('quotes', quotes);


// --- Singleton Data (Stored as an object, not array) ---

export const getCompanyInfo = async (): Promise<CompanyInfo> => {
    return fetchData<CompanyInfo>('companyInfo', {});
};

export const saveCompanyInfo = async (info: CompanyInfo): Promise<void> => {
    await saveData('companyInfo', info);
     if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('companyInfoChanged'));
    }
};

export const getSettings = async (): Promise<{ defaultWarrantyDays: number }> => {
    return fetchData<{ defaultWarrantyDays: number }>('settings', { defaultWarrantyDays: 90 });
};

export const saveSettings = async (settings: { defaultWarrantyDays: number }): Promise<void> => {
    await saveData('settings', settings);
};

// --- SessionStorage Specific Functions (Client-side only) ---

const LOGGED_IN_USER_KEY = 'fenix_logged_in_user';

export const saveLoggedInUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  try {
    const userToSave = { ...user };
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

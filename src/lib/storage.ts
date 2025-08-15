
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit } from '@/types';
import stockData from '@/data/stock.json';
import defaultUsersData from '@/data/users.json';

// --- Helper Functions ---

// Helper to safely get data from localStorage, initializing with a default value if not present.
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item === null) {
      // If no item exists, set the default value in storage and return it.
      window.localStorage.setItem(key, JSON.stringify(defaultValue));
      return defaultValue;
    }
    return JSON.parse(item);
  } catch (error) {
    console.error(`Error reading or parsing ${key} from localStorage. Initializing with default.`, error);
    // Attempt to recover by setting the default value.
    try {
      window.localStorage.setItem(key, JSON.stringify(defaultValue));
    } catch (e) {
      console.error(`Failed to set default value for ${key} during recovery.`, e);
    }
    return defaultValue;
  }
}

// Helper to safely save data to localStorage and notify other components
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serializedData = JSON.stringify(data);
    window.localStorage.setItem(key, serializedData);
    // Dispatch a custom event to notify other tabs/components of the change
    window.dispatchEvent(new Event(`storage-change-${key}`));
    // Also dispatch the generic storage event for wider compatibility (e.g., useAuth hook)
    window.dispatchEvent(new Event('storage'));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
}

// --- Auth Functions ---

export function getSessionToken(): string | null {
  if (typeof window === 'undefined') return null;
  return window.localStorage.getItem('session_token');
}

export function saveSessionToken(token: string, user: User): void {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem('session_token', token);
  // Store the user login to identify who is logged in.
  window.localStorage.setItem('loggedInUser', user.login);
  // Also save the full user object (without password) for quick access by hooks.
  const userToStore = { ...user };
  delete userToStore.password;
  window.localStorage.setItem('loggedInUserObject', JSON.stringify(userToStore));
  window.dispatchEvent(new Event('storage')); // Notify components of login change
}


export function removeSessionToken(): void {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem('session_token');
  window.localStorage.removeItem('loggedInUser');
  window.localStorage.removeItem('loggedInUserObject');
  window.dispatchEvent(new Event('storage')); // Notify components of logout change
}

// Users
export async function getUsers(): Promise<User[]> {
  // Type assertion because the imported JSON will conform to User[]
  return getFromStorage<User[]>('users', defaultUsersData as User[]);
}

export async function saveUsers(users: User[]): Promise<void> {
  saveToStorage('users', users);
}

// --- Data Functions ---

// Customers
export async function getCustomers(): Promise<Customer[]> {
  return getFromStorage<Customer[]>('customers', []);
}
export async function saveCustomers(customers: Customer[]): Promise<void> {
  saveToStorage('customers', customers);
}

// Service Orders
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  return getFromStorage<ServiceOrder[]>('serviceOrders', []);
}
export async function saveServiceOrders(orders: ServiceOrder[]): Promise<void> {
  saveToStorage('serviceOrders', orders);
}

// Stock Items
export async function getStock(): Promise<StockItem[]> {
  // Type assertion because the imported JSON will conform to StockItem[]
  return getFromStorage<StockItem[]>('stock', stockData as StockItem[]);
}
export async function saveStock(stock: StockItem[]): Promise<void> {
  saveToStorage('stock', stock);
}

// Sales
export async function getSales(): Promise<Sale[]> {
  return getFromStorage<Sale[]>('sales', []);
}
export async function saveSales(sales: Sale[]): Promise<void> {
  saveToStorage('sales', sales);
}

// Financial Transactions
export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  return getFromStorage<FinancialTransaction[]>('financialTransactions', []);
}
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<void> {
  saveToStorage('financialTransactions', transactions);
}

// Appointments
export async function getAppointments(): Promise<Appointment[]> {
  return getFromStorage<Appointment[]>('appointments', []);
}
export async function saveAppointments(appointments: Appointment[]): Promise<void> {
  saveToStorage('appointments', appointments);
}

// Quotes
export async function getQuotes(): Promise<Quote[]> {
  return getFromStorage<Quote[]>('quotes', []);
}
export async function saveQuotes(quotes: Quote[]): Promise<void> {
  saveToStorage('quotes', quotes);
}

// Kits
export async function getKits(): Promise<Kit[]> {
  return getFromStorage<Kit[]>('kits', []);
}
export async function saveKits(kits: Kit[]): Promise<void> {
  saveToStorage('kits', kits);
}

// --- Singleton Data ---

// Company Info
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const defaultValue: CompanyInfo = { name: 'Assistec Now', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '', notificationSoundUrl: '' };
  return getFromStorage<CompanyInfo>('companyInfo', defaultValue);
}
export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
  saveToStorage('companyInfo', info);
  window.dispatchEvent(new Event('companyInfoChanged'));
}

// General Settings
export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
  const defaultValue = { defaultWarrantyDays: 90 };
  return getFromStorage<{ defaultWarrantyDays: number }>('settings', defaultValue);
}
export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
  saveToStorage('settings', settings);
}

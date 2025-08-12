
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit } from '@/types';

// Helper to get a key for localStorage
const getKey = (dataType: string) => `fenix_storage_${dataType}`;

// Generic function to read data from localStorage
async function readData<T>(dataType: string, defaultValue: T): Promise<T> {
  // localStorage is only available on the client
  if (typeof window === 'undefined') {
    return defaultValue;
  }

  try {
    const item = window.localStorage.getItem(getKey(dataType));
    // If data exists, parse it. Otherwise, return the default value.
    if (item) {
      return JSON.parse(item);
    } else {
      // If it's the first time, seed localStorage with the default value
      await writeData(dataType, defaultValue);
      return defaultValue;
    }
  } catch (error) {
    console.error(`Error reading ${dataType} from localStorage:`, error);
    // In case of any error (e.g., parsing error), return the default
    return defaultValue;
  }
}

// Generic function to write data to localStorage
async function writeData<T>(dataType: string, data: T): Promise<void> {
  // localStorage is only available on the client
  if (typeof window === 'undefined') {
    return;
  }

  try {
    const serializedData = JSON.stringify(data);
    window.localStorage.setItem(getKey(dataType), serializedData);
    // Dispatch a custom event to notify other tabs/components of the data change
    window.dispatchEvent(new Event(`storage-change-${dataType}`));
    if (dataType === 'companyInfo') {
        window.dispatchEvent(new Event('companyInfoChanged'));
    }
  } catch (error) {
    console.error(`Error writing to ${dataType} in localStorage:`, error);
    throw error;
  }
}

// --- Data Functions ---

export async function getCustomers(): Promise<Customer[]> { return readData<Customer[]>('customers', []); }
export async function saveCustomers(customers: Customer[]): Promise<void> { return writeData('customers', customers); }

export async function getServiceOrders(): Promise<ServiceOrder[]> { return readData<ServiceOrder[]>('serviceOrders', []); }
export async function saveServiceOrders(orders: ServiceOrder[]): Promise<void> { return writeData('serviceOrders', orders); }

export async function getStock(): Promise<StockItem[]> { return readData<StockItem[]>('stock', []); }
export async function saveStock(stock: StockItem[]): Promise<void> { return writeData('stock', stock); }

export async function getSales(): Promise<Sale[]> { return readData<Sale[]>('sales', []); }
export async function saveSales(sales: Sale[]): Promise<void> { return writeData('sales', sales); }

export async function getFinancialTransactions(): Promise<FinancialTransaction[]> { return readData<FinancialTransaction[]>('financialTransactions', []); }
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<void> { return writeData('financialTransactions', transactions); }

export async function getUsers(): Promise<User[]> { return readData<User[]>('users', []); }
export async function saveUsers(users: User[]): Promise<void> { return writeData('users', users); }

export async function getAppointments(): Promise<Appointment[]> { return readData<Appointment[]>('appointments', []); }
export async function saveAppointments(appointments: Appointment[]): Promise<void> { return writeData('appointments', appointments); }

export async function getQuotes(): Promise<Quote[]> { return readData<Quote[]>('quotes', []); }
export async function saveQuotes(quotes: Quote[]): Promise<void> { return writeData('quotes', quotes); }

export async function getKits(): Promise<Kit[]> { return readData<Kit[]>('kits', []); }
export async function saveKits(kits: Kit[]): Promise<void> { return writeData('kits', kits); }


// --- Singleton Data (Stored as an object, not array) ---

export async function getCompanyInfo(): Promise<CompanyInfo> {
    return readData<CompanyInfo>('companyInfo', { name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '' });
};

export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
    await writeData('companyInfo', info);
};

export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
    return readData<{ defaultWarrantyDays: number }>('settings', { defaultWarrantyDays: 90 });
};

export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
    await writeData('settings', settings);
};

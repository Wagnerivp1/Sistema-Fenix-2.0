
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit } from '@/types';
import stockData from '@/data/stock.json';

// --- Default Data ---
// Directly use the imported JSON array.
const defaultStock: StockItem[] = stockData;


// Helper to safely get data from localStorage
function getFromStorage<T>(key: string, defaultValue: T): T {
  if (typeof window === 'undefined') {
    return defaultValue;
  }
  try {
    const item = window.localStorage.getItem(key);
    // If the item exists in storage and is not an empty array string, use it.
    if (item) {
        const parsed = JSON.parse(item);
        if (Array.isArray(parsed) && parsed.length > 0) {
            return parsed;
        }
        if (!Array.isArray(parsed)) {
             return parsed;
        }
    }
    // Otherwise, initialize localStorage with the default value and return it.
    window.localStorage.setItem(key, JSON.stringify(defaultValue));
    return defaultValue;
  } catch (error) {
    console.error(`Error reading ${key} from localStorage`, error);
    return defaultValue;
  }
}

// Helper to safely save data to localStorage
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serializedData = JSON.stringify(data);
    window.localStorage.setItem(key, serializedData);
    // Dispatch a custom event to notify other tabs/components of the change
    window.dispatchEvent(new Event(`storage-change-${key}`));
  } catch (error) {
    console.error(`Error saving ${key} to localStorage`, error);
  }
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
    // On first load, it will use defaultStock if 'stock' is not in localStorage or is empty
    return getFromStorage<StockItem[]>('stock', defaultStock);
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

// Users
export async function getUsers(): Promise<User[]> {
  const defaultUser: User = {
    id: 'master',
    name: 'Master User',
    login: 'admin',
    password: 'admin',
    permissions: {
      accessDashboard: true,
      accessClients: true,
      accessServiceOrders: true,
      accessInventory: true,
      accessSales: true,
      accessFinancials: true,
      accessSettings: true,
      accessDangerZone: true,
      accessAgenda: true,
      accessQuotes: true,
      canEdit: true,
      canDelete: true,
      canViewPasswords: true,
      canManageUsers: true,
    },
  };
  return getFromStorage<User[]>('users', [defaultUser]);
}
export async function saveUsers(users: User[]): Promise<void> {
  saveToStorage('users', users);
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
    const defaultValue: CompanyInfo = { name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '' };
    return getFromStorage<CompanyInfo>('companyInfo', defaultValue);
};
export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
    saveToStorage('companyInfo', info);
    window.dispatchEvent(new Event('companyInfoChanged'));
};

// General Settings
export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
    const defaultValue = { defaultWarrantyDays: 90 };
    return getFromStorage<{ defaultWarrantyDays: number }>('settings', defaultValue);
};
export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
    saveToStorage('settings', settings);
};

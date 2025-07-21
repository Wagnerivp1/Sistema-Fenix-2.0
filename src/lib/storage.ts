
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo } from '@/types';

// Central API endpoint for all data operations
const API_BASE_URL = '/api/data';

// --- Helper Functions for API communication ---

async function fetchData<T>(dataType: string): Promise<T> {
  if (typeof window === 'undefined') {
    // This is a sensible default for server-side rendering or build steps.
    // The specific fallback should be handled by the caller.
    return (dataType === 'companyInfo' ? {} : []) as T;
  }
  try {
    const response = await fetch(`${API_BASE_URL}/${dataType}`);
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


const CUSTOMERS_KEY = 'assistec_customers';
const SERVICE_ORDERS_KEY = 'assistec_service_orders';
const STOCK_KEY = 'assistec_stock';
const SALES_KEY = 'assistec_sales';
const FINANCIAL_TRANSACTIONS_KEY = 'assistec_financial_transactions';
const SETTINGS_KEY = 'app_settings';
const USERS_KEY = 'assistec_users';
const LOGGED_IN_USER_KEY = 'assistec_logged_in_user';
const COMPANY_INFO_KEY = 'assistec_company_info';


export const APP_STORAGE_KEYS = [
  CUSTOMERS_KEY,
  SERVICE_ORDERS_KEY,
  STOCK_KEY,
  SALES_KEY,
  FINANCIAL_TRANSACTIONS_KEY,
  SETTINGS_KEY,
  USERS_KEY,
  LOGGED_IN_USER_KEY,
  COMPANY_INFO_KEY,
];


// Generic getter
function getFromStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback;
  }
  try {
    const item = window.localStorage.getItem(key);
    return item ? JSON.parse(item) : fallback;

  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return fallback;
  }
}

// Generic setter
function saveToStorage<T>(key: string, data: T): void {
  if (typeof window === 'undefined') {
    return;
  }
  try {
    const serializedData = JSON.stringify(data);
    window.localStorage.setItem(key, serializedData);
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
}

// --- DATA HOOKS ---
// These functions will now be async and fetch from the API

export const getCustomers = async (): Promise<Customer[]> => {
    return fetchData<Customer[]>('customers');
}
export const saveCustomers = async (customers: Customer[]): Promise<void> => {
    return saveData('customers', customers);
}

export const getServiceOrders = async (): Promise<ServiceOrder[]> => {
    return fetchData<ServiceOrder[]>('serviceOrders');
}

export const saveServiceOrders = async (orders: ServiceOrder[]): Promise<void> => {
    return saveData('serviceOrders', orders);
}


// TODO: Convert remaining functions to use the API
// Stock functions
export const getStock = (): StockItem[] => getFromStorage(STOCK_KEY, []);
export const saveStock = (stock: StockItem[]): void => saveToStorage(STOCK_KEY, stock);

// Sales functions
export const getSales = (): Sale[] => getFromStorage(SALES_KEY, []);
export const saveSales = (sales: Sale[]): void => saveToStorage(SALES_KEY, sales);

// Financial Transactions functions
export const getFinancialTransactions = (): FinancialTransaction[] => getFromStorage(FINANCIAL_TRANSACTIONS_KEY, []);
export const saveFinancialTransactions = (transactions: FinancialTransaction[]): void => saveToStorage(FINANCIAL_TRANSACTIONS_KEY, transactions);

// User functions
export const MASTER_USER_ID = 'master-0';
const masterUser: User = { id: MASTER_USER_ID, name: 'Master User', username: 'master', password: 'master', role: 'admin', active: true, phone: '' };
const defaultAdmin: User = { id: 'admin-0', name: 'Administrador Padrão', username: 'admin', password: 'admin', role: 'admin', active: true, phone: '' };

export const getUsers = (): User[] => {
    const users = getFromStorage<User[]>(USERS_KEY, []);
    
    // Ensure default admin exists if no users are present
    if (users.length === 0) {
        saveToStorage(USERS_KEY, [defaultAdmin]);
        return [defaultAdmin, masterUser];
    }
    
    // Always return the master user for login purposes, but it's not saved.
    return [...users, masterUser];
};

export const saveUsers = (users: User[]): void => {
  // Ensure the master user is never saved to localStorage
  const usersToSave = users.filter(u => u.id !== MASTER_USER_ID);
  saveToStorage(USERS_KEY, usersToSave);
};

// Logged In User functions
export const saveLoggedInUser = (user: User): void => {
  if (typeof window === 'undefined') return;
  try {
    const userToSave = { ...user };
    // Do not store password in localStorage
    delete userToSave.password;
    window.localStorage.setItem(LOGGED_IN_USER_KEY, JSON.stringify(userToSave));
  } catch (error) {
    console.error('Error saving logged in user:', error);
  }
}

export const getLoggedInUser = (): User | null => {
  if (typeof window === 'undefined') return null;
  try {
    const item = window.localStorage.getItem(LOGGED_IN_USER_KEY);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error('Error getting logged in user:', error);
    return null;
  }
}

// Company Info functions
const defaultCompanyInfo: CompanyInfo = {
  name: 'JL Informática',
  address: 'Rua da Tecnologia, 123 - Centro, São Paulo/SP',
  phone: '(11) 99999-8888',
  emailOrSite: 'contato@jlinformatica.com',
  document: '12.345.678/0001-90',
  logoUrl: '',
};

export const getCompanyInfo = (): CompanyInfo => {
    return getFromStorage<CompanyInfo>(COMPANY_INFO_KEY, defaultCompanyInfo);
}

export const saveCompanyInfo = (info: CompanyInfo): void => {
    if (typeof window === 'undefined') return;
    try {
        window.localStorage.setItem(COMPANY_INFO_KEY, JSON.stringify(info));
    } catch (error) {
        console.error('Error saving company info:', error);
    }
}

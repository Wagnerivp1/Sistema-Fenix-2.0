
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User } from '@/types';

const CUSTOMERS_KEY = 'assistec_customers';
const SERVICE_ORDERS_KEY = 'assistec_service_orders';
const STOCK_KEY = 'assistec_stock';
const SALES_KEY = 'assistec_sales';
const FINANCIAL_TRANSACTIONS_KEY = 'assistec_financial_transactions';
const SETTINGS_KEY = 'app_settings';
const USERS_KEY = 'assistec_users';

export const APP_STORAGE_KEYS = [
  CUSTOMERS_KEY,
  SERVICE_ORDERS_KEY,
  STOCK_KEY,
  SALES_KEY,
  FINANCIAL_TRANSACTIONS_KEY,
  SETTINGS_KEY,
  USERS_KEY,
];


// Generic getter
function getFromStorage<T>(key: string, fallback: T[] = []): T[] {
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
function saveToStorage<T>(key: string, data: T[]): void {
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

// Customer functions
export const getCustomers = (): Customer[] => getFromStorage(CUSTOMERS_KEY);
export const saveCustomers = (customers: Customer[]): void => saveToStorage(CUSTOMERS_KEY, customers);

// Service Order functions
export const getServiceOrders = (): ServiceOrder[] => getFromStorage(SERVICE_ORDERS_KEY);
export const saveServiceOrders = (orders: ServiceOrder[]): void => saveToStorage(SERVICE_ORDERS_KEY, orders);

// Stock functions
export const getStock = (): StockItem[] => getFromStorage(STOCK_KEY);
export const saveStock = (stock: StockItem[]): void => saveToStorage(STOCK_KEY, stock);

// Sales functions
export const getSales = (): Sale[] => getFromStorage(SALES_KEY);
export const saveSales = (sales: Sale[]): void => saveToStorage(SALES_KEY, sales);

// Financial Transactions functions
export const getFinancialTransactions = (): FinancialTransaction[] => getFromStorage(FINANCIAL_TRANSACTIONS_KEY);
export const saveFinancialTransactions = (transactions: FinancialTransaction[]): void => saveToStorage(FINANCIAL_TRANSACTIONS_KEY, transactions);

// User functions
export const MASTER_USER_ID = 'master-0';
const masterUser: User = { id: MASTER_USER_ID, name: 'Master User', username: 'master', password: 'master', role: 'admin', active: true, phone: '' };
const defaultAdmin: User = { id: 'admin-0', name: 'Administrador Padrão', username: 'admin', password: 'admin', role: 'admin', active: true, phone: '' };

export const getUsers = (): User[] => {
    const users = getFromStorage<User>(USERS_KEY);
    
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

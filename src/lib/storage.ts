
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction } from '@/types';
import { mockCustomers, mockServiceOrders, mockStock, mockSales, mockFinancialTransactions } from './data';

const CUSTOMERS_KEY = 'assistec_customers';
const SERVICE_ORDERS_KEY = 'assistec_service_orders';
const STOCK_KEY = 'assistec_stock';
const SALES_KEY = 'assistec_sales';
const FINANCIAL_TRANSACTIONS_KEY = 'assistec_financial_transactions';
const SETTINGS_KEY = 'app_settings';

export const APP_STORAGE_KEYS = [
  CUSTOMERS_KEY,
  SERVICE_ORDERS_KEY,
  STOCK_KEY,
  SALES_KEY,
  FINANCIAL_TRANSACTIONS_KEY,
  SETTINGS_KEY,
];


// Generic getter
function getFromStorage<T>(key: string, mockData: T[]): T[] {
  if (typeof window === 'undefined') {
    return []; // Return empty array on server
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    } else {
      // On first load for a key, populate with mock data.
      // Subsequent loads after clearing will find `null` and return `[]` from the next check.
      const isAppInitialized = window.localStorage.getItem('assistec_app_initialized');
      if (!isAppInitialized) {
        saveToStorage(key, mockData);
        return mockData;
      }
      return [];
    }
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return [];
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
    // Mark that the app has been initialized at least once
    if (!window.localStorage.getItem('assistec_app_initialized')) {
        window.localStorage.setItem('assistec_app_initialized', 'true');
    }
  } catch (error) {
    console.error(`Error writing to localStorage key “${key}”:`, error);
  }
}

// Customer functions
export const getCustomers = (): Customer[] => getFromStorage(CUSTOMERS_KEY, mockCustomers);
export const saveCustomers = (customers: Customer[]): void => saveToStorage(CUSTOMERS_KEY, customers);

// Service Order functions
export const getServiceOrders = (): ServiceOrder[] => getFromStorage(SERVICE_ORDERS_KEY, mockServiceOrders);
export const saveServiceOrders = (orders: ServiceOrder[]): void => saveToStorage(SERVICE_ORDERS_KEY, orders);

// Stock functions
export const getStock = (): StockItem[] => getFromStorage(STOCK_KEY, mockStock);
export const saveStock = (stock: StockItem[]): void => saveToStorage(STOCK_KEY, stock);

// Sales functions
export const getSales = (): Sale[] => getFromStorage(SALES_KEY, mockSales);
export const saveSales = (sales: Sale[]): void => saveToStorage(SALES_KEY, sales);

// Financial Transactions functions
export const getFinancialTransactions = (): FinancialTransaction[] => getFromStorage(FINANCIAL_TRANSACTIONS_KEY, mockFinancialTransactions);
export const saveFinancialTransactions = (transactions: FinancialTransaction[]): void => saveToStorage(FINANCIAL_TRANSACTIONS_KEY, transactions);

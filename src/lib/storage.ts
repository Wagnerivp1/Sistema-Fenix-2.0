
'use client';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction } from '@/types';
import { mockCustomers, mockServiceOrders, mockStock, mockSales, mockFinancialTransactions } from './data';

const CUSTOMERS_KEY = 'assistec_customers';
const SERVICE_ORDERS_KEY = 'assistec_service_orders';
const STOCK_KEY = 'assistec_stock';
const SALES_KEY = 'assistec_sales';
const FINANCIAL_TRANSACTIONS_KEY = 'assistec_financial_transactions';


// Generic getter
function getFromStorage<T>(key: string, mockData: T[]): T[] {
  if (typeof window === 'undefined') {
    return mockData;
  }
  try {
    const item = window.localStorage.getItem(key);
    if (item) {
      return JSON.parse(item);
    } else {
      // If no data, initialize with mock data
      window.localStorage.setItem(key, JSON.stringify(mockData));
      return mockData;
    }
  } catch (error) {
    console.error(`Error reading from localStorage key “${key}”:`, error);
    return mockData;
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

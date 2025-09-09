
'use server';

import {promises as fs} from 'fs';
import path from 'path';
import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit } from '@/types';
import stockData from '@/data/stock.json';
import defaultUsersData from '@/data/users.json';

// --- File Paths ---
const dataDir = path.join(process.cwd(), 'src', 'data');
const getFilePath = (filename: string) => path.join(dataDir, filename);

const USERS_FILE = getFilePath('users.json');
const CUSTOMERS_FILE = getFilePath('customers.json');
const SERVICE_ORDERS_FILE = getFilePath('serviceOrders.json');
const STOCK_FILE = getFilePath('stock.json');
const SALES_FILE = getFilePath('sales.json');
const FINANCIAL_TRANSACTIONS_FILE = getFilePath('financialTransactions.json');
const APPOINTMENTS_FILE = getFilePath('appointments.json');
const QUOTES_FILE = getFilePath('quotes.json');
const KITS_FILE = getFilePath('kits.json');
const COMPANY_INFO_FILE = getFilePath('companyInfo.json');
const SETTINGS_FILE = getFilePath('settings.json');
const SESSION_FILE = getFilePath('session.json');


// --- Helper Functions ---

async function readData<T>(filePath: string, defaultValue: T): Promise<T> {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    if (error.code === 'ENOENT') {
      // File doesn't exist, so write the default value and return it.
      await writeData(filePath, defaultValue);
      return defaultValue;
    }
    console.error(`Error reading file ${filePath}:`, error);
    // In case of other errors (like parsing), return default to prevent crash
    return defaultValue;
  }
}

async function writeData<T>(filePath: string, data: T): Promise<void> {
  try {
    const jsonString = JSON.stringify(data, null, 2);
    await fs.writeFile(filePath, jsonString, 'utf-8');
  } catch (error) {
    console.error(`Error writing to file ${filePath}:`, error);
  }
}


// --- Auth Functions ---

// Note: Session management will be simplified for a file-based system.
// In a real multi-user scenario, a more robust session mechanism would be needed.

export async function getSessionToken(): Promise<string | null> {
    try {
        const session = await readData<{ token: string | null }>(SESSION_FILE, { token: null });
        return session.token;
    } catch {
        return null;
    }
}

export async function getLoggedInUser(): Promise<User | null> {
    const users = await getUsers();
    const session = await readData<{ loggedInUserLogin: string | null }>(SESSION_FILE, { loggedInUserLogin: null });
    if (!session.loggedInUserLogin) return null;
    
    const user = users.find(u => u.login === session.loggedInUserLogin);
    if (user) {
      const userToReturn = { ...user };
      delete userToReturn.password; // Never return password
      return userToReturn;
    }
    return null;
}

export async function saveSessionToken(token: string, user: User): Promise<void> {
    await writeData(SESSION_FILE, { token, loggedInUserLogin: user.login });
}

export async function removeSessionToken(): Promise<void> {
    await writeData(SESSION_FILE, { token: null, loggedInUserLogin: null });
}


// Users
export async function getUsers(): Promise<User[]> {
  return await readData<User[]>(USERS_FILE, defaultUsersData as User[]);
}

export async function saveUsers(users: User[]): Promise<void> {
  await writeData(USERS_FILE, users);
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
  return await readData<Customer[]>(CUSTOMERS_FILE, []);
}
export async function saveCustomers(customers: Customer[]): Promise<void> {
  await writeData(CUSTOMERS_FILE, customers);
}

// Service Orders
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  return await readData<ServiceOrder[]>(SERVICE_ORDERS_FILE, []);
}
export async function saveServiceOrders(orders: ServiceOrder[]): Promise<void> {
  await writeData(SERVICE_ORDERS_FILE, orders);
}

// Stock Items
export async function getStock(): Promise<StockItem[]> {
  return await readData<StockItem[]>(STOCK_FILE, stockData as StockItem[]);
}
export async function saveStock(stock: StockItem[]): Promise<void> {
  await writeData(STOCK_FILE, stock);
}

// Sales
export async function getSales(): Promise<Sale[]> {
  return await readData<Sale[]>(SALES_FILE, []);
}
export async function saveSales(sales: Sale[]): Promise<void> {
  await writeData(SALES_FILE, sales);
}

// Financial Transactions
export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  return await readData<FinancialTransaction[]>(FINANCIAL_TRANSACTIONS_FILE, []);
}
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<void> {
  await writeData(FINANCIAL_TRANSACTIONS_FILE, transactions);
}

// Appointments
export async function getAppointments(): Promise<Appointment[]> {
  return await readData<Appointment[]>(APPOINTMENTS_FILE, []);
}
export async function saveAppointments(appointments: Appointment[]): Promise<void> {
  await writeData(APPOINTMENTS_FILE, appointments);
}

// Quotes
export async function getQuotes(): Promise<Quote[]> {
  return await readData<Quote[]>(QUOTES_FILE, []);
}
export async function saveQuotes(quotes: Quote[]): Promise<void> {
  await writeData(QUOTES_FILE, quotes);
}

// Kits
export async function getKits(): Promise<Kit[]> {
  return await readData<Kit[]>(KITS_FILE, []);
}
export async function saveKits(kits: Kit[]): Promise<void> {
  await writeData(KITS_FILE, kits);
}


// --- Singleton Data ---

// Company Info
export async function getCompanyInfo(): Promise<CompanyInfo> {
  const defaultValue: CompanyInfo = { name: 'Assistec Now', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '', notificationSoundUrl: '' };
  return await readData<CompanyInfo>(COMPANY_INFO_FILE, defaultValue);
}
export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
  await writeData(COMPANY_INFO_FILE, info);
}

// General Settings
export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
  const defaultValue = { defaultWarrantyDays: 90 };
  return await readData<{ defaultWarrantyDays: number }>(SETTINGS_FILE, defaultValue);
}
export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
  await writeData(SETTINGS_FILE, settings);
}

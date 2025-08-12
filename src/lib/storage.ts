
'use server';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit } from '@/types';
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to get the full path to a data file
const getDataPath = (fileName: string) => {
  if (!fileName.endsWith('.json')) {
    fileName += '.json';
  }
  // Use process.cwd() which in a Next.js/Vercel/Firebase environment 
  // correctly points to the root of the running application.
  return path.join(process.cwd(), 'data', fileName);
};

// Generic function to read data directly from the filesystem
async function readData<T>(dataType: string, defaultValue: T[] | T): Promise<any> {
  const filePath = getDataPath(dataType);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(fileContent);
  } catch (error: any) {
    // If the file doesn't exist (ENOENT), return a sensible default.
    if (error.code === 'ENOENT') {
      // If file doesn't exist, create it with default value
      await writeData(dataType, defaultValue);
      return defaultValue;
    }
    // For other errors, log them and return the default to prevent crashes.
    console.error(`Error reading ${dataType}.json:`, error);
    return defaultValue;
  }
}

// Generic function to write data directly to the filesystem
async function writeData<T>(dataType: string, data: T[] | T): Promise<void> {
  const filePath = getDataPath(dataType);
  try {
    // Ensure the /data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
  } catch (error) {
    console.error(`Error writing to ${dataType}.json:`, error);
    throw error; // Re-throw the error to be handled by the caller
  }
}


// --- Data Functions ---

export async function getCustomers(): Promise<Customer[]> { return readData<Customer>('customers.json', []); }
export async function saveCustomers(customers: Customer[]): Promise<void> { return writeData('customers.json', customers); }

export async function getServiceOrders(): Promise<ServiceOrder[]> { return readData<ServiceOrder>('serviceOrders.json', []); }
export async function saveServiceOrders(orders: ServiceOrder[]): Promise<void> { return writeData('serviceOrders.json', orders); }

export async function getStock(): Promise<StockItem[]> { return readData<StockItem>('stock.json', []); }
export async function saveStock(stock: StockItem[]): Promise<void> { return writeData('stock.json', stock); }

export async function getSales(): Promise<Sale[]> { return readData<Sale>('sales.json', []); }
export async function saveSales(sales: Sale[]): Promise<void> { return writeData('sales.json', sales); }

export async function getFinancialTransactions(): Promise<FinancialTransaction[]> { return readData<FinancialTransaction>('financialTransactions.json', []); }
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<void> { return writeData('financialTransactions.json', transactions); }

export async function getUsers(): Promise<User[]> { return readData<User>('users.json', []); }
export async function saveUsers(users: User[]): Promise<void> { return writeData('users.json', users); }

export async function getAppointments(): Promise<Appointment[]> { return readData<Appointment>('appointments.json', []); }
export async function saveAppointments(appointments: Appointment[]): Promise<void> { return writeData('appointments.json', appointments); }

export async function getQuotes(): Promise<Quote[]> { return readData<Quote>('quotes.json', []); }
export async function saveQuotes(quotes: Quote[]): Promise<void> { return writeData('quotes.json', quotes); }

export async function getKits(): Promise<Kit[]> { return readData<Kit>('kits.json', []); }
export async function saveKits(kits: Kit[]): Promise<void> { return writeData('kits.json', kits); }


// --- Singleton Data (Stored as an object, not array) ---

export async function getCompanyInfo(): Promise<CompanyInfo> {
    return readData<CompanyInfo>('companyInfo.json', {});
};

export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
    await writeData('companyInfo.json', info);
};

export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
    return readData<{ defaultWarrantyDays: number }>('settings.json', { defaultWarrantyDays: 90 });
};

export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
    await writeData('settings.json', settings);
};


'use client';

import { collection, doc, getDocs, setDoc, writeBatch, deleteDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote } from '@/types';

// --- Helper Functions for Firestore communication ---

async function fetchData<T>(collectionName: string): Promise<T[]> {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName));
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as T));
  } catch (error) {
    console.error(`Error fetching ${collectionName}:`, error);
    return [];
  }
}

async function fetchSingleData<T>(collectionName: string, docId: string, defaultValue: T): Promise<T> {
    try {
        const docRef = doc(db, collectionName, docId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
            return { ...defaultValue, ...docSnap.data() };
        }
        return defaultValue;
    } catch(error) {
        console.error(`Error fetching single doc ${docId} from ${collectionName}:`, error);
        return defaultValue;
    }
}


async function saveData<T extends { id: string }>(collectionName: string, data: T[]): Promise<void> {
  try {
    const batch = writeBatch(db);
    data.forEach(item => {
      const { id, ...rest } = item;
      const docRef = doc(db, collectionName, id);
      batch.set(docRef, rest);
    });
    await batch.commit();
  } catch (error) {
    console.error(`Error saving ${collectionName}:`, error);
  }
}

async function saveSingleData<T>(collectionName: string, docId: string, data: T): Promise<void> {
    try {
        await setDoc(doc(db, collectionName, docId), data);
    } catch(error) {
        console.error(`Error saving single doc ${docId} in ${collectionName}:`, error);
    }
}


// --- Data Functions ---

export const getCustomers = (): Promise<Customer[]> => fetchData<Customer>('customers');
export const saveCustomers = (customers: Customer[]): Promise<void> => saveData('customers', customers);

export const getServiceOrders = (): Promise<ServiceOrder[]> => fetchData<ServiceOrder>('serviceOrders');
export const saveServiceOrders = (orders: ServiceOrder[]): Promise<void> => saveData('serviceOrders', orders);

export const getStock = (): Promise<StockItem[]> => fetchData<StockItem>('stock');
export const saveStock = (stock: StockItem[]): Promise<void> => saveData('stock', stock);

export const getSales = (): Promise<Sale[]> => fetchData<Sale>('sales');
export const saveSales = (sales: Sale[]): Promise<void> => saveData('sales', sales);

export const getFinancialTransactions = (): Promise<FinancialTransaction[]> => fetchData<FinancialTransaction>('financialTransactions');
export const saveFinancialTransactions = (transactions: FinancialTransaction[]): Promise<void> => saveData('financialTransactions', transactions);

export const getUsers = (): Promise<User[]> => fetchData<User>('users');
export const saveUsers = (users: User[]): Promise<void> => saveData('users', users);

export const getAppointments = (): Promise<Appointment[]> => fetchData<Appointment>('appointments');
export const saveAppointments = (appointments: Appointment[]): Promise<void> => saveData('appointments', appointments);

export const getQuotes = (): Promise<Quote[]> => fetchData<Quote>('quotes');
export const saveQuotes = (quotes: Quote[]): Promise<void> => saveData('quotes', quotes);


// --- Singleton Data (Stored in a single document) ---

const COMPANY_INFO_DOC_ID = 'main';
export const getCompanyInfo = (): Promise<CompanyInfo> => fetchSingleData<CompanyInfo>('companyInfo', COMPANY_INFO_DOC_ID, {} as CompanyInfo);
export const saveCompanyInfo = async (info: CompanyInfo): Promise<void> => {
    await saveSingleData('companyInfo', COMPANY_INFO_DOC_ID, info);
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new Event('companyInfoChanged'));
    }
};


// --- SessionStorage Specific Functions (No change needed) ---

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

// --- LocalStorage Specific Functions (No change needed) ---
const SETTINGS_KEY = 'fenix_app_settings';
export const getSettings = (): { defaultWarrantyDays: number } => {
    if (typeof window === 'undefined') {
        return { defaultWarrantyDays: 90 };
    }
    try {
        const item = window.localStorage.getItem(SETTINGS_KEY);
        return item ? JSON.parse(item) : { defaultWarrantyDays: 90 };
    } catch (error) {
        console.error("Failed to parse settings from localStorage", error);
        return { defaultWarrantyDays: 90 };
    }
};

export const saveSettings = (settings: { defaultWarrantyDays: number }) => {
    if (typeof window !== 'undefined') {
        window.localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    }
};


'use client';

import { db } from './firebase';
import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch,
  deleteDoc,
  getDoc,
  DocumentData,
} from 'firebase/firestore';

import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit } from '@/types';

// Helper to convert Firestore snapshot to an array of a specific type
function snapshotToData<T>(snapshot: DocumentData): T[] {
    if (!snapshot.docs) return [];
    return snapshot.docs.map((document: DocumentData) => ({ id: document.id, ...document.data() } as T));
}

// --- Data Functions ---

// Customers
export async function getCustomers(): Promise<Customer[]> {
  const querySnapshot = await getDocs(collection(db, "customers"));
  return snapshotToData<Customer>(querySnapshot);
}
export async function saveCustomers(customers: Customer[]): Promise<void> {
  const batch = writeBatch(db);
  customers.forEach((customer) => {
    const docRef = doc(db, "customers", customer.id);
    batch.set(docRef, customer);
  });
  await batch.commit();
}

// Service Orders
export async function getServiceOrders(): Promise<ServiceOrder[]> {
  const querySnapshot = await getDocs(collection(db, "serviceOrders"));
  return snapshotToData<ServiceOrder>(querySnapshot);
}
export async function saveServiceOrders(orders: ServiceOrder[]): Promise<void> {
  const batch = writeBatch(db);
  orders.forEach((order) => {
    const docRef = doc(db, "serviceOrders", order.id);
    batch.set(docRef, order);
  });
  await batch.commit();
}

// Stock Items
export async function getStock(): Promise<StockItem[]> {
  const querySnapshot = await getDocs(collection(db, "stock"));
  return snapshotToData<StockItem>(querySnapshot);
}
export async function saveStock(stock: StockItem[]): Promise<void> {
  const batch = writeBatch(db);
  stock.forEach((item) => {
    const docRef = doc(db, "stock", item.id);
    batch.set(docRef, item);
  });
  await batch.commit();
}

// Sales
export async function getSales(): Promise<Sale[]> {
  const querySnapshot = await getDocs(collection(db, "sales"));
  return snapshotToData<Sale>(querySnapshot);
}
export async function saveSales(sales: Sale[]): Promise<void> {
  const batch = writeBatch(db);
  sales.forEach((sale) => {
    const docRef = doc(db, "sales", sale.id);
    batch.set(docRef, sale);
  });
  await batch.commit();
}

// Financial Transactions
export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
  const querySnapshot = await getDocs(collection(db, "financialTransactions"));
  return snapshotToData<FinancialTransaction>(querySnapshot);
}
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<void> {
  const batch = writeBatch(db);
  transactions.forEach((transaction) => {
    const docRef = doc(db, "financialTransactions", transaction.id);
    batch.set(docRef, transaction);
  });
  await batch.commit();
}

// Users
export async function getUsers(): Promise<User[]> {
  const querySnapshot = await getDocs(collection(db, "users"));
  return snapshotToData<User>(querySnapshot);
}
export async function saveUsers(users: User[]): Promise<void> {
  const batch = writeBatch(db);
  users.forEach((user) => {
    // Do not save password to Firestore
    const { password, ...userToSave } = user;
    const docRef = doc(db, "users", user.id);
    batch.set(docRef, userToSave);
  });
  await batch.commit();
}

// Appointments
export async function getAppointments(): Promise<Appointment[]> {
    const querySnapshot = await getDocs(collection(db, "appointments"));
    return snapshotToData<Appointment>(querySnapshot);
}
export async function saveAppointments(appointments: Appointment[]): Promise<void> {
    const batch = writeBatch(db);
    appointments.forEach((appointment) => {
        const docRef = doc(db, "appointments", appointment.id);
        batch.set(docRef, appointment);
    });
    await batch.commit();
}

// Quotes
export async function getQuotes(): Promise<Quote[]> {
    const querySnapshot = await getDocs(collection(db, "quotes"));
    return snapshotToData<Quote>(querySnapshot);
}
export async function saveQuotes(quotes: Quote[]): Promise<void> {
    const batch = writeBatch(db);
    quotes.forEach((quote) => {
        const docRef = doc(db, "quotes", quote.id);
        batch.set(docRef, quote);
    });
    await batch.commit();
}

// Kits
export async function getKits(): Promise<Kit[]> {
    const querySnapshot = await getDocs(collection(db, "kits"));
    return snapshotToData<Kit>(querySnapshot);
}
export async function saveKits(kits: Kit[]): Promise<void> {
    const batch = writeBatch(db);
    kits.forEach((kit) => {
        const docRef = doc(db, "kits", kit.id);
        batch.set(docRef, kit);
    });
    await batch.commit();
}


// --- Singleton Data (Stored as a single document) ---

// Company Info
export async function getCompanyInfo(): Promise<CompanyInfo> {
    const docRef = doc(db, "settings", "companyInfo");
    const docSnap = await getDoc(docRef);
    if (docSnap.exists()) {
        return docSnap.data() as CompanyInfo;
    }
    return { name: '', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '' };
};
export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
    const docRef = doc(db, "settings", "companyInfo");
    await setDoc(docRef, info);
    window.dispatchEvent(new Event('companyInfoChanged'));
};

// General Settings
export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
    const docRef = doc(db, "settings", "general");
    const docSnap = await getDoc(docRef);
     if (docSnap.exists()) {
        return docSnap.data() as { defaultWarrantyDays: number };
    }
    return { defaultWarrantyDays: 90 };
};
export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
    const docRef = doc(db, "settings", "general");
    await setDoc(docRef, settings);
};

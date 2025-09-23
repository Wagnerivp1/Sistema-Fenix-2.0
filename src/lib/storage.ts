
'use server';

import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import type { Customer, ServiceOrder, StockItem, Sale, FinancialTransaction, User, CompanyInfo, Appointment, Quote, Kit, ServiceOrderItem, SaleItem, OSPayment, UserPermissions, InternalNote } from '@/types';

// --- Database Setup ---
const DB_FILE = path.join(process.cwd(), 'src', 'data', 'database.db');

async function getDb() {
  const db = await open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });
  await db.exec('PRAGMA journal_mode = WAL;');
  await db.exec('PRAGMA foreign_keys = ON;');
  return db;
}

async function initializeDb() {
    const db = await getDb();
    await db.exec(`
        CREATE TABLE IF NOT EXISTS users (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            login TEXT NOT NULL UNIQUE,
            password TEXT NOT NULL,
            permissions TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS customers (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            phone TEXT,
            email TEXT,
            address TEXT,
            document TEXT
        );
        CREATE TABLE IF NOT EXISTS service_orders (
            id TEXT PRIMARY KEY,
            customerName TEXT NOT NULL,
            equipment TEXT NOT NULL,
            reportedProblem TEXT,
            status TEXT NOT NULL,
            date TEXT NOT NULL,
            deliveredDate TEXT,
            attendant TEXT,
            paymentMethod TEXT,
            warranty TEXT,
            totalValue REAL NOT NULL DEFAULT 0,
            technicalReport TEXT,
            accessories TEXT,
            serialNumber TEXT,
            internalNotes TEXT,
            payments TEXT,
            items TEXT
        );
        CREATE TABLE IF NOT EXISTS stock (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            description TEXT,
            category TEXT,
            quantity INTEGER NOT NULL,
            price REAL NOT NULL,
            costPrice REAL,
            minStock INTEGER,
            barcode TEXT UNIQUE,
            unitOfMeasure TEXT
        );
        CREATE TABLE IF NOT EXISTS sales (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            user TEXT NOT NULL,
            subtotal REAL NOT NULL,
            discount REAL NOT NULL,
            total REAL NOT NULL,
            paymentMethod TEXT,
            observations TEXT,
            customerId TEXT,
            relatedQuoteId TEXT,
            status TEXT,
            reversalReason TEXT,
            items TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS financial_transactions (
            id TEXT PRIMARY KEY,
            type TEXT NOT NULL,
            description TEXT NOT NULL,
            amount REAL NOT NULL,
            date TEXT NOT NULL,
            dueDate TEXT,
            status TEXT,
            category TEXT,
            paymentMethod TEXT,
            relatedSaleId TEXT,
            relatedServiceOrderId TEXT
        );
        CREATE TABLE IF NOT EXISTS appointments (
            id TEXT PRIMARY KEY,
            title TEXT NOT NULL,
            start TEXT NOT NULL,
            "end" TEXT NOT NULL,
            allDay INTEGER NOT NULL,
            extendedProps TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS quotes (
            id TEXT PRIMARY KEY,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            user TEXT NOT NULL,
            subtotal REAL NOT NULL,
            discount REAL NOT NULL,
            total REAL NOT NULL,
            observations TEXT,
            customerId TEXT,
            customerName TEXT,
            status TEXT NOT NULL,
            validUntil TEXT NOT NULL,
            items TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS kits (
            id TEXT PRIMARY KEY,
            name TEXT NOT NULL,
            items TEXT NOT NULL
        );
        CREATE TABLE IF NOT EXISTS company_info (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            name TEXT,
            address TEXT,
            phone TEXT,
            emailOrSite TEXT,
            document TEXT,
            logoUrl TEXT,
            pixKey TEXT,
            notificationSoundUrl TEXT
        );
        CREATE TABLE IF NOT EXISTS settings (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            defaultWarrantyDays INTEGER
        );
        CREATE TABLE IF NOT EXISTS session (
            id INTEGER PRIMARY KEY CHECK (id = 1),
            token TEXT,
            loggedInUserLogin TEXT
        );
    `);
    
    // Seed default user if not present
    const userCount = await db.get('SELECT COUNT(*) as count FROM users');
    if (userCount.count === 0) {
        await db.run(
            'INSERT INTO users (id, name, login, password, permissions) VALUES (?, ?, ?, ?, ?)',
            'master', 'Master User', 'admin', 'YWRtaW4=', JSON.stringify({
                accessDashboard: true, accessClients: true, accessServiceOrders: true,
                accessInventory: true, accessSales: true, accessFinancials: true,
                accessSettings: true, accessDangerZone: true, accessAgenda: true,
                accessQuotes: true, accessLaudos: true, canEdit: true, canDelete: true,
                canViewPasswords: true, canManageUsers: true
            })
        );
    }
    await db.close();
}

// Run initialization once
initializeDb().catch(console.error);

// --- Helper Functions ---
const parseJSON = <T>(jsonString: string | null | undefined, defaultValue: T): T => {
    if (!jsonString) return defaultValue;
    try {
        return JSON.parse(jsonString) as T;
    } catch {
        return defaultValue;
    }
};

// --- Auth Functions ---

export async function getSessionToken(): Promise<string | null> {
    const db = await getDb();
    const session = await db.get('SELECT token FROM session WHERE id = 1');
    await db.close();
    return session?.token || null;
}

export async function getLoggedInUser(): Promise<User | null> {
    const db = await getDb();
    const session = await db.get('SELECT loggedInUserLogin FROM session WHERE id = 1');
    if (!session?.loggedInUserLogin) {
        await db.close();
        return null;
    }
    const userRow = await db.get('SELECT * FROM users WHERE login = ?', session.loggedInUserLogin);
    await db.close();

    if (userRow) {
        return {
            ...userRow,
            permissions: parseJSON<UserPermissions>(userRow.permissions, {} as UserPermissions),
        };
    }
    return null;
}

export async function saveSessionToken(token: string, user: User): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    // Update user permissions in the database
    await db.run('UPDATE users SET permissions = ? WHERE id = ?', JSON.stringify(user.permissions), user.id);
    // Save session
    await db.run('INSERT OR REPLACE INTO session (id, token, loggedInUserLogin) VALUES (1, ?, ?)', token, user.login);
    await db.run('COMMIT');
    await db.close();
}

export async function removeSessionToken(): Promise<void> {
    const db = await getDb();
    await db.run('INSERT OR REPLACE INTO session (id, token, loggedInUserLogin) VALUES (1, NULL, NULL)');
    await db.close();
}

// --- Data Functions ---

// Users
export async function getUsers(): Promise<User[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM users');
    await db.close();
    return rows.map(row => ({ 
        ...row, 
        password: row.password, // Keep password for auth checks
        permissions: parseJSON(row.permissions, {}) 
    }));
}
export async function saveUsers(users: User[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM users');
    for (const user of users) {
        await db.run('INSERT INTO users (id, name, login, password, permissions) VALUES (?, ?, ?, ?, ?)',
            user.id, user.name, user.login, user.password, JSON.stringify(user.permissions));
    }
    await db.run('COMMIT');
    await db.close();
}

// Customers
export async function getCustomers(): Promise<Customer[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM customers ORDER BY name');
    await db.close();
    return rows;
}
export async function saveCustomers(customers: Customer[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM customers');
    for (const customer of customers) {
        await db.run('INSERT INTO customers (id, name, phone, email, address, document) VALUES (?, ?, ?, ?, ?, ?)',
            customer.id, customer.name, customer.phone, customer.email, customer.address, customer.document);
    }
    await db.run('COMMIT');
    await db.close();
}

// Service Orders
export async function getServiceOrders(): Promise<ServiceOrder[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM service_orders ORDER BY date DESC');
    await db.close();
    return rows.map(row => ({
        ...row,
        equipment: typeof row.equipment === 'string' ? row.equipment : parseJSON(row.equipment, {}),
        items: parseJSON<ServiceOrderItem[]>(row.items, []),
        payments: parseJSON<OSPayment[]>(row.payments, []),
        internalNotes: parseJSON<InternalNote[]>(row.internalNotes, []),
    }));
}
export async function saveServiceOrders(orders: ServiceOrder[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM service_orders');
    for (const order of orders) {
        await db.run(`INSERT INTO service_orders (id, customerName, equipment, reportedProblem, status, date, deliveredDate, attendant, paymentMethod, warranty, totalValue, technicalReport, accessories, serialNumber, internalNotes, payments, items) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            order.id, order.customerName, typeof order.equipment === 'string' ? order.equipment : JSON.stringify(order.equipment), order.reportedProblem, order.status, order.date, order.deliveredDate, order.attendant, order.paymentMethod, order.warranty, order.totalValue, order.technicalReport, order.accessories, order.serialNumber, JSON.stringify(order.internalNotes), JSON.stringify(order.payments), JSON.stringify(order.items));
    }
    await db.run('COMMIT');
    await db.close();
}

// Stock
export async function getStock(): Promise<StockItem[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM stock ORDER BY name');
    await db.close();
    return rows;
}
export async function saveStock(stock: StockItem[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM stock');
    for (const item of stock) {
        await db.run(`INSERT INTO stock (id, name, description, category, quantity, price, costPrice, minStock, barcode, unitOfMeasure) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            item.id, item.name, item.description, item.category, item.quantity, item.price, item.costPrice, item.minStock, item.barcode, item.unitOfMeasure);
    }
    await db.run('COMMIT');
    await db.close();
}

// Sales
export async function getSales(): Promise<Sale[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM sales ORDER BY date DESC, time DESC');
    await db.close();
    return rows.map(row => ({ ...row, items: parseJSON<SaleItem[]>(row.items, []) }));
}
export async function saveSales(sales: Sale[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM sales');
    for (const sale of sales) {
        await db.run(`INSERT INTO sales (id, date, time, user, subtotal, discount, total, paymentMethod, observations, customerId, relatedQuoteId, status, reversalReason, items) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            sale.id, sale.date, sale.time, sale.user, sale.subtotal, sale.discount, sale.total, sale.paymentMethod, sale.observations, sale.customerId, sale.relatedQuoteId, sale.status, sale.reversalReason, JSON.stringify(sale.items));
    }
    await db.run('COMMIT');
    await db.close();
}

// Financial Transactions
export async function getFinancialTransactions(): Promise<FinancialTransaction[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM financial_transactions ORDER BY date DESC');
    await db.close();
    return rows;
}
export async function saveFinancialTransactions(transactions: FinancialTransaction[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM financial_transactions');
    for (const tx of transactions) {
        await db.run(`INSERT INTO financial_transactions (id, type, description, amount, date, dueDate, status, category, paymentMethod, relatedSaleId, relatedServiceOrderId) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            tx.id, tx.type, tx.description, tx.amount, tx.date, tx.dueDate, tx.status, tx.category, tx.paymentMethod, tx.relatedSaleId, tx.relatedServiceOrderId);
    }
    await db.run('COMMIT');
    await db.close();
}

// Appointments
export async function getAppointments(): Promise<Appointment[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM appointments');
    await db.close();
    return rows.map(row => ({
        ...row,
        allDay: Boolean(row.allDay),
        extendedProps: parseJSON(row.extendedProps, {}),
    }));
}
export async function saveAppointments(appointments: Appointment[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM appointments');
    for (const appt of appointments) {
        await db.run(`INSERT INTO appointments (id, title, start, "end", allDay, extendedProps) 
            VALUES (?, ?, ?, ?, ?, ?)`,
            appt.id, appt.title, appt.start, appt.end, appt.allDay, JSON.stringify(appt.extendedProps));
    }
    await db.run('COMMIT');
    await db.close();
}

// Quotes
export async function getQuotes(): Promise<Quote[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM quotes ORDER BY date DESC');
    await db.close();
    return rows.map(row => ({ ...row, items: parseJSON<SaleItem[]>(row.items, []) }));
}
export async function saveQuotes(quotes: Quote[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM quotes');
    for (const quote of quotes) {
        await db.run(`INSERT INTO quotes (id, date, time, user, subtotal, discount, total, observations, customerId, customerName, status, validUntil, items) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            quote.id, quote.date, quote.time, quote.user, quote.subtotal, quote.discount, quote.total, quote.observations, quote.customerId, quote.customerName, quote.status, quote.validUntil, JSON.stringify(quote.items));
    }
    await db.run('COMMIT');
    await db.close();
}

// Kits
export async function getKits(): Promise<Kit[]> {
    const db = await getDb();
    const rows = await db.all('SELECT * FROM kits ORDER BY name');
    await db.close();
    return rows.map(row => ({ ...row, items: parseJSON<KitItem[]>(row.items, []) }));
}
export async function saveKits(kits: Kit[]): Promise<void> {
    const db = await getDb();
    await db.run('BEGIN TRANSACTION');
    await db.run('DELETE FROM kits');
    for (const kit of kits) {
        await db.run('INSERT INTO kits (id, name, items) VALUES (?, ?, ?)',
            kit.id, kit.name, JSON.stringify(kit.items));
    }
    await db.run('COMMIT');
    await db.close();
}

// Company Info
export async function getCompanyInfo(): Promise<CompanyInfo> {
    const db = await getDb();
    const row = await db.get('SELECT * FROM company_info WHERE id = 1');
    await db.close();
    const defaultInfo: CompanyInfo = { name: 'Assistec Now', address: '', phone: '', emailOrSite: '', document: '', logoUrl: '', pixKey: '', notificationSoundUrl: '' };
    return row || defaultInfo;
}
export async function saveCompanyInfo(info: CompanyInfo): Promise<void> {
    const db = await getDb();
    await db.run(`INSERT OR REPLACE INTO company_info (id, name, address, phone, emailOrSite, document, logoUrl, pixKey, notificationSoundUrl) 
        VALUES (1, ?, ?, ?, ?, ?, ?, ?, ?)`,
        info.name, info.address, info.phone, info.emailOrSite, info.document, info.logoUrl, info.pixKey, info.notificationSoundUrl);
    await db.close();
}

// Settings
export async function getSettings(): Promise<{ defaultWarrantyDays: number }> {
    const db = await getDb();
    const row = await db.get('SELECT defaultWarrantyDays FROM settings WHERE id = 1');
    await db.close();
    return row || { defaultWarrantyDays: 90 };
}
export async function saveSettings(settings: { defaultWarrantyDays: number }): Promise<void> {
    const db = await getDb();
    await db.run('INSERT OR REPLACE INTO settings (id, defaultWarrantyDays) VALUES (1, ?)', settings.defaultWarrantyDays);
    await db.close();
}

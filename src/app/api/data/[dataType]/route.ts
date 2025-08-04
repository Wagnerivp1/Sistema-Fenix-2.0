
import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

const dataDirectory = path.join(process.cwd(), 'data');

// Ensure the data directory exists
async function ensureDataDirectory() {
    try {
        await fs.access(dataDirectory);
    } catch (error) {
        await fs.mkdir(dataDirectory, { recursive: true });
    }
}

// Map of data types to their corresponding file names
const dataFiles: { [key: string]: string } = {
    customers: 'customers.json',
    serviceOrders: 'serviceOrders.json',
    stock: 'stock.json',
    sales: 'sales.json',
    financialTransactions: 'financialTransactions.json',
    users: 'users.json',
    companyInfo: 'companyInfo.json',
    appointments: 'appointments.json',
    quotes: 'quotes.json',
};

// GET handler to retrieve data
export async function GET(
    request: Request,
    { params }: { params: { dataType: string } }
) {
    const { dataType } = params;
    const fileName = dataFiles[dataType];

    if (!fileName) {
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    await ensureDataDirectory();
    const filePath = path.join(dataDirectory, fileName);

    try {
        await fs.access(filePath);
        const fileContent = await fs.readFile(filePath, 'utf-8');
        const data = JSON.parse(fileContent);
        return NextResponse.json(data);
    } catch (error) {
        // If the file doesn't exist, return an empty array (or default for single objects)
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
             if (dataType === 'companyInfo') {
                return NextResponse.json({}); // Return empty object for single config
             }
             return NextResponse.json([]);
        }
        console.error(`Error reading ${fileName}:`, error);
        return NextResponse.json({ error: `Failed to read ${dataType} data` }, { status: 500 });
    }
}

// POST handler to save data
export async function POST(
    request: Request,
    { params }: { params: { dataType: string } }
) {
    const { dataType } = params;
    const fileName = dataFiles[dataType];

    if (!fileName) {
        return NextResponse.json({ error: 'Invalid data type' }, { status: 400 });
    }

    await ensureDataDirectory();
    const filePath = path.join(dataDirectory, fileName);

    try {
        const body = await request.json();
        const jsonString = JSON.stringify(body, null, 2);
        await fs.writeFile(filePath, jsonString, 'utf-8');
        return NextResponse.json({ success: true, message: `${dataType} data saved.` });
    } catch (error) {
        console.error(`Error writing to ${fileName}:`, error);
        return NextResponse.json({ error: `Failed to save ${dataType} data` }, { status: 500 });
    }
}

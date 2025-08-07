

import { NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

// Helper function to get the full path to a data file
const getDataPath = (fileName: string) => {
  if (!fileName.endsWith('.json')) {
    fileName += '.json';
  }
  // Use process.cwd() to get the root directory of the project
  return path.join(process.cwd(), 'data', fileName);
};

// This map ensures we only access allowed data files
const allowedDataTypes: Record<string, string> = {
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

export async function GET(
  request: Request,
  { params }: { params: { dataType: string } }
) {
  const dataType = params.dataType;
  const fileName = allowedDataTypes[dataType];

  if (!fileName) {
    return NextResponse.json({ message: 'Error: Invalid data type' }, { status: 400 });
  }

  const filePath = getDataPath(fileName);
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error: any) {
    // If the file doesn't exist, return an empty array, which is a common expectation for GET requests.
    if (error.code === 'ENOENT') {
      return NextResponse.json([]);
    }
    console.error(`Error reading ${fileName}:`, error);
    return NextResponse.json({ message: 'Error reading data file' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { dataType: string } }
) {
  const dataType = params.dataType;
  const fileName = allowedDataTypes[dataType];

  if (!fileName) {
    return NextResponse.json({ message: 'Error: Invalid data type' }, { status: 400 });
  }

  try {
    const body = await request.json();
    const filePath = getDataPath(fileName);
    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ message: 'Data saved successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error writing to ${fileName}:`, error);
    return NextResponse.json({ message: 'Error writing data file' }, { status: 500 });
  }
}

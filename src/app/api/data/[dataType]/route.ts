

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
const allowedDataTypes: Record<string, { isArray: boolean }> = {
  customers: { isArray: true },
  serviceOrders: { isArray: true },
  stock: { isArray: true },
  sales: { isArray: true },
  financialTransactions: { isArray: true },
  users: { isArray: true },
  companyInfo: { isArray: false },
  appointments: { isArray: true },
  quotes: { isArray: true },
  settings: { isArray: false },
};

export async function GET(
  request: Request,
  { params }: { params: { dataType: string } }
) {
  const dataType = params.dataType;
  const typeInfo = allowedDataTypes[dataType];

  if (!typeInfo) {
    return NextResponse.json({ message: 'Error: Invalid data type' }, { status: 400 });
  }

  const filePath = getDataPath(`${dataType}.json`);

  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    return NextResponse.json(data);
  } catch (error: any) {
    // If the file doesn't exist, return a sensible default.
    if (error.code === 'ENOENT') {
      // For arrays, return empty array. For objects, return empty object.
      return NextResponse.json(typeInfo.isArray ? [] : {});
    }
    console.error(`Error reading ${dataType}.json:`, error);
    return NextResponse.json({ message: 'Error reading data file' }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: { dataType: string } }
) {
  const dataType = params.dataType;
  const typeInfo = allowedDataTypes[dataType];

  if (!typeInfo) {
    return NextResponse.json({ message: 'Error: Invalid data type' }, { status: 400 });
  }
  
  const filePath = getDataPath(`${dataType}.json`);

  try {
    const body = await request.json();
    
    // Ensure the /data directory exists
    await fs.mkdir(path.dirname(filePath), { recursive: true });

    await fs.writeFile(filePath, JSON.stringify(body, null, 2), 'utf-8');
    return NextResponse.json({ message: 'Data saved successfully' }, { status: 200 });
  } catch (error) {
    console.error(`Error writing to ${dataType}.json:`, error);
    return NextResponse.json({ message: 'Error writing data file' }, { status: 500 });
  }
}

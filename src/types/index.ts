export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  observations: string;
};

export type ServiceOrderItem = {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  type: 'service' | 'part';
}

export type ServiceOrder = {
  id: string;
  customerName: string;
  equipment: string;
  reportedProblem: string;
  status: 'Recebido' | 'Em análise' | 'Aprovado' | 'Em conserto' | 'Finalizado' | 'Entregue' | 'Aberta' | 'Aguardando Pagamento' | 'Aguardando peça' | 'Aguardando' | 'Cancelada';
  date: string;
  totalValue: number;
  items?: ServiceOrderItem[];
  internalNotes?: string;
  technicalReport?: string;
  accessories?: string;
  serialNumber?: string;
};

export type StockItem = {
  id: string; // SKU or internal code
  name: string;
  category?: string;
  description?: string;
  unitOfMeasure?: 'UN' | 'KG' | 'L' | 'M' | 'CX';
  barcode: string;
  costPrice?: number;
  price: number; // Selling price
  quantity: number;
  minStock?: number;
  location?: string;
};

export type StockMovement = {
  id: string;
  itemId: string;
  type: 'entrada' | 'saida';
  origin?: 'compra' | 'devolucao' | 'transferencia' | 'venda' | 'ajuste';
  quantity: number;
  date: string;
  user: string;
  notes?: string;
}

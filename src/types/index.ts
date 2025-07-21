


export type InternalNote = {
  user: string; // The name of the user who made the comment
  date: string; // ISO 8601 date string
  comment: string;
};


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
  date: string; // YYYY-MM-DD
  deliveredDate?: string; // YYYY-MM-DD
  attendant: string; // Nome do atendente
  paymentMethod?: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência' | 'Pendente';
  warranty?: string; // Ex: "90 dias", "1 ano para a peça"
  totalValue: number;
  items?: ServiceOrderItem[];
  internalNotes?: InternalNote[];
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

export interface SaleItem extends Omit<StockItem, 'quantity'> {
  quantity: number;
}

export type Sale = {
    id: string;
    date: string; // YYYY-MM-DD
    items: SaleItem[];
    subtotal: number;
    discount: number;
    total: number;
    paymentMethod: string;
    observations?: string;
    customerId?: string;
};

export type FinancialTransaction = {
    id: string;
    type: 'receita' | 'despesa';
    description: string;
    amount: number;
    date: string; // YYYY-MM-DD
    category: 'Venda de Produto' | 'Venda de Serviço' | 'Compra de Peça' | 'Salário' | 'Aluguel' | 'Outra Receita' | 'Outra Despesa';
    paymentMethod: string;
    relatedSaleId?: string;
    relatedServiceOrderId?: string;
};

export type User = {
  id: string;
  name: string;
  username: string;
  password?: string;
  phone?: string;
  role: 'admin' | 'technician' | 'sales' | 'normal' | 'receptionist';
  active: boolean;
};

export type CompanyInfo = {
  name: string;
  address: string;
  phone: string;
  emailOrSite: string;
  document: string; // CPF or CNPJ
  logoUrl: string;
};

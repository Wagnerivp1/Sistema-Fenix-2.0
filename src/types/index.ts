

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
  document: string;
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
  client?: Customer; // For backwards compatibility
  equipment: any;
  reportedProblem: string;
  status: 'Recebido' | 'Em análise' | 'Aprovado' | 'Em conserto' | 'Finalizado' | 'Entregue' | 'Aberta' | 'Aguardando Pagamento' | 'Aguardando peça' | 'Cancelada';
  date: string; // YYYY-MM-DD
  deliveredDate?: string; // YYYY-MM-DD
  attendant: string; // Nome do atendente
  paymentMethod?: 'Dinheiro' | 'Cartão de Crédito' | 'Cartão de Débito' | 'PIX' | 'Transferência' | 'Pendente';
  warranty?: string; // Ex: "90 dias", "1 ano para a peça"
  totalValue: number;
  discount?: number;
  finalValue?: number;
  items?: ServiceOrderItem[];
  internalNotes?: InternalNote[] | string;
  technicalReport?: string;
  accessories?: string;
  serialNumber?: string;
};

// Represents an item in our inventory.
export type StockItem = {
  id: string;
  name: string;
  description: string;
  category: string;
  quantity: number;
  price: number;
  costPrice: number;
  minStock: number;
  barcode: string;
  unitOfMeasure: string;
};

// Represents a line item in a sale, not a stock item.
export type SaleItem = {
  id: string; // Could be the stock item ID or a temporary ID for manual items
  name: string;
  quantity: number;
  price: number;
};

export type Sale = {
    id: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM:SS
    user: string; // Nome do usuário que efetuou a venda
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

export type UserPermissions = {
  accessDashboard: boolean;
  accessClients: boolean;
  accessServiceOrders: boolean;
  accessInventory: boolean;
  accessSales: boolean;
  accessFinancials: boolean;
  accessSettings: boolean;
  accessDangerZone: boolean;
  accessAgenda: boolean;
  canEdit: boolean;
  canDelete: boolean;
  canViewPasswords: boolean;
  canManageUsers: boolean;
};

export type User = {
  id: string;
  name: string;
  login: string;
  password?: string;
  permissions: UserPermissions;
};


export type CompanyInfo = {
  name: string;
  address: string;
  phone: string;
  emailOrSite: string;
  document: string; // CPF or CNPJ
  logoUrl: string;
  pixKey: string;
  notificationSoundUrl?: string;
};

export type Appointment = {
  id: string;
  title: string;
  start: string;
  end: string;
  allDay: boolean;
  extendedProps: {
    customerId?: string;
    customerName?: string;
    address?: string;
    serviceType?: string;
    notes?: string;
    status: 'agendado' | 'concluido' | 'cancelado';
  };
};

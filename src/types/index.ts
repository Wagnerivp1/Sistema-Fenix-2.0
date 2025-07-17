export type Customer = {
  id: string;
  name: string;
  phone: string;
  email: string;
  address: string;
  observations: string;
};

export type ServiceOrder = {
  id: string;
  customerName: string;
  equipment: string;
  reportedProblem: string;
  status: 'Recebido' | 'Em análise' | 'Aprovado' | 'Em conserto' | 'Finalizado' | 'Entregue';
  date: string;
  totalValue: number;
};

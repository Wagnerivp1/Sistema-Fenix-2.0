
'use client';

import * as React from 'react';
import { PlusCircle, Search, MoreHorizontal, ArrowUpDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { mockStock } from '@/lib/data';
import type { StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function EstoquePage() {
  const [stockItems, setStockItems] = React.useState<StockItem[]>(mockStock);
  const [searchTerm, setSearchTerm] = React.useState('');
  const { toast } = useToast();

  const filteredItems = stockItems.filter((item) =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStockBadge = (quantity: number) => {
    if (quantity <= 0) {
      return (
        <Badge variant="destructive" className="text-destructive-foreground">
          Sem estoque
        </Badge>
      );
    }
    if (quantity <= 5) {
      return (
        <Badge className="bg-yellow-500/80 text-white hover:bg-yellow-500/90">
          Baixo
        </Badge>
      );
    }
    return <Badge variant="secondary">Em estoque</Badge>;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between gap-4">
          <div>
            <CardTitle>Controle de Estoque</CardTitle>
            <CardDescription>
              Gerencie seus produtos e peças.
            </CardDescription>
          </div>
          <Button size="sm">
            <PlusCircle className="h-4 w-4 mr-2" />
            Adicionar Produto
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="mb-4">
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Procurar por nome do produto..."
              className="w-full rounded-lg bg-background pl-8 md:w-[200px] lg:w-[336px]"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Produto</TableHead>
              <TableHead className="hidden md:table-cell">ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Quantidade</TableHead>
              <TableHead>Preço (R$)</TableHead>
              <TableHead>
                <span className="sr-only">Ações</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell className="hidden md:table-cell">{item.id}</TableCell>
                <TableCell>{getStockBadge(item.quantity)}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>{item.price.toFixed(2)}</TableCell>
                <TableCell>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button aria-haspopup="true" size="icon" variant="ghost">
                        <MoreHorizontal className="h-4 w-4" />
                        <span className="sr-only">Toggle menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuLabel>Ações</DropdownMenuLabel>
                      <DropdownMenuItem>Editar</DropdownMenuItem>
                      <DropdownMenuItem>Ajustar Estoque</DropdownMenuItem>
                      <DropdownMenuItem className="text-destructive">
                        Excluir
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        {filteredItems.length === 0 && (
          <div className="text-center py-10 text-muted-foreground">
            Nenhum item encontrado.
          </div>
        )}
      </CardContent>
    </Card>
  );
}

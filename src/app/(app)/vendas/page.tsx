
'use client';

import * as React from 'react';
import { PlusCircle, Search, ShoppingCart, Trash2, X, ChevronsUpDown, Check, User } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import { getStock, getCustomers } from '@/lib/storage';
import type { StockItem, Customer, ServiceOrderItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface SaleItem extends StockItem {
  saleQuantity: number;
}

export default function VendasPage() {
  const { toast } = useToast();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [saleItems, setSaleItems] = React.useState<SaleItem[]>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<StockItem | null>(null);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);
  const [isProductComboboxOpen, setIsProductComboboxOpen] = React.useState(false);
  const [isCustomerComboboxOpen, setIsCustomerComboboxOpen] = React.useState(false);

  React.useEffect(() => {
    setStock(getStock());
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    // Definir "CLIENTE AVULSO" como padrão
    const avulso = loadedCustomers.find(c => c.name.toLowerCase() === 'cliente avulso');
    if(avulso) {
        setSelectedCustomer(avulso);
    }
  }, []);

  const handleAddProduct = () => {
    if (!selectedProduct) {
      toast({ variant: 'destructive', title: 'Nenhum produto selecionado.' });
      return;
    }
    
    // Verifica se o item já está na venda
    const existingItem = saleItems.find(item => item.id === selectedProduct.id);
    if (existingItem) {
        // Se já existe, apenas incrementa a quantidade
        setSaleItems(saleItems.map(item => 
            item.id === selectedProduct.id 
            ? { ...item, saleQuantity: item.saleQuantity + 1 } 
            : item
        ));
    } else {
        // Se não existe, adiciona com quantidade 1
        setSaleItems([...saleItems, { ...selectedProduct, saleQuantity: 1 }]);
    }
    setSelectedProduct(null); // Reseta o combobox
  };

  const handleRemoveItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    if (quantity <= 0) {
        handleRemoveItem(productId);
        return;
    }
    setSaleItems(saleItems.map(item => 
        item.id === productId 
        ? { ...item, saleQuantity: quantity } 
        : item
    ));
  };
  
  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + item.price * item.saleQuantity, 0);
  };
  
  const handleCancelSale = () => {
    setSaleItems([]);
  };

  const total = calculateTotal();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Coluna Esquerda: Adicionar Itens e Finalizar */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Ponto de Venda (PDV)</CardTitle>
            <CardDescription>Adicione produtos para registrar uma nova venda.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div>
              <Label>Adicionar Produto à Venda</Label>
              <div className="flex items-center gap-2 mt-2">
                 <Popover open={isProductComboboxOpen} onOpenChange={setIsProductComboboxOpen}>
                    <PopoverTrigger asChild>
                        <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
                            {selectedProduct?.name || "Selecione ou pesquise um produto..."}
                            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                        <Command>
                            <CommandInput placeholder="Procurar produto..."/>
                            <CommandList>
                                <CommandEmpty>Nenhum produto encontrado.</CommandEmpty>
                                <CommandGroup>
                                    {stock.map((product) => (
                                        <CommandItem
                                            key={product.id}
                                            value={product.name}
                                            onSelect={() => {
                                                setSelectedProduct(product);
                                                setIsProductComboboxOpen(false);
                                            }}
                                            disabled={product.quantity <= 0}
                                        >
                                            <Check className={cn("mr-2 h-4 w-4", selectedProduct?.id === product.id ? "opacity-100" : "opacity-0")} />
                                            {product.name} {product.quantity <= 0 && '(Sem estoque)'}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </PopoverContent>
                </Popover>
                <Button onClick={handleAddProduct} disabled={!selectedProduct}>
                  <PlusCircle className="mr-2 h-4 w-4"/>
                  Adicionar
                </Button>
              </div>
            </div>
            
            <div className="border rounded-lg">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead className="w-[60%]">Produto</TableHead>
                            <TableHead className="w-[10%] text-center">Qtd.</TableHead>
                            <TableHead className="text-right">Preço Unit.</TableHead>
                            <TableHead className="text-right">Subtotal</TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                      {saleItems.length > 0 ? (
                        saleItems.map(item => (
                          <TableRow key={item.id}>
                            <TableCell className="font-medium">{item.name}</TableCell>
                            <TableCell className="text-center">
                                <Input 
                                    type="number"
                                    value={item.saleQuantity}
                                    onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                    className="w-16 h-8 text-center"
                                />
                            </TableCell>
                            <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                            <TableCell className="text-right font-semibold">R$ {(item.price * item.saleQuantity).toFixed(2)}</TableCell>
                            <TableCell>
                                <Button variant="ghost" size="icon" onClick={() => handleRemoveItem(item.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                            </TableCell>
                          </TableRow>
                        ))
                      ) : (
                         <TableRow>
                            <TableCell colSpan={5} className="text-center h-48 text-muted-foreground">
                                <ShoppingCart className="mx-auto h-12 w-12 mb-2" />
                                Nenhum item na venda.
                            </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Coluna Direita: Resumo e Pagamento */}
      <div className="lg:col-span-1">
        <Card className="sticky top-6">
          <CardHeader>
            <CardTitle>Resumo da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="customer">Cliente</Label>
              <Select value={selectedCustomer?.id} onValueChange={(customerId) => {
                  const customer = customers.find(c => c.id === customerId);
                  setSelectedCustomer(customer || null);
              }}>
                <SelectTrigger id="customer">
                    <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <SelectValue placeholder="Selecione um cliente" />
                    </div>
                </SelectTrigger>
                <SelectContent>
                    {customers.map((c) => (
                        <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                    ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Subtotal</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Descontos</span>
                <span className="text-destructive">- R$ 0.00</span>
              </div>
              <div className="flex justify-between font-bold text-lg border-t pt-2">
                <span>Total</span>
                <span>R$ {total.toFixed(2)}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-2">
            <Button className="w-full" disabled={saleItems.length === 0}>Finalizar Venda</Button>
            <Button className="w-full" variant="outline" onClick={handleCancelSale}>Cancelar Venda</Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
}


'use client';

import * as React from 'react';
import { PlusCircle, ShoppingCart, Trash2, User } from 'lucide-react';

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
import { getStock, getCustomers } from '@/lib/storage';
import type { StockItem, Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';


interface SaleItem extends StockItem {
  saleQuantity: number;
}

export default function VendasPage() {
  const { toast } = useToast();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [saleItems, setSaleItems] = React.useState<SaleItem[]>([]);
  const [selectedCustomer, setSelectedCustomer] = React.useState<Customer | null>(null);

  // State for barcode scanning
  const [barcode, setBarcode] = React.useState('');
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  React.useEffect(() => {
    setStock(getStock());
    const loadedCustomers = getCustomers();
    setCustomers(loadedCustomers);
    
    const avulso = loadedCustomers.find(c => c.name.toLowerCase() === 'cliente avulso');
    if(avulso) {
        setSelectedCustomer(avulso);
    }
  }, []);

  // Barcode scanner listener effect
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        // Ignore inputs from text fields, etc.
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            return;
        }

        // If 'Enter' is pressed, it's the end of the scan
        if (event.key === 'Enter') {
            if (barcode.trim()) {
                handleBarcodeScan(barcode.trim());
                setBarcode(''); // Reset for the next scan
            }
            return;
        }
        
        // Accumulate typed characters
        if (event.key.length === 1) {
            setBarcode(prev => prev + event.key);
        }

        // Reset buffer if typing is too slow
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setBarcode('');
        }, 100); // 100ms timeout between keystrokes
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
  }, [barcode, stock]); // Re-run when barcode or stock changes

  const handleBarcodeScan = (scannedCode: string) => {
    const product = stock.find(item => item.barcode === scannedCode);
    
    if (product) {
        if (product.quantity <= 0) {
            toast({ variant: 'destructive', title: 'Fora de Estoque', description: `O produto "${product.name}" não tem estoque disponível.` });
            return;
        }
        addProductToSale(product);
        toast({ title: 'Produto Adicionado!', description: `"${product.name}" foi adicionado à venda.` });
    } else {
        toast({ variant: 'destructive', title: 'Produto Não Encontrado', description: `Nenhum produto encontrado para o código: ${scannedCode}` });
    }
  };

  const addProductToSale = (productToAdd: StockItem) => {
    setSaleItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === productToAdd.id);
        if (existingItem) {
            return prevItems.map(item =>
                item.id === productToAdd.id
                    ? { ...item, saleQuantity: item.saleQuantity + 1 }
                    : item
            );
        } else {
            return [...prevItems, { ...productToAdd, saleQuantity: 1 }];
        }
    });
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
    toast({ title: 'Venda Cancelada', description: 'Todos os itens foram removidos do carrinho.' });
  };

  const total = calculateTotal();

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <CardTitle>Ponto de Venda (PDV)</CardTitle>
            <CardDescription>Use um leitor de código de barras ou adicione produtos manualmente.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="p-4 border rounded-lg bg-muted/30 text-center">
                <p className="text-sm text-muted-foreground">Aguardando leitura do código de barras...</p>
                <p className="font-mono text-xs text-muted-foreground h-4">{barcode || ''}</p>
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

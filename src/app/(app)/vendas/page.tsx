
'use client';

import * as React from 'react';
import { ShoppingCart, Trash2, ScanLine } from 'lucide-react';

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
import { getStock, getCustomers, saveStock, getSales, saveSales, getFinancialTransactions, saveFinancialTransactions } from '@/lib/storage';
import type { StockItem, Customer, Sale, FinancialTransaction } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ManualSearchDialog } from '@/components/sales/manual-search-dialog';


interface SaleItem extends StockItem {
  saleQuantity: number;
}

export default function VendasPage() {
  const { toast } = useToast();
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [customers, setCustomers] = React.useState<Customer[]>([]);
  const [saleItems, setSaleItems] = React.useState<SaleItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState('dinheiro');
  const [observations, setObservations] = React.useState('');
  
  const [barcode, setBarcode] = React.useState('');
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);
  const [isManualSearchOpen, setIsManualSearchOpen] = React.useState(false);
  const stockRef = React.useRef<StockItem[]>([]);
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);
  
  React.useEffect(() => {
    stockRef.current = stock;
  }, [stock]);

  React.useEffect(() => {
    const loadData = async () => {
      const [stockData, customersData] = await Promise.all([
        getStock(),
        getCustomers()
      ]);
      setStock(stockData);
      setCustomers(customersData);
    };
    loadData();
    barcodeInputRef.current?.focus();
  }, []);
  
  const addProductToSale = React.useCallback((productToAdd: StockItem) => {
    setSaleItems(prevItems => {
        const existingItem = prevItems.find(item => item.id === productToAdd.id);
        if (existingItem) {
            const stockItem = stock.find(s => s.id === productToAdd.id);
            if (!stockItem || existingItem.saleQuantity >= stockItem.quantity) {
                 toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: `Não há mais unidades de "${productToAdd.name}" em estoque.` });
                return prevItems;
            }
            return prevItems.map(item =>
                item.id === productToAdd.id
                    ? { ...item, saleQuantity: item.saleQuantity + 1 }
                    : item
            );
        } else {
             if (productToAdd.quantity <= 0) {
                toast({ variant: 'destructive', title: 'Fora de Estoque', description: `O produto "${productToAdd.name}" não tem estoque disponível.` });
                return prevItems;
            }
            return [...prevItems, { ...productToAdd, saleQuantity: 1 }];
        }
    });
  }, [stock, toast]);

  const handleBarcodeScan = React.useCallback((scannedCode: string) => {
    const product = stockRef.current.find(item => item.barcode === scannedCode);

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
    
    setBarcode('');
    barcodeInputRef.current?.focus();
  }, [toast, addProductToSale]);

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') {
            if (event.key === 'Escape') {
                (target as HTMLInputElement).blur();
            }
            return;
        }

        if (event.key === 'F4') {
          handleFinishSale();
          return;
        }
        
        if (event.key === 'Escape') {
            handleCancelSale();
            return;
        }
        
        if (event.key.length === 1 && !event.ctrlKey && !event.metaKey) {
            setBarcode(prev => prev + event.key);
        }

        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
            setBarcode('');
        }, 150);
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }
    };
  }, []); // Removed barcode and handleBarcodeScan from dependencies


  const handleRemoveItem = (productId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== productId));
  };

  const handleUpdateQuantity = (productId: string, quantity: number) => {
    const productInStock = stock.find(p => p.id === productId);
    if (!productInStock) return;

    if (quantity > productInStock.quantity) {
        toast({ variant: 'destructive', title: 'Estoque Insuficiente', description: `Apenas ${productInStock.quantity} unidades de "${productInStock.name}" em estoque.` });
        setSaleItems(saleItems.map(item => 
            item.id === productId 
            ? { ...item, saleQuantity: productInStock.quantity } 
            : item
        ));
        return;
    }

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

  const subtotal = calculateTotal();
  const finalTotal = subtotal - discount;

  const resetSale = () => {
    setSaleItems([]);
    setDiscount(0);
    setPaymentMethod('dinheiro');
    setObservations('');
    setBarcode('');
    barcodeInputRef.current?.focus();
  }
  
  const handleCancelSale = () => {
    resetSale();
    toast({ title: 'Venda Cancelada', description: 'Todos os itens foram removidos do carrinho.' });
  };
  
  const handleFinishSale = async () => {
    if (saleItems.length === 0) {
        toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione produtos para finalizar a venda.' });
        return;
    }

    // 1. Update Stock
    const updatedStock = [...stock];
    saleItems.forEach(saleItem => {
        const stockIndex = updatedStock.findIndex(stockItem => stockItem.id === saleItem.id);
        if (stockIndex !== -1) {
            updatedStock[stockIndex].quantity -= saleItem.saleQuantity;
        }
    });
    setStock(updatedStock);
    await saveStock(updatedStock);

    // 2. Create Sale Record
    const newSale: Sale = {
        id: `SALE-${Date.now()}`,
        date: new Date().toISOString().split('T')[0],
        items: saleItems.map(({ saleQuantity, ...item }) => ({ ...item, quantity: saleQuantity })),
        subtotal: subtotal,
        discount: discount,
        total: finalTotal,
        paymentMethod: paymentMethod,
        observations: observations,
    };
    const existingSales = await getSales();
    await saveSales([...existingSales, newSale]);

    // 3. Create Financial Transaction
    const newTransaction: FinancialTransaction = {
        id: `FIN-${Date.now()}`,
        type: 'receita',
        description: 'Venda de Produtos (PDV)',
        amount: finalTotal,
        date: new Date().toISOString().split('T')[0],
        category: 'Venda de Produto',
        paymentMethod: paymentMethod,
        relatedSaleId: newSale.id,
    };
    const existingTransactions = await getFinancialTransactions();
    await saveFinancialTransactions([...existingTransactions, newTransaction]);

    // 4. Notify and Reset
    toast({ title: 'Venda Finalizada!', description: `Venda de R$ ${finalTotal.toFixed(2)} registrada com sucesso.` });
    resetSale();
  };

  return (
    <>
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
          <div>
              <h1 className="text-3xl font-bold tracking-tight">Ponto de Venda</h1>
              <p className="text-muted-foreground">Registre uma nova venda de produtos ou serviços avulsos.</p>
          </div>
          <div className="flex items-center gap-2">
              <Button variant="destructive" onClick={handleCancelSale}>
                  Cancelar Venda
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-destructive-foreground opacity-100">
                    ESC
                  </kbd>
              </Button>
              <Button className="bg-green-600 hover:bg-green-700 text-white" onClick={handleFinishSale}>
                  Finalizar Venda
                  <kbd className="ml-2 pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-green-900 opacity-100">
                    F4
                  </kbd>
              </Button>
          </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Carrinho de Venda</CardTitle>
              <CardDescription>Adicione produtos via código de barras ou busca manual.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        ref={barcodeInputRef}
                        placeholder="Ler código de barras..." 
                        className="pl-10" 
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' && barcode.trim()) {
                                handleBarcodeScan(barcode.trim());
                            }
                        }}
                      />
                  </div>
                  <Button variant="outline" onClick={() => setIsManualSearchOpen(true)}>Busca Manual</Button>
              </div>
              
              <div className="border rounded-lg min-h-[300px] flex flex-col">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[50%]">Produto</TableHead>
                              <TableHead className="w-[15%] text-center">Qtd.</TableHead>
                              <TableHead className="text-right">Preço</TableHead>
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
                                      className="w-16 h-8 text-center mx-auto"
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
                           <TableRow className="hover:bg-transparent">
                              <TableCell colSpan={5} className="text-center h-full py-20 text-muted-foreground">
                                  <ShoppingCart className="mx-auto h-12 w-12 mb-2" />
                                  O carrinho está vazio.
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
              <CardTitle>Resumo e Pagamento</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-2 text-base">
                <div className="flex justify-between items-center">
                  <span>Subtotal</span>
                  <span className="font-medium">R$ {subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span>Desconto (R$)</span>
                  <Input 
                    value={discount.toFixed(2)} 
                    onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
                    className="w-28 h-9 text-right font-medium" 
                  />
                </div>
                <div className="flex justify-between items-center font-bold text-xl text-primary border-t pt-2">
                  <span>Total</span>
                  <span>R$ {finalTotal.toFixed(2)}</span>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="paymentMethod">Forma de Pagamento</Label>
                <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                  <SelectTrigger id="paymentMethod">
                      <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                      <SelectItem value="dinheiro">Dinheiro</SelectItem>
                      <SelectItem value="pix">PIX</SelectItem>
                      <SelectItem value="credito">Cartão de Crédito</SelectItem>
                      <SelectItem value="debito">Cartão de Débito</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="observations">Observações</Label>
                <Textarea 
                    id="observations" 
                    placeholder="Notas adicionais sobre a venda..." 
                    rows={3}
                    value={observations}
                    onChange={(e) => setObservations(e.target.value)}
                />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
    <ManualSearchDialog
        isOpen={isManualSearchOpen}
        onOpenChange={setIsManualSearchOpen}
        stockItems={stock}
        onProductSelect={addProductToSale}
    />
    </>
  );
}

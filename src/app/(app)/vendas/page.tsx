
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
import { getStock, saveSales, getFinancialTransactions, saveFinancialTransactions, getLoggedInUser, getCompanyInfo, getSales } from '@/lib/storage';
import type { Sale, FinancialTransaction, User, CompanyInfo, SaleItem, StockItem } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ChangeCalculatorDialog } from '@/components/sales/change-calculator-dialog';
import { PrintSaleReceiptDialog } from '@/components/sales/print-sale-receipt-dialog';
import { PixQrCodeDialog } from '@/components/sales/pix-qr-code-dialog';

// Estoque foi removido, a busca manual é agora uma adição manual de item.
import { ManualAddItemDialog } from '@/components/sales/manual-add-item-dialog';

export default function VendasPage() {
  const { toast } = useToast();
  const [saleItems, setSaleItems] = React.useState<SaleItem[]>([]);
  const [discount, setDiscount] = React.useState(0);
  const [paymentMethod, setPaymentMethod] = React.useState('dinheiro');
  const [observations, setObservations] = React.useState('');
  
  const [isManualAddOpen, setIsManualAddOpen] = React.useState(false);
  const [isChangeCalcOpen, setIsChangeCalcOpen] = React.useState(false);
  const barcodeInputRef = React.useRef<HTMLInputElement>(null);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [companyInfoForDialog, setCompanyInfoForDialog] = React.useState<CompanyInfo | null>(null);
  
  const [isPrintReceiptOpen, setIsPrintReceiptOpen] = React.useState(false);
  const [saleToPrint, setSaleToPrint] = React.useState<Sale | null>(null);
  const [isPixDialogOpen, setIsPixDialogOpen] = React.useState(false);
  const [currentSaleId, setCurrentSaleId] = React.useState('');
  
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [barcode, setBarcode] = React.useState('');


  React.useEffect(() => {
    const loadData = async () => {
      const loggedInUser = await getLoggedInUser();
      setCurrentUser(loggedInUser);
      const stockData = await getStock();
      setStock(stockData);
    };
    loadData();
    barcodeInputRef.current?.focus();
  }, []);
  
  const addProductToSale = (productToAdd: Omit<SaleItem, 'id'> & { id?: string }) => {
    setSaleItems(prevItems => {
        const existingItem = prevItems.find(item => item.name.toLowerCase() === productToAdd.name.toLowerCase());
        if (existingItem) {
            return prevItems.map(item =>
                item.name.toLowerCase() === productToAdd.name.toLowerCase()
                    ? { ...item, quantity: item.quantity + productToAdd.quantity }
                    : item
            );
        } else {
            return [...prevItems, { ...productToAdd, id: productToAdd.id || `ITEM-${Date.now()}` } as SaleItem];
        }
    });
  };
  
  const handleBarcodeScan = () => {
    if (!barcode.trim()) return;
    
    const product = stock.find(item => item.barcode === barcode.trim());
    
    if (product) {
        addProductToSale({
            id: product.id,
            name: product.name,
            price: product.price,
            quantity: 1,
        });
        toast({ title: "Produto Adicionado", description: `${product.name} foi adicionado ao carrinho.` });
    } else {
        toast({ variant: "destructive", title: "Produto não encontrado", description: `Nenhum produto encontrado com o código ${barcode}.` });
    }
    
    setBarcode(''); // Clear input for next scan
  };

  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
        const target = event.target as HTMLElement;
        const isInputFocused = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA';
        
        if (event.key === 'F4' && !isInputFocused) {
          event.preventDefault();
          handleFinishSale();
          return;
        }
        
        if (event.key === 'Escape' && !isInputFocused) {
            event.preventDefault();
            handleCancelSale();
            return;
        }

        if (isInputFocused && event.key === 'Escape') {
          (target as HTMLInputElement).blur();
          return;
        }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
        window.removeEventListener('keydown', handleKeyDown);
    };
  }, [saleItems, discount, paymentMethod, observations]);


  const handleRemoveItem = (itemId: string) => {
    setSaleItems(saleItems.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
        handleRemoveItem(itemId);
        return;
    }
    setSaleItems(saleItems.map(item => 
        item.id === itemId 
        ? { ...item, quantity: quantity } 
        : item
    ));
  };
  
  const calculateTotal = () => {
    return saleItems.reduce((total, item) => total + item.price * item.quantity, 0);
  };

  const subtotal = calculateTotal();
  const finalTotal = subtotal - discount;

  const resetSale = () => {
    setSaleItems([]);
    setDiscount(0);
    setPaymentMethod('dinheiro');
    setObservations('');
    setCurrentSaleId('');
    setCompanyInfoForDialog(null);
    barcodeInputRef.current?.focus();
  }
  
  const handleCancelSale = () => {
    resetSale();
    toast({ title: 'Venda Cancelada', description: 'Todos os itens foram removidos do carrinho.' });
  };
  
  const processSale = async (shouldPrint = false) => {
    if (saleItems.length === 0) {
        toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione produtos para finalizar a venda.' });
        return;
    }
    
    const saleId = currentSaleId || `SALE-${Date.now()}`;

    // 1. Create Sale Record
    const newSale: Sale = {
        id: saleId,
        date: new Date().toISOString().split('T')[0],
        time: new Date().toLocaleTimeString('pt-BR'),
        user: currentUser?.name || 'Não identificado',
        items: saleItems,
        subtotal: subtotal,
        discount: discount,
        total: finalTotal,
        paymentMethod: paymentMethod,
        observations: observations,
    };
    const existingSales = await getSales();
    await saveSales([...existingSales, newSale]);

    // 2. Create Financial Transaction
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
    await saveFinancialTransactions([newTransaction, ...existingTransactions]);

    // 3. Notify and Reset
    toast({ title: 'Venda Finalizada!', description: `Venda de R$ ${finalTotal.toFixed(2)} registrada com sucesso.` });
    
    // 4. Conditional dialogs
    setIsChangeCalcOpen(false);
    setIsPixDialogOpen(false);
    
    if (shouldPrint) {
        setSaleToPrint(newSale);
        setIsPrintReceiptOpen(true);
    }
    
    resetSale();
  }

  const handleFinishSale = async () => {
    if (saleItems.length === 0) {
      toast({ variant: 'destructive', title: 'Carrinho Vazio', description: 'Adicione produtos para finalizar a venda.' });
      return;
    }

    setCompanyInfoForDialog(null); // Clear previous info to ensure re-fetch
    setCurrentSaleId(`SALE-${Date.now()}`);

    const companyData = await getCompanyInfo();
    setCompanyInfoForDialog(companyData);

    if (paymentMethod === 'dinheiro') {
        setIsChangeCalcOpen(true);
    } else if (paymentMethod === 'pix') {
        if (!companyData?.pixKey) {
            toast({
                variant: 'destructive',
                title: 'Chave PIX não configurada',
                description: 'Por favor, cadastre uma chave PIX nas configurações da empresa.',
            });
            setCurrentSaleId('');
            setCompanyInfoForDialog(null);
            return;
        }
        setIsPixDialogOpen(true);
    }
    else {
        processSale(true);
    }
  }

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
              <CardDescription>Adicione produtos ou serviços manualmente.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                  <div className="relative flex-grow">
                      <ScanLine className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                      <Input 
                        ref={barcodeInputRef}
                        placeholder="Escanear código de barras..." 
                        className="pl-10"
                        value={barcode}
                        onChange={(e) => setBarcode(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleBarcodeScan()}
                      />
                  </div>
                  <Button variant="outline" onClick={() => setIsManualAddOpen(true)}>Adicionar Item Manual</Button>
              </div>
              
              <div className="border rounded-lg min-h-[300px] flex flex-col">
                  <Table>
                      <TableHeader>
                          <TableRow>
                              <TableHead className="w-[50%]">Produto/Serviço</TableHead>
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
                                      value={item.quantity}
                                      onChange={(e) => handleUpdateQuantity(item.id, parseInt(e.target.value))}
                                      className="w-16 h-8 text-center mx-auto"
                                  />
                              </TableCell>
                              <TableCell className="text-right">R$ {item.price.toFixed(2)}</TableCell>
                              <TableCell className="text-right font-semibold">R$ {(item.price * item.quantity).toFixed(2)}</TableCell>
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
    <ManualAddItemDialog
        isOpen={isManualAddOpen}
        onAddItem={(item) => addProductToSale({ ...item, id: `manual-${Date.now()}`})}
        onOpenChange={setIsManualAddOpen}
    />
    <ChangeCalculatorDialog
        isOpen={isChangeCalcOpen}
        onOpenChange={setIsChangeCalcOpen}
        total={finalTotal}
        onConfirm={() => processSale(true)}
    />
    <PixQrCodeDialog
        isOpen={isPixDialogOpen}
        onOpenChange={setIsPixDialogOpen}
        companyInfo={companyInfoForDialog}
        sale={{ total: finalTotal, id: currentSaleId }}
        onConfirm={() => processSale(true)}
    />
    <PrintSaleReceiptDialog
      isOpen={isPrintReceiptOpen}
      onOpenChange={setIsPrintReceiptOpen}
      sale={saleToPrint}
    />
    </>
  );
}

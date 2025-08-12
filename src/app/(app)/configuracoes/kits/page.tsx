
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { getKits, saveKits, getStock } from '@/lib/storage';
import { PlusCircle, MoreHorizontal, Package, Trash2 } from 'lucide-react';
import type { Kit, StockItem } from '@/types';
import { KitBuilderDialog } from '@/components/kits/kit-builder-dialog';

export default function KitsPage() {
  const { toast } = useToast();
  const [kits, setKits] = React.useState<Kit[]>([]);
  const [stock, setStock] = React.useState<StockItem[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingKit, setEditingKit] = React.useState<Kit | null>(null);

  React.useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      const [kitsData, stockData] = await Promise.all([
          getKits(),
          getStock()
      ]);
      setKits(kitsData);
      setStock(stockData);
      setIsLoading(false);
    };
    loadData();
  }, []);

  const handleOpenDialog = (kit: Kit | null) => {
    setEditingKit(kit);
    setIsDialogOpen(true);
  };

  const handleSaveKit = async (kitToSave: Kit) => {
    let updatedKits;
    if (kits.some(k => k.id === kitToSave.id)) {
      updatedKits = kits.map(k => k.id === kitToSave.id ? kitToSave : k);
      toast({ title: "Kit Atualizado!", description: `O kit "${kitToSave.name}" foi salvo.` });
    } else {
      updatedKits = [...kits, kitToSave];
      toast({ title: "Kit Criado!", description: `O kit "${kitToSave.name}" foi adicionado.` });
    }
    setKits(updatedKits);
    await saveKits(updatedKits);
    setIsDialogOpen(false);
  };

  const handleDeleteKit = async (kitId: string) => {
    const updatedKits = kits.filter(k => k.id !== kitId);
    setKits(updatedKits);
    await saveKits(updatedKits);
    toast({ variant: 'destructive', title: "Kit Excluído!", description: "O kit foi removido permanentemente." });
  };

  const calculateKitCost = (kit: Kit) => {
    return kit.items.reduce((total, kitItem) => {
        const stockItem = stock.find(s => s.id === kitItem.productId);
        return total + (stockItem ? stockItem.price * kitItem.quantity : 0);
    }, 0);
  };
  
  if (isLoading) {
    return <div>Carregando kits...</div>;
  }

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Gerenciador de Kits</CardTitle>
              <CardDescription>Crie e edite kits de produtos para agilizar seus orçamentos.</CardDescription>
            </div>
            <Button size="sm" onClick={() => handleOpenDialog(null)}>
              <PlusCircle className="h-4 w-4 mr-2" />
              Novo Kit
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-md">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome do Kit</TableHead>
                  <TableHead>Nº de Itens</TableHead>
                  <TableHead className="text-right">Valor Total do Kit</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {kits.length > 0 ? kits.map(kit => (
                  <TableRow key={kit.id}>
                    <TableCell className="font-medium">{kit.name}</TableCell>
                    <TableCell>{kit.items.length}</TableCell>
                    <TableCell className="text-right">R$ {calculateKitCost(kit).toFixed(2)}</TableCell>
                    <TableCell className="text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost"><MoreHorizontal className="h-4 w-4" /></Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Ações</DropdownMenuLabel>
                          <DropdownMenuItem onSelect={() => handleOpenDialog(kit)}>Editar</DropdownMenuItem>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                               <DropdownMenuItem onSelect={e => e.preventDefault()} className="text-destructive focus:text-destructive">Excluir</DropdownMenuItem>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                                <AlertDialogHeader>
                                    <AlertDialogTitle>Tem certeza?</AlertDialogTitle>
                                    <AlertDialogDescription>Esta ação é irreversível e excluirá o kit permanentemente.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                    <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                    <AlertDialogAction onClick={() => handleDeleteKit(kit.id)}>Excluir</AlertDialogAction>
                                </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                )) : (
                  <TableRow>
                    <TableCell colSpan={4} className="h-48 text-center">
                      <Package className="h-12 w-12 mx-auto text-muted-foreground mb-2" />
                      <p className="font-semibold">Nenhum kit cadastrado</p>
                      <p className="text-muted-foreground text-sm">Clique em "Novo Kit" para começar.</p>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <KitBuilderDialog 
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        kit={editingKit}
        stockItems={stock}
        onSave={handleSaveKit}
      />
    </>
  );
}

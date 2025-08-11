
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileCog, FileUp, DatabaseZap } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Customer, FinancialTransaction, ServiceOrder } from '@/types';
import { saveCustomers, saveFinancialTransactions, saveServiceOrders } from '@/lib/storage';
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

export default function FerramentasPage() {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const [convertedData, setConvertedData] = React.useState<{ customers: Customer[], serviceOrders: ServiceOrder[], financialTransactions: FinancialTransaction[] } | null>(null);
  const [isConfirmImportOpen, setIsConfirmImportOpen] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | null) => {
    if (!file) return;

    if (file.type !== 'application/json') {
      toast({
        variant: 'destructive',
        title: 'Arquivo Inválido',
        description: 'Por favor, selecione um arquivo de backup no formato JSON.',
      });
      return;
    }
    setBackupFile(file);
    setConvertedData(null);
    toast({
      title: 'Arquivo Carregado!',
      description: `O arquivo ${file.name} está pronto para ser convertido.`,
    });
  };

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    handleDragEvents(e);
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const convertData = () => {
    if (!backupFile) {
      toast({ variant: 'destructive', title: 'Nenhum Arquivo', description: 'Carregue um arquivo de backup primeiro.' });
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') throw new Error('Não foi possível ler o conteúdo do arquivo.');
        const oldData = JSON.parse(text);

        // --- Conversão de Clientes ---
        const oldClients = oldData.clients || oldData.customers || [];
        const newCustomers: Customer[] = oldClients.map((c: any) => ({
          id: c.id || `CUST-${Date.now()}-${Math.random()}`,
          name: c.name || c.fullName || 'Nome não encontrado',
          phone: c.phone || c.telephone || '',
          email: c.email || '',
          address: c.address || '',
          document: c.document || '',
        }));
        
        // --- Conversão de Ordens de Serviço ---
        const oldServiceOrders = oldData.serviceOrders || [];
        const newServiceOrders: ServiceOrder[] = oldServiceOrders.map((os: any) => ({
          id: os.id || `OS-${Date.now()}-${Math.random()}`,
          customerName: os.customerName || os.client?.name || 'Cliente não encontrado',
          equipment: os.equipment || { type: 'N/A', brand: 'N/A', model: 'N/A' },
          reportedProblem: os.reportedProblem || os.defectReported || '',
          status: os.status || 'Finalizado',
          date: os.date || os.entryDate || new Date().toISOString().split('T')[0],
          deliveredDate: os.deliveredDate || os.completionDate,
          attendant: os.attendant || 'Sistema',
          paymentMethod: os.paymentMethod,
          warranty: os.warranty || '90 dias',
          totalValue: os.totalValue || 0,
          discount: os.discount || 0,
          finalValue: os.finalValue || os.totalValue || 0,
          items: os.items || os.servicesPerformed?.map((s:any) => ({...s, type: 'service'})) || [],
          internalNotes: os.internalNotes || os.comments || [],
          technicalReport: os.technicalReport || os.technicalDiagnosis,
          accessories: os.accessories,
          serialNumber: os.serialNumber || os.equipment?.serialNumber,
        }));

        // --- Conversão Financeira ---
        const oldFinancials = oldData.financialTransactions || [];
        const newFinancials: FinancialTransaction[] = oldFinancials.map((ft: any) => ({
          id: ft.id || `FIN-${Date.now()}-${Math.random()}`,
          type: ft.type || (ft.amount > 0 ? 'receita' : 'despesa'),
          description: ft.description,
          amount: Math.abs(ft.amount),
          date: ft.date,
          category: ft.category || 'Outra Receita',
          paymentMethod: ft.paymentMethod || 'Dinheiro',
          relatedSaleId: ft.relatedSaleId,
          relatedServiceOrderId: ft.relatedServiceOrderId,
        }));

        setConvertedData({
          customers: newCustomers,
          serviceOrders: newServiceOrders,
          financialTransactions: newFinancials
        });

        toast({
          title: 'Conversão Concluída!',
          description: `Foram encontrados ${newCustomers.length} clientes, ${newServiceOrders.length} OS e ${newFinancials.length} transações.`,
        });

      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao Processar',
          description: error.message || 'Ocorreu um erro ao ler o arquivo JSON.',
        });
      }
    };
    reader.readAsText(backupFile);
  };
  
  const handleImport = async () => {
    if (!convertedData) return;

    try {
        await saveCustomers(convertedData.customers);
        await saveServiceOrders(convertedData.serviceOrders);
        await saveFinancialTransactions(convertedData.financialTransactions);
        
        toast({
            title: 'Importação Concluída com Sucesso!',
            description: 'Os dados foram salvos no sistema. Recomenda-se recarregar a página.',
        });
    } catch(err) {
        toast({
            variant: 'destructive',
            title: 'Erro ao Salvar Dados',
            description: 'Não foi possível salvar os dados importados no sistema.',
        });
    } finally {
        setIsConfirmImportOpen(false);
    }
  }


  return (
    <>
      <div className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Ferramenta de Importação de Dados</CardTitle>
            <CardDescription>
              Importe clientes, ordens de serviço e dados financeiros de um backup de sistema antigo.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-8">
            
            <div className="p-6 border-2 border-dashed rounded-lg text-center space-y-3"
              onDragEnter={() => setIsDragOver(true)}
              onDragLeave={() => setIsDragOver(false)}
              onDragOver={handleDragEvents}
              onDrop={handleDrop}
              style={{ backgroundColor: isDragOver ? 'var(--accent)' : 'transparent' }}
            >
              <div className="mx-auto bg-muted p-4 rounded-full w-fit">
                <FileUp className="h-8 w-8 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold">
                {backupFile ? `Arquivo Carregado: ${backupFile.name}` : "Arraste e solte o arquivo de backup aqui"}
              </h3>
              <p className="text-muted-foreground">ou</p>
              <Button variant="outline" onClick={() => fileInputRef.current?.click()}>
                Selecione um arquivo
              </Button>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".json"
                onChange={(e) => handleFileSelect(e.target.files ? e.target.files[0] : null)}
              />
            </div>

            <div className="flex justify-center">
              <Button onClick={convertData} disabled={!backupFile}>
                  <FileCog className="mr-2 h-4 w-4" />
                  Analisar e Converter Arquivo
              </Button>
            </div>
            
            {convertedData && (
              <div className="p-4 border rounded-lg bg-green-500/10 text-green-700 space-y-4">
                <h3 className="text-lg font-semibold">Dados Prontos para Importação</h3>
                <ul className="list-disc list-inside text-sm text-green-800">
                    <li>{convertedData.customers.length} clientes encontrados.</li>
                    <li>{convertedData.serviceOrders.length} ordens de serviço encontradas.</li>
                    <li>{convertedData.financialTransactions.length} transações financeiras encontradas.</li>
                </ul>
                <p className="text-xs text-green-600">
                    Atenção: A importação substituirá TODOS os dados existentes das categorias mencionadas. 
                    Recomenda-se fazer um backup do sistema atual antes de prosseguir.
                </p>
              </div>
            )}

          </CardContent>
          {convertedData && (
            <CardFooter className="border-t px-6 py-4 justify-end">
                <Button onClick={() => setIsConfirmImportOpen(true)}>
                    <DatabaseZap className="mr-2 h-4 w-4"/>
                    Importar Dados para o Sistema
                </Button>
            </CardFooter>
          )}
        </Card>
      </div>

       <AlertDialog open={isConfirmImportOpen} onOpenChange={setIsConfirmImportOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Confirmar Importação?</AlertDialogTitle>
              <AlertDialogDescription>
                Esta ação é irreversível e substituirá permanentemente todos os clientes, ordens de serviço e dados financeiros do sistema atual. 
                Você tem certeza que deseja continuar?
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction className="bg-destructive hover:bg-destructive/90" onClick={handleImport}>
                Sim, Importar e Substituir
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
    </>
  );
}

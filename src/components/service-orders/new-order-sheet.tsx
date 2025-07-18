
'use client';

import * as React from 'react';
import { PlusCircle, Printer, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { mockCustomers } from '@/lib/data';
import type { Customer } from '@/types';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { getAiSuggestions } from '@/app/actions';
import type { SuggestResolutionOutput } from '@/ai/flows/suggest-resolution';
import { AiSuggestions } from './ai-suggestions';

interface NewOrderSheetProps {
  customer?: Customer | null;
  isOpen?: boolean;
  onOpenChange?: (isOpen: boolean) => void;
}

export function NewOrderSheet({ customer, isOpen, onOpenChange }: NewOrderSheetProps) {
  const { toast } = useToast();
  const [selectedCustomerId, setSelectedCustomerId] = React.useState<string | undefined>(undefined);
  const [equipmentType, setEquipmentType] = React.useState('');
  const [reportedProblem, setReportedProblem] = React.useState('');
  const [aiSuggestions, setAiSuggestions] = React.useState<SuggestResolutionOutput | null>(null);
  const [isAiLoading, setIsAiLoading] = React.useState(false);

  const debounceTimeoutRef = React.useRef<NodeJS.Timeout | null>(null);


  React.useEffect(() => {
    if (customer) {
      setSelectedCustomerId(customer.id);
    }
  }, [customer]);

  React.useEffect(() => {
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }

    if (equipmentType && reportedProblem) {
      setIsAiLoading(true);
      debounceTimeoutRef.current = setTimeout(async () => {
        const result = await getAiSuggestions(equipmentType, reportedProblem);
        if (result.success) {
          setAiSuggestions(result.data);
        } else {
          toast({
            variant: 'destructive',
            title: 'Erro na IA',
            description: result.error,
          });
          setAiSuggestions(null);
        }
        setIsAiLoading(false);
      }, 1000); // 1 segundo de debounce
    } else {
        setAiSuggestions(null);
        setIsAiLoading(false);
    }
    
    return () => {
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
    };
  }, [equipmentType, reportedProblem, toast]);
  
  const handleSave = () => {
    // Aqui você adicionaria a lógica para salvar a OS no banco de dados
    console.log("Saving service order...");
    toast({
      title: 'Ordem de Serviço Salva!',
      description: 'A nova ordem de serviço foi registrada com sucesso.',
    });
    if (onOpenChange) {
      onOpenChange(false);
    }
  };

  const handlePrint = (documentType: string) => {
    // Lógica de impressão
    toast({
        title: 'Imprimindo documento...',
        description: `O ${documentType} será impresso.`,
    })
  }

  const trigger = (
    <DialogTrigger asChild>
      <Button size="sm" className="gap-1 bg-primary hover:bg-primary/90 text-primary-foreground">
        <PlusCircle className="h-3.5 w-3.5" />
        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
          Adicionar OS
        </span>
         <kbd className="ml-2 pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium text-muted-foreground opacity-100 sm:inline-flex">
            O
          </kbd>
      </Button>
    </DialogTrigger>
  );

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {/* Only render trigger if onOpenChange is not provided, meaning it's self-managed */}
      {!onOpenChange && trigger}
      <DialogContent className="sm:max-w-4xl w-full max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Nova Ordem de Serviço</DialogTitle>
          <DialogDescription>
            Preencha os dados para registrar um novo atendimento.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="flex-grow pr-6">
          <div className="grid gap-6 py-4">
            <div className="grid grid-cols-1 gap-4">
               <div>
                  <Label htmlFor="customer">Selecione um cliente</Label>
                   <Select value={selectedCustomerId} onValueChange={setSelectedCustomerId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione um cliente" />
                    </SelectTrigger>
                    <SelectContent>
                      {mockCustomers.map((c) => (
                          <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
              </div>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div>
                <Label htmlFor="type">Tipo</Label>
                <Input id="type" placeholder="Ex: Notebook" value={equipmentType} onChange={(e) => setEquipmentType(e.target.value)} />
              </div>
              <div>
                <Label htmlFor="brand">Marca</Label>
                <Input id="brand" placeholder="Ex: Dell" />
              </div>
              <div>
                <Label htmlFor="model">Modelo</Label>
                <Input id="model" placeholder="Ex: Inspiron 15" />
              </div>
               <div>
                <Label htmlFor="serial">Nº de Série</Label>
                <Input id="serial" placeholder="Serial" />
              </div>
            </div>
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="accessories">Acessórios Entregues com o Equipamento</Label>
              <Textarea
                id="accessories"
                placeholder="Ex: Carregador original, mochila preta e adaptador HDMI."
              />
               <p className="text-sm text-muted-foreground">Descreva todos os acessórios que o cliente deixou junto com o equipamento.</p>
            </div>
             <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="problem">Defeito Reclamado</Label>
              <Textarea
                id="problem"
                placeholder="Descrição detalhada do problema informado pelo cliente."
                 value={reportedProblem} 
                 onChange={(e) => setReportedProblem(e.target.value)}
              />
            </div>
             {(isAiLoading || aiSuggestions) && (
              <AiSuggestions suggestions={aiSuggestions} isLoading={isAiLoading} />
            )}
            <div className="grid grid-cols-1 gap-2">
              <Label htmlFor="technical_report">Diagnóstico / Laudo Técnico</Label>
              <Textarea
                id="technical_report"
                placeholder="Descrição técnica detalhada do diagnóstico, serviço a ser executado, peças necessárias, etc."
                rows={5}
              />
            </div>
          </div>
        </ScrollArea>
        <DialogFooter className="mt-4 pt-4 border-t flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
            <div className="flex flex-wrap items-center justify-start gap-2">
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Orçamento')}><Printer className="mr-2 h-4 w-4" />Orçamento</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Reimpressão de OS')}><Printer className="mr-2 h-4 w-4" />Reimprimir OS</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrada')}><FileText className="mr-2 h-4 w-4" />Recibo Entrada</Button>
                 <Button variant="outline" size="sm" onClick={() => handlePrint('Recibo de Entrega')}><FileText className="mr-2 h-4 w-4" />Recibo Entrega</Button>
            </div>
            <div className="flex justify-end gap-2">
                <DialogClose asChild>
                    <Button variant="ghost">Cancelar</Button>
                </DialogClose>
                <Button onClick={handleSave}>Salvar Ordem de Serviço</Button>
            </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

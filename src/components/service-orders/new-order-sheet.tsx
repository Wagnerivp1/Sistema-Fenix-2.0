'use client';

import * as React from 'react';
import { PlusCircle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
  SheetClose
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { getAiSuggestions } from '@/app/actions';
import { AiSuggestions } from './ai-suggestions';
import { useToast } from '@/hooks/use-toast';
import type { SuggestResolutionOutput } from '@/ai/flows/suggest-resolution';

export function NewOrderSheet() {
  const [deviceType, setDeviceType] = React.useState('');
  const [reportedProblem, setReportedProblem] = React.useState('');
  const [suggestions, setSuggestions] = React.useState<SuggestResolutionOutput | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const { toast } = useToast();

  const handleGetSuggestions = async () => {
    setIsLoading(true);
    setSuggestions(null);
    const result = await getAiSuggestions(deviceType, reportedProblem);
    if (result.success) {
      setSuggestions(result.data);
    } else {
      toast({
        variant: 'destructive',
        title: 'Erro',
        description: result.error,
      });
    }
    setIsLoading(false);
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button size="sm" className="gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Nova Ordem de Serviço
          </span>
        </Button>
      </SheetTrigger>
      <SheetContent className="sm:max-w-xl w-full">
        <SheetHeader>
          <SheetTitle>Nova Ordem de Serviço</SheetTitle>
          <SheetDescription>
            Preencha os dados para abrir uma nova OS.
          </SheetDescription>
        </SheetHeader>
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="customer" className="text-right">
              Cliente
            </Label>
            <Input id="customer" placeholder="Nome do cliente" className="col-span-3" />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="deviceType" className="text-right">
              Equipamento
            </Label>
            <Input
              id="deviceType"
              placeholder="Ex: iPhone 13, Notebook Dell"
              className="col-span-3"
              value={deviceType}
              onChange={(e) => setDeviceType(e.target.value)}
            />
          </div>
          <div className="grid grid-cols-4 items-center gap-4">
            <Label htmlFor="reportedProblem" className="text-right">
              Defeito
            </Label>
            <Textarea
              id="reportedProblem"
              placeholder="Descrição do problema relatado pelo cliente"
              className="col-span-3"
              value={reportedProblem}
              onChange={(e) => setReportedProblem(e.target.value)}
            />
          </div>
          
          <div className="col-span-4">
            <Button
              onClick={handleGetSuggestions}
              disabled={isLoading || !deviceType || !reportedProblem}
              className="w-full gap-2 bg-accent hover:bg-accent/90"
            >
              <Sparkles className="h-4 w-4" />
              {isLoading ? 'Analisando...' : 'Obter Sugestões com IA'}
            </Button>
          </div>

          <AiSuggestions suggestions={suggestions} isLoading={isLoading} />
        </div>
        <SheetFooter>
          <SheetClose asChild>
            <Button type="submit">Salvar Ordem de Serviço</Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

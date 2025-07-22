
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { UploadCloud, FileCog, Download } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { Sale } from '@/types';

export default function FerramentasPage() {
  const { toast } = useToast();
  const [isDragOver, setIsDragOver] = React.useState(false);
  const [oldBackup, setOldBackup] = React.useState<any>(null);
  const [convertedBackup, setConvertedBackup] = React.useState<any>(null);
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

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Não foi possível ler o conteúdo do arquivo.');
        }
        const data = JSON.parse(text);
        setOldBackup(data);
        setConvertedBackup(null); // Reseta a conversão anterior
        toast({
          title: 'Arquivo Carregado!',
          description: 'Seu arquivo de backup antigo está pronto para ser convertido.',
        });
      } catch (error: any) {
        toast({
          variant: 'destructive',
          title: 'Erro ao Processar',
          description: error.message || 'Ocorreu um erro ao ler o arquivo JSON.',
        });
      }
    };
    reader.readAsText(file);
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
    if (!oldBackup) {
      toast({
        variant: 'destructive',
        title: 'Nenhum Arquivo',
        description: 'Carregue um arquivo de backup primeiro.',
      });
      return;
    }

    let converted = { ...oldBackup };

    // Regra 1: Renomear 'clients' para 'customers'
    if (converted.clients && !converted.customers) {
      converted.customers = converted.clients;
      delete converted.clients;
    }
    
    // Regra 2: Mapear campos dentro de 'customers'
    if (converted.customers) {
      converted.customers = converted.customers.map((c: any) => ({
        ...c,
        name: c.name || c.fullName,
        phone: c.phone || c.telephone,
      }));
    }

    // Regra 3: Adicionar campos 'time' e 'user' em 'sales' se não existirem
    if (converted.sales) {
        converted.sales = converted.sales.map((s: any): Sale => ({
            ...s,
            time: s.time || new Date(s.date).toLocaleTimeString('pt-BR'),
            user: s.user || 'Não identificado'
        }))
    }

    // Adicione mais regras de conversão aqui conforme necessário

    setConvertedBackup(converted);
    toast({
      title: 'Conversão Concluída!',
      description: 'Seu arquivo de backup foi convertido para o novo formato.',
    });
  };

  const downloadConvertedFile = () => {
    if (!convertedBackup) return;

    const jsonString = JSON.stringify(convertedBackup, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup-convertido-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Ferramenta de Conversão de Backup</CardTitle>
          <CardDescription>
            Converta um arquivo de backup de uma versão anterior do sistema para o formato atual.
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
              <UploadCloud className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold">
              {oldBackup ? `Arquivo Carregado: ${oldBackup.name || 'backup.json'}` : "Arraste e solte o arquivo de backup aqui"}
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
             <Button onClick={convertData} disabled={!oldBackup}>
                <FileCog className="mr-2 h-4 w-4" />
                Converter Arquivo
             </Button>
          </div>
          
          {convertedBackup && (
            <div className="p-4 border rounded-lg bg-green-500/10 text-center space-y-3">
              <h3 className="text-lg font-semibold text-green-700">Conversão Pronta!</h3>
              <p className="text-green-600">Seu arquivo foi convertido com sucesso. Clique abaixo para fazer o download.</p>
              <Button onClick={downloadConvertedFile} className="bg-green-600 hover:bg-green-700">
                <Download className="mr-2 h-4 w-4" />
                Baixar Arquivo Convertido
              </Button>
            </div>
          )}

        </CardContent>
      </Card>
    </div>
  );
}

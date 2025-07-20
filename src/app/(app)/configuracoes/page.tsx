
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Save, Download, Upload, AlertTriangle, Trash2 } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { APP_STORAGE_KEYS } from '@/lib/storage';

const SETTINGS_KEY = 'app_settings';

interface AppSettings {
  defaultWarrantyDays: number;
}

export default function ConfiguracoesPage() {
  const { toast } = useToast();
  const [settings, setSettings] = React.useState<AppSettings>({
    defaultWarrantyDays: 90,
  });
  const [isLoading, setIsLoading] = React.useState(true);
  const [isClearAlertOpen, setIsClearAlertOpen] = React.useState(false);
  const [isRestoreAlertOpen, setIsRestoreAlertOpen] = React.useState(false);
  const [backupFile, setBackupFile] = React.useState<File | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    try {
      const savedSettings = localStorage.getItem(SETTINGS_KEY);
      if (savedSettings) {
        setSettings(JSON.parse(savedSettings));
      }
    } catch (error) {
      console.error("Failed to load settings from localStorage", error);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleSave = () => {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
      toast({
        title: "Configurações Salvas!",
        description: "Suas alterações foram salvas com sucesso.",
      });
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Erro ao Salvar",
        description: "Não foi possível salvar as configurações.",
      });
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { id, value } = e.target;
    setSettings(prev => ({ ...prev, [id]: Number(value) }));
  };

  const handleBackup = () => {
    try {
      const backupData: Record<string, any> = {};
      APP_STORAGE_KEYS.forEach(key => {
        const data = localStorage.getItem(key);
        if (data) {
           // As configurações são um objeto, não um array, então precisam ser tratadas de forma diferente.
          if (key === SETTINGS_KEY) {
            backupData[key] = JSON.parse(data);
          } else {
            backupData[key] = JSON.parse(data);
          }
        }
      });

      const jsonString = JSON.stringify(backupData, null, 2);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      const date = new Date().toISOString().split('T')[0];
      link.href = url;
      link.download = `backup-assistec-now-${date}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      
      toast({ title: 'Backup Realizado!', description: 'O download do arquivo de backup foi iniciado.' });
    } catch (error) {
      console.error("Backup error:", error);
      toast({ variant: 'destructive', title: 'Erro no Backup', description: 'Não foi possível gerar o arquivo de backup.' });
    }
  };

  const handleRestoreClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelected = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file && file.type === 'application/json') {
      setBackupFile(file);
      setIsRestoreAlertOpen(true);
    } else {
      toast({ variant: 'destructive', title: 'Arquivo Inválido', description: 'Por favor, selecione um arquivo de backup JSON válido.' });
    }
     // Reset file input to allow selecting the same file again
    if(event.target) {
      event.target.value = '';
    }
  };

  const confirmRestore = () => {
    if (!backupFile) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result;
        if (typeof text !== 'string') {
          throw new Error('Could not read file content.');
        }
        const data = JSON.parse(text);

        const allKeysPresent = APP_STORAGE_KEYS.every(key => key in data);
        if (!allKeysPresent) {
          throw new Error('Arquivo de backup inválido ou corrompido.');
        }

        APP_STORAGE_KEYS.forEach(key => {
          localStorage.setItem(key, JSON.stringify(data[key]));
        });

        toast({ title: 'Restauração Concluída!', description: 'Os dados foram restaurados com sucesso. A página será recarregada.' });
        setTimeout(() => window.location.reload(), 2000);
      } catch (error: any) {
        toast({ variant: 'destructive', title: 'Erro na Restauração', description: error.message || 'Ocorreu um erro ao processar o arquivo de backup.' });
      } finally {
        setBackupFile(null);
        setIsRestoreAlertOpen(false);
      }
    };
    reader.readAsText(backupFile);
  };


  const handleClearSystem = () => {
    try {
      APP_STORAGE_KEYS.forEach(key => {
        localStorage.removeItem(key);
      });
      toast({ title: 'Sistema Limpo!', description: 'Todos os dados foram removidos. A página será recarregada.' });
      setTimeout(() => window.location.reload(), 2000);
    } catch (error) {
       toast({ variant: 'destructive', title: 'Erro', description: 'Não foi possível limpar os dados do sistema.' });
    }
    setIsClearAlertOpen(false);
  };

  if (isLoading) {
    return (
       <Card>
        <CardHeader>
          <CardTitle>Configurações</CardTitle>
          <CardDescription>
            Ajuste as configurações gerais do sistema.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-center justify-center">Carregando...</div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
    <Card>
      <CardHeader>
        <CardTitle>Configurações</CardTitle>
        <CardDescription>
          Ajuste as configurações gerais do sistema. As alterações são salvas localmente no seu navegador.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="p-4 border rounded-lg">
           <h3 className="text-lg font-semibold mb-2">Garantia</h3>
           <div className="space-y-2">
             <Label htmlFor="defaultWarrantyDays">Prazo de Garantia Padrão (em dias)</Label>
             <Input 
                id="defaultWarrantyDays" 
                type="number" 
                className="max-w-xs" 
                value={settings.defaultWarrantyDays}
                onChange={handleChange}
             />
             <p className="text-sm text-muted-foreground">
                Este valor será usado como padrão para os serviços que não tiverem uma garantia específica.
             </p>
           </div>
        </div>
      </CardContent>
      <CardFooter className="border-t px-6 py-4">
        <Button onClick={handleSave}>
            <Save className="mr-2 h-4 w-4" />
            Salvar Alterações
        </Button>
      </CardFooter>
    </Card>

    <Card className="border-destructive mt-6">
        <CardHeader>
             <div className="flex items-start gap-4">
                <div className="p-2 bg-destructive/10 rounded-full">
                    <AlertTriangle className="h-6 w-6 text-destructive" />
                </div>
                <div>
                    <CardTitle className="text-destructive">Zona de Perigo</CardTitle>
                    <CardDescription className="text-destructive/80">
                        As ações abaixo são irreversíveis. Tenha certeza do que está fazendo.
                    </CardDescription>
                </div>
             </div>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="p-4 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-semibold">Backup e Restauração</h4>
                    <p className="text-sm text-muted-foreground">
                        Salve uma cópia de segurança de todos os seus dados ou restaure a partir de um arquivo.
                    </p>
                </div>
                 <div className="flex-shrink-0 flex items-center gap-2">
                    <Button variant="outline" onClick={handleBackup}>
                        <Download className="mr-2 h-4 w-4"/>
                        Fazer Backup
                    </Button>
                     <Button variant="outline" onClick={handleRestoreClick}>
                        <Upload className="mr-2 h-4 w-4"/>
                        Restaurar
                    </Button>
                    <input
                        type="file"
                        ref={fileInputRef}
                        onChange={handleFileSelected}
                        className="hidden"
                        accept=".json"
                    />
                </div>
            </div>
             <div className="p-4 bg-destructive/5 border border-destructive/20 rounded-lg flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                    <h4 className="font-semibold">Limpar Sistema</h4>
                    <p className="text-sm text-muted-foreground">
                        Exclui permanentemente todos os clientes, OS, estoque, vendas e finanças.
                    </p>
                </div>
                 <div className="flex-shrink-0">
                    <Button variant="destructive" onClick={() => setIsClearAlertOpen(true)}>
                        <Trash2 className="mr-2 h-4 w-4" />
                        Limpar Todos os Dados
                    </Button>
                </div>
            </div>
        </CardContent>
    </Card>

    <AlertDialog open={isClearAlertOpen} onOpenChange={setIsClearAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Você tem certeza absoluta?</AlertDialogTitle>
            <AlertDialogDescription>
                Esta ação é irreversível e excluirá permanentemente TODOS os dados do sistema, incluindo clientes, ordens de serviço, estoque e registros financeiros. Não há como desfazer.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
                className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                onClick={handleClearSystem}
            >
                Sim, excluir tudo
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    <AlertDialog open={isRestoreAlertOpen} onOpenChange={setIsRestoreAlertOpen}>
        <AlertDialogContent>
            <AlertDialogHeader>
            <AlertDialogTitle>Confirmar Restauração</AlertDialogTitle>
            <AlertDialogDescription>
                Tem certeza que deseja restaurar os dados do arquivo <span className="font-bold">{backupFile?.name}</span>? Esta ação substituirá TODOS os dados atuais do sistema. Faça um backup antes, se necessário.
            </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setBackupFile(null)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={confirmRestore}>
                Sim, restaurar dados
            </AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
    </AlertDialog>

    </>
  )
}

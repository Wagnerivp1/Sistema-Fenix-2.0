
'use client';

import * as React from 'react';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useToast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

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
  )
}

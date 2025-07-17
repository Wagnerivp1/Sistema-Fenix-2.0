import Link from 'next/link';
import { AlertTriangle, Settings } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';

export function AlertsAndNotifications() {
  return (
    <Card className="h-full flex flex-col">
      <CardHeader>
        <CardTitle>Alertas e Notificações</CardTitle>
        <CardDescription>Avisos importantes do sistema.</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow flex flex-col gap-4">
        <div className="border-l-4 border-destructive bg-destructive/10 p-4 rounded-r-lg">
           <div className="flex items-start gap-3">
              <AlertTriangle className="h-5 w-5 text-destructive mt-1 flex-shrink-0" />
              <div>
                  <p className="font-semibold text-destructive">2 Produto(s) com baixo estoque</p>
                  <p className="text-sm text-destructive/80">
                    Verifique seu inventário para evitar falta de peças.
                  </p>
                   <Button variant="link" className="p-0 h-auto text-destructive/90 hover:text-destructive" asChild>
                     <Link href="/estoque">Ver estoque</Link>
                  </Button>
              </div>
            </div>
        </div>
         <div className="border-l-4 border-yellow-500 bg-yellow-500/10 p-4 rounded-r-lg">
           <div className="flex items-start gap-3">
              <Settings className="h-5 w-5 text-yellow-500 mt-1 flex-shrink-0" />
              <div>
                  <p className="font-semibold text-yellow-400">Ativar o Windows</p>
                  <p className="text-sm text-yellow-400/80">
                    Acesse Configurações para ativar o Windows.
                  </p>
              </div>
            </div>
        </div>
      </CardContent>
    </Card>
  );
}
